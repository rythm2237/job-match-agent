# Job Match Agent

Production-oriented job matching application built with Next.js, Supabase, OpenAI, Resend and Vercel Cron.

## What it does

1. Collects the user's email, target role, target country, preferred delivery time and timezone.
2. Accepts PDF, DOCX and TXT resumes up to 7 MB.
3. Extracts a structured candidate profile with OpenAI.
4. Does not persist the original resume file or raw resume text.
5. Searches Remotive and Arbeitnow, with optional Adzuna coverage.
6. Scores jobs against the target role, skills, seniority and location.
7. Emails only new jobs scoring at least 70%.
8. Prevents repeat notifications.
9. Includes unsubscribe and personal-data deletion links.

## Required services

- Vercel: hosting and hourly cron
- Supabase: PostgreSQL database
- OpenAI API: resume analysis
- Resend: transactional email
- Adzuna: optional additional job source

## Setup

### 1. Create the database

Create a Supabase project, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it once.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` for local development. In Vercel, add the same variables under **Project Settings → Environment Variables**.

Required:

- `APP_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`

Optional:

- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

Never commit real secret values.

### 3. Configure email

Verify a sending domain in Resend and set `EMAIL_FROM` to an address on that verified domain. During initial testing, use the sender configuration allowed by your Resend account.

### 4. Deploy

Import this GitHub repository into Vercel. Add the environment variables before promoting the deployment to production. Set `APP_URL` to the final production URL and redeploy after changing it.

The included `vercel.json` calls `/api/cron` every hour. Each run checks the subscriber's local timezone and sends jobs during the configured delivery hour.

### 5. Test

- Register with an email address you control.
- Confirm the welcome email arrives.
- Confirm the structured subscriber row is created in Supabase.
- Trigger `/api/cron` with `Authorization: Bearer <CRON_SECRET>`.
- Confirm qualifying jobs are emailed and added to `sent_jobs`.
- Run the cron again and confirm the same jobs are not sent twice.
- Test unsubscribe and deletion links.

## Security model

- All database writes use the Supabase service role only on server routes.
- Row Level Security is enabled and no browser-access policies are created.
- API keys remain server-side.
- Uploaded resume bytes and raw extracted text are processed in memory and discarded.
- Subscriber profiles contain only structured career information.

## Current source adapters

- Remotive: enabled without credentials
- Arbeitnow: enabled without credentials
- Adzuna: enabled when credentials and a supported country are configured

LinkedIn and other sites that prohibit unapproved scraping are intentionally not scraped.
