create extension if not exists pgcrypto;

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  target_role text not null,
  target_country text not null,
  delivery_time text not null default '08:00',
  timezone text not null default 'UTC',
  profile jsonb not null,
  minimum_score integer not null default 70 check (minimum_score between 0 and 100),
  unsubscribe_token text not null unique,
  active boolean not null default true,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sent_jobs (
  id bigint generated always as identity primary key,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  job_key text not null,
  source text not null,
  external_id text not null,
  title text not null,
  url text not null,
  score integer not null check (score between 0 and 100),
  sent_at timestamptz not null default now(),
  unique (subscriber_id, job_key)
);

create index if not exists subscribers_active_idx on public.subscribers(active);
create index if not exists sent_jobs_subscriber_idx on public.sent_jobs(subscriber_id, sent_at desc);

alter table public.subscribers enable row level security;
alter table public.sent_jobs enable row level security;

-- No browser policies are intentionally created. The application accesses these
-- tables only through server routes using SUPABASE_SERVICE_ROLE_KEY.
