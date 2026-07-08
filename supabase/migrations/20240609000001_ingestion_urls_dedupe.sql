-- URL fields, platform tracking, and duplicate detection

alter table public.events
  add column if not exists source_url text,
  add column if not exists ticket_url text,
  add column if not exists source_platform text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists starts_at timestamptz,
  add column if not exists dedupe_key text;

create unique index if not exists events_platform_external_id_idx
  on public.events (source_platform, external_id)
  where external_id is not null;

create index if not exists events_dedupe_key_idx on public.events (dedupe_key);

-- Log when sync skips a duplicate
create table if not exists public.duplicate_events (
  id uuid primary key default gen_random_uuid(),
  incoming_title text not null,
  incoming_venue text not null,
  incoming_platform text not null,
  incoming_external_id text,
  incoming_source_url text,
  matched_event_id uuid references public.events (id) on delete set null,
  match_reason text not null,
  created_at timestamptz not null default now()
);

-- Track each sync run
create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_duplicates integer not null default 0,
  error_count integer not null default 0,
  details jsonb not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.duplicate_events enable row level security;
alter table public.sync_runs enable row level security;

-- Service role only for sync tables (no public policies)
