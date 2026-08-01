import "server-only";
import crypto from "node:crypto";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export type Profile = {
  summary: string;
  skills: string[];
  jobTitles: string[];
  industries: string[];
  seniority: string;
  yearsExperience: number;
  languages: string[];
  keywords: string[];
};

export type Job = {
  source: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  publishedAt?: string;
};

export type ScoredJob = Job & {
  score: number;
  reasons: string[];
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function db() {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function analyzeResume(text: string, targetRole: string): Promise<Profile> {
  const client = new OpenAI({ apiKey: required("OPENAI_API_KEY") });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Extract a concise structured candidate profile from a resume. Return JSON only with keys summary, skills, jobTitles, industries, seniority, yearsExperience, languages, keywords. Arrays must contain short normalized strings. Never infer protected traits."
      },
      { role: "user", content: `Target role: ${targetRole}\n\nResume:\n${text.slice(0, 50000)}` }
    ]
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Resume analysis returned no content.");
  const parsed = JSON.parse(content) as Partial<Profile>;
  return {
    summary: String(parsed.summary || ""),
    skills: normalizeArray(parsed.skills),
    jobTitles: normalizeArray(parsed.jobTitles),
    industries: normalizeArray(parsed.industries),
    seniority: String(parsed.seniority || "unspecified"),
    yearsExperience: Number(parsed.yearsExperience || 0),
    languages: normalizeArray(parsed.languages),
    keywords: normalizeArray(parsed.keywords)
  };
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => String(item).trim()).filter(Boolean))].slice(0, 80);
}

function cleanHtml(value: string): string {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, headers: { "User-Agent": "JobMatchAgent/1.0", ...(init?.headers || {}) }, cache: "no-store" });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function remotive(role: string): Promise<Job[]> {
  const data = await fetchJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=50`);
  return (data.jobs || []).map((job: any) => ({
    source: "Remotive",
    externalId: String(job.id),
    title: String(job.title || ""),
    company: String(job.company_name || "Unknown"),
    location: String(job.candidate_required_location || "Remote"),
    url: String(job.url || ""),
    description: cleanHtml(String(job.description || "")),
    publishedAt: job.publication_date
  }));
}

async function arbeitnow(role: string): Promise<Job[]> {
  const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api");
  const words = tokenize(role);
  return (data.data || []).filter((job: any) => words.some(word => `${job.title} ${job.description}`.toLowerCase().includes(word))).slice(0, 50).map((job: any) => ({
    source: "Arbeitnow",
    externalId: String(job.slug || job.url),
    title: String(job.title || ""),
    company: String(job.company_name || "Unknown"),
    location: String(job.location || (job.remote ? "Remote" : "Unknown")),
    url: String(job.url || ""),
    description: cleanHtml(String(job.description || "")),
    publishedAt: job.created_at ? new Date(Number(job.created_at) * 1000).toISOString() : undefined
  }));
}

async function adzuna(role: string, country: string): Promise<Job[]> {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return [];
  const countryCode = mapAdzunaCountry(country);
  if (!countryCode) return [];
  const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${encodeURIComponent(process.env.ADZUNA_APP_ID)}&app_key=${encodeURIComponent(process.env.ADZUNA_APP_KEY)}&results_per_page=50&what=${encodeURIComponent(role)}&where=${encodeURIComponent(country)}`;
  const data = await fetchJson(url);
  return (data.results || []).map((job: any) => ({
    source: "Adzuna",
    externalId: String(job.id),
    title: String(job.title || ""),
    company: String(job.company?.display_name || "Unknown"),
    location: String(job.location?.display_name || country),
    url: String(job.redirect_url || ""),
    description: cleanHtml(String(job.description || "")),
    publishedAt: job.created
  }));
}

function mapAdzunaCountry(country: string): string | null {
  const map: Record<string, string> = { austria: "at", australia: "au", brazil: "br", canada: "ca", france: "fr", germany: "de", india: "in", italy: "it", netherlands: "nl", "new zealand": "nz", poland: "pl", singapore: "sg", "south africa": "za", "united kingdom": "gb", usa: "us", "united states": "us" };
  return map[country.toLowerCase()] || null;
}

export async function collectJobs(role: string, country: string): Promise<Job[]> {
  const results = await Promise.allSettled([remotive(role), arbeitnow(role), adzuna(role, country)]);
  const jobs = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  const unique = new Map<string, Job>();
  for (const job of jobs) {
    if (!job.title || !job.url) continue;
    unique.set(`${job.source}:${job.externalId}`, job);
  }
  return [...unique.values()];
}

function tokenize(value: string): string[] {
  const stop = new Set(["and", "the", "for", "with", "from", "this", "that", "your", "you", "our", "are", "will", "job", "role", "work", "experience"]);
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9+#. -]/g, " ").split(/\s+/).map(word => word.trim()).filter(word => word.length > 2 && !stop.has(word)))];
}

export function scoreJob(job: Job, profile: Profile, targetRole: string, targetCountry: string): ScoredJob {
  const titleTokens = tokenize(job.title);
  const body = `${job.title} ${job.description} ${job.company} ${job.location}`.toLowerCase();
  const roleTokens = tokenize(targetRole);
  const skills = normalizeArray([...profile.skills, ...profile.keywords]).map(item => item.toLowerCase());
  const roleHits = roleTokens.filter(token => body.includes(token));
  const skillHits = skills.filter(skill => skill.length > 2 && body.includes(skill));
  const titleHitRatio = roleTokens.length ? roleHits.length / roleTokens.length : 0;
  const skillHitRatio = skills.length ? Math.min(skillHits.length / Math.min(skills.length, 12), 1) : 0;
  const locationText = job.location.toLowerCase();
  const locationMatch = targetCountry.toLowerCase() === "remote" || locationText.includes("remote") || locationText.includes(targetCountry.toLowerCase());
  const seniorityMatch = profile.seniority && body.includes(profile.seniority.toLowerCase()) ? 1 : 0.5;
  const exactTitleBonus = titleTokens.some(token => roleTokens.includes(token)) ? 1 : 0;
  const score = Math.round(Math.min(100, 45 * titleHitRatio + 35 * skillHitRatio + 10 * Number(locationMatch) + 5 * seniorityMatch + 5 * exactTitleBonus));
  const reasons = [
    roleHits.length ? `Role terms: ${roleHits.slice(0, 4).join(", ")}` : "Related role wording",
    skillHits.length ? `Skills: ${skillHits.slice(0, 5).join(", ")}` : "Transferable experience",
    locationMatch ? "Location preference matched" : "Location may require review"
  ];
  return { ...job, score, reasons };
}

export function makeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendWelcome(email: string, role: string, unsubscribeToken: string) {
  const resend = new Resend(required("RESEND_API_KEY"));
  const baseUrl = required("APP_URL");
  await resend.emails.send({
    from: required("EMAIL_FROM"),
    to: email,
    subject: "Your Job Match Agent is active",
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1>Your daily search is active</h1><p>We will search for <strong>${escapeHtml(role)}</strong> roles and email only new matches scoring at least 70%.</p><p><a href="${baseUrl}/api/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a></p></div>`
  });
}

export async function sendDigest(email: string, role: string, jobs: ScoredJob[], unsubscribeToken: string) {
  const resend = new Resend(required("RESEND_API_KEY"));
  const baseUrl = required("APP_URL");
  const cards = jobs.map(job => `<div style="border:1px solid #d7e0e7;border-radius:10px;padding:18px;margin:14px 0"><h2 style="margin:0 0 6px">${escapeHtml(job.title)}</h2><p style="margin:0 0 10px">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p><strong>${job.score}% match</strong><ul>${job.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join("")}</ul><a href="${job.url}">View job</a></div>`).join("");
  await resend.emails.send({
    from: required("EMAIL_FROM"),
    to: email,
    subject: `${jobs.length} new ${role} job match${jobs.length === 1 ? "" : "es"}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><h1>Your new job matches</h1>${cards}<hr/><p style="font-size:12px"><a href="${baseUrl}/api/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a> · <a href="${baseUrl}/api/delete?token=${unsubscribeToken}">Delete my data</a></p></div>`
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char] || char));
}
