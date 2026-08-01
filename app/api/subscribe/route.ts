import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { z } from "zod";
import { analyzeResume, db, makeToken, sendWelcome } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  email: z.string().email().max(320),
  targetRole: z.string().min(2).max(120),
  targetCountry: z.string().min(2).max(100),
  deliveryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(2).max(100)
});

async function extractText(file: File): Promise<string> {
  const maxBytes = 7 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("Resume must be smaller than 7 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdf(bytes);
    return result.text;
  }
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return result.value;
  }
  if (file.type === "text/plain" || name.endsWith(".txt")) return bytes.toString("utf8");
  throw new Error("Only PDF, DOCX and TXT resumes are supported.");
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    if (form.get("consent") !== "on") return NextResponse.json({ error: "Consent is required." }, { status: 400 });
    const fields = schema.parse({
      email: form.get("email"),
      targetRole: form.get("targetRole"),
      targetCountry: form.get("targetCountry"),
      deliveryTime: form.get("deliveryTime"),
      timezone: form.get("timezone")
    });
    const file = form.get("resume");
    if (!(file instanceof File)) return NextResponse.json({ error: "Resume file is required." }, { status: 400 });

    const resumeText = (await extractText(file)).trim();
    if (resumeText.length < 120) return NextResponse.json({ error: "The resume contains too little readable text." }, { status: 400 });
    const profile = await analyzeResume(resumeText, fields.targetRole);
    const token = makeToken();
    const database = db();
    const { error } = await database.from("subscribers").upsert({
      email: fields.email.toLowerCase(),
      target_role: fields.targetRole,
      target_country: fields.targetCountry,
      delivery_time: fields.deliveryTime,
      timezone: fields.timezone,
      profile,
      minimum_score: 70,
      unsubscribe_token: token,
      active: true,
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: "email" });
    if (error) throw error;
    await sendWelcome(fields.email, fields.targetRole, token);

    return NextResponse.json({ message: "Your daily Job Match Agent is active. Check your inbox for confirmation." });
  } catch (error) {
    console.error("subscribe_failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check the submitted information." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not activate the agent." }, { status: 500 });
  }
}
