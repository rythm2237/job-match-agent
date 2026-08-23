# Job Match Agent — Mobile SaaS MVP

## Product principle
The product must feel like a guided job-search service, not an AI-agent control panel. Users should understand what the product is doing without needing to know how agents work.

## V1 value proposition
Upload or import a CV, choose what kind of work you want, choose where you want to work, and receive a curated daily list of live jobs with a transparent fit score and a prepared application pack.

## Mobile UX
### 1. Welcome
- One clear promise: "Your job search, prepared for you."
- Continue with Apple / Google / email.
- Explain privacy in one sentence before any personal-data collection.

### 2. Guided setup wizard
Prefer controls, chips, sliders and pickers over free typing.

Steps:
1. CV import: Files / cloud import / skip for now.
2. Target roles: suggested role chips derived from CV, plus search.
3. Location: countries, cities, remote/hybrid/on-site, relocation.
4. Language: language + proficiency chips.
5. Role level: individual contributor / lead / manager / seniority.
6. Preferences: permanent/contract, industries, exclusions.
7. Application mode: Discover / Prepare / Assisted.
8. Notifications: instant high-fit alert + daily digest time.
9. Review: show a single summary card before activation.

Users can always choose "Ask me when needed" for consequential fields such as salary, sponsorship and relocation commitments.

### 3. Home
The home screen answers four questions only:
- What did we find?
- What is worth my attention?
- What is ready to apply?
- Does anything need my decision?

Primary cards:
- Strong matches
- Ready to apply
- Applications
- Needs your input

### 4. Job detail
- Fit score with reasons, not a black-box number.
- Strengths / gaps.
- Verified-live status.
- Job-source and last verification time.
- Application pack preview.
- Primary CTA based on status: Prepare / Review / Continue application / Open employer site.

### 5. Application pack
- Tailored CV
- Tailored portfolio
- Short cover note
- Screening-answer sheet
- Employer application link
- Never claim "Applied" unless submission actually succeeds.

### 6. Activity
Timeline of Discovered → Prepared → Ready → Applied → Recruiter response.

### 7. Settings
- Search preferences
- Notification time/timezone
- Automation level
- Privacy/data controls
- Export data
- Delete account
- Subscription

## Architecture
### Existing web/backend
Keep the existing Next.js/Vercel service as the API/control plane during V1. Reuse existing job adapters and scheduled search logic.

### Mobile
React Native + Expo + Expo Router.

### Backend/data
Supabase EU region for Auth, PostgreSQL, RLS and private file storage. Do not expose service-role keys in clients.

### AI
Use a tiered model strategy:
- low-cost model for extraction/classification and first-pass matching;
- stronger model only for final fit explanation and application-tailoring tasks.
Use structured JSON outputs validated server-side.

### Job-source policy
Use licensed/public APIs and employer pages that permit access. Do not implement prohibited LinkedIn scraping. Store source, external id, URL, retrieved_at and verified_at for each vacancy.

### Verification gate
Search result != live vacancy. Before an opportunity becomes actionable, server must verify the exact employer/ATS page and record verification status and timestamp.

## Security baseline
- Supabase RLS on every user-owned table.
- Private storage buckets with signed URLs.
- Server-side secrets only.
- Encrypt sensitive values in transit; TLS everywhere.
- Do not log raw CV text, tokens or secrets.
- Minimise personal data.
- Explicit retention policy for generated documents.
- Rate limiting on auth, CV processing, job search and generation APIs.
- Audit events for application-state mutations.
- Account deletion must cascade/anonymise as defined by retention law.
- Separate production and development projects.
- Dependency/security scanning in CI.

## Legal/product compliance baseline
Before public launch:
- Privacy Policy (GDPR/UK GDPR compatible).
- Terms of Service.
- Cookie/SDK disclosure for web where applicable.
- Subprocessor list.
- Data Processing information and lawful-basis mapping.
- User access/export/deletion flow.
- Retention schedule.
- Contact/support route.
- AI transparency: generated ranking and documents are recommendations, not guarantees.
- Job-source attribution/licence compliance.
- App Store privacy nutrition labels / Google Data Safety form.
- Subscription cancellation and billing disclosures.
- Age policy (V1 recommendation: 18+).

This document is an engineering/product baseline, not jurisdiction-specific legal advice; launch copy should be reviewed against the actual company/legal entity and jurisdictions served.

## Commercial V1
Recommended pricing hypothesis:
- Free: onboarding + limited matches, no daily automation.
- Pro: EUR 14.99/month or EUR 119/year. Daily search, live verification, fit scoring, application packs and alerts.
- Pro+ later: EUR 24.99/month for higher search/application quotas and recruiter-response automation.

Start with Free + Pro only. Avoid plan complexity before product-market validation.

## V1 release boundary
Include:
- Auth
- Wizard onboarding
- CV ingestion/profile extraction
- Preferences
- Job discovery
- Live-link verification
- Fit scoring/explanation
- Job detail
- Saved jobs
- Application pack generation
- Application status tracking
- Push/email notification preferences
- Daily digest
- Subscription/paywall
- Legal/privacy/account deletion

Defer:
- Fully autonomous browser form submission
- LinkedIn scraping
- Complex interview coaching
- Full CV builder/editor
- Social/community features
- Multi-agent UI
