import { NextResponse } from "next/server";
import { collectJobs, db, Profile, scoreJob, sendDigest } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function isDeliveryHour(timezone: string, deliveryTime: string): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const hour = parts.find(part => part.type === "hour")?.value;
    const targetHour = deliveryTime.slice(0, 2);
    return hour === targetHour;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const database = db();
  const { data: subscribers, error } = await database.from("subscribers").select("*").eq("active", true);
  if (error) throw error;

  const report = { checked: subscribers?.length || 0, delivered: 0, matches: 0, failures: 0 };
  for (const subscriber of subscribers || []) {
    if (!isDeliveryHour(subscriber.timezone, subscriber.delivery_time)) continue;
    try {
      const jobs = await collectJobs(subscriber.target_role, subscriber.target_country);
      const scored = jobs.map(job => scoreJob(job, subscriber.profile as Profile, subscriber.target_role, subscriber.target_country)).filter(job => job.score >= subscriber.minimum_score).sort((a, b) => b.score - a.score).slice(0, 15);
      if (!scored.length) continue;

      const keys = scored.map(job => `${job.source}:${job.externalId}`);
      const { data: sentRows } = await database.from("sent_jobs").select("job_key").eq("subscriber_id", subscriber.id).in("job_key", keys);
      const alreadySent = new Set((sentRows || []).map(row => row.job_key));
      const fresh = scored.filter(job => !alreadySent.has(`${job.source}:${job.externalId}`));
      if (!fresh.length) continue;

      await sendDigest(subscriber.email, subscriber.target_role, fresh, subscriber.unsubscribe_token);
      const { error: insertError } = await database.from("sent_jobs").insert(fresh.map(job => ({
        subscriber_id: subscriber.id,
        job_key: `${job.source}:${job.externalId}`,
        source: job.source,
        external_id: job.externalId,
        title: job.title,
        url: job.url,
        score: job.score
      })));
      if (insertError) throw insertError;
      report.delivered += 1;
      report.matches += fresh.length;
    } catch (error) {
      report.failures += 1;
      console.error("subscriber_cron_failed", subscriber.id, error instanceof Error ? error.message : "unknown");
    }
  }
  return NextResponse.json(report);
}
