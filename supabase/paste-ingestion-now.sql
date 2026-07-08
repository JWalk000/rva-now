-- ============================================================
-- PASTE THIS into Supabase SQL Editor → Run
-- Enables Posh/Eventbrite fields + adds scraped sample events
-- (Run once. Safe to re-run — uses IF NOT EXISTS / ON CONFLICT.)
-- ============================================================

-- 1. Add ingestion columns (skip if you already ran add-ingestion.sql)
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

-- 2. Fix partial run (rva-004 may have claimed the Posh external_id before insert failed)
update public.events set
  source_platform = 'manual',
  source_url = null,
  ticket_url = null,
  external_id = null,
  dedupe_key = null
where slug = 'rva-004'
  and external_id = 'sunset-soul-va-exclusive-sunday-funday-tour';

-- 3. Tag one seed event with Eventbrite (unique external_id — won't collide with step 5)
update public.events set
  source_platform = 'eventbrite',
  source_url = 'https://www.eventbrite.com/d/va--richmond/events/',
  ticket_url = 'https://www.eventbrite.com/d/va--richmond/events/',
  external_id = 'eventbrite-richmond-feed',
  dedupe_key = 'sunset on browns island|browns island|friday'
where slug = 'rva-001';

-- 4. Insert scraped Posh event (owns external_id sunset-soul-va-exclusive-sunday-funday-tour)
insert into public.events (
  slug, title, neighborhood, vibes, day_label, time_label, venue, price,
  featured, hidden_gem, sponsored, trending_score, time_windows,
  source, source_type, description, lat, lng, status,
  source_platform, source_url, ticket_url, external_id, starts_at, dedupe_key
) values (
  'posh-sunset-soul-va-exclusive-sunday-funday-tour',
  'Sunset & Soul VA Beach: Exclusive Sunday Funday Tour @ Krave',
  'Downtown',
  array['Live Music', 'Nightlife'],
  'Sunday',
  'See Posh',
  'Krave',
  'See Posh',
  false,
  true,
  false,
  78,
  array['week', 'weekend'],
  'Six Stars Entertainment',
  'organizer',
  'Posh - Get tickets for Sunset & Soul VA Beach: Exclusive Sunday Funday Tour @ Krave by Six Stars Entertainment - on Sun, May 31, 2026 - at Krave',
  37.5407,
  -77.436,
  'published',
  'posh',
  'https://posh.vip/e/sunset-soul-va-exclusive-sunday-funday-tour',
  'https://posh.vip/e/sunset-soul-va-exclusive-sunday-funday-tour',
  'sunset-soul-va-exclusive-sunday-funday-tour',
  '2026-05-31T00:00:00+00:00',
  'sunset soul va beach exclusive sunday funday tour|krave|2026-05-31'
)
on conflict (slug) do update set
  source_platform = excluded.source_platform,
  source_url = excluded.source_url,
  ticket_url = excluded.ticket_url,
  external_id = excluded.external_id,
  description = excluded.description,
  updated_at = now();

-- 5. Insert a real Eventbrite RVA event (manual seed until API sync is deployed)
insert into public.events (
  slug, title, neighborhood, vibes, day_label, time_label, venue, price,
  featured, hidden_gem, sponsored, trending_score, time_windows,
  source, source_type, description, lat, lng, status,
  source_platform, source_url, ticket_url, external_id, starts_at, dedupe_key
) values (
  'eventbrite-1989385659059',
  'RVA Juneteenth Dayparty Celebration 2026 at Ember Music Hall',
  'Downtown',
  array['Live Music', 'Nightlife', 'Food & Drink'],
  'Friday',
  '4:00 PM',
  'Ember Music Hall',
  'Varies',
  true,
  true,
  false,
  91,
  array['today', 'weekend', 'week'],
  'LX Group',
  'organizer',
  'RVA''s Biggest Dayparty Celebration at Ember Music Hall. Happy Hour sponsored by Don Julio Tequila. 21+.',
  37.540,
  -77.438,
  'published',
  'eventbrite',
  'https://www.eventbrite.com/e/rva-juneteenth-dayparty-celebration-2026-at-ember-music-hall-tickets-1989385659059',
  'https://www.eventbrite.com/e/rva-juneteenth-dayparty-celebration-2026-at-ember-music-hall-tickets-1989385659059',
  '1989385659059',
  '2026-06-19T20:00:00+00:00',
  'rva juneteenth dayparty celebration 2026|ember music hall|2026-06-19'
)
on conflict (slug) do update set
  source_platform = excluded.source_platform,
  source_url = excluded.source_url,
  ticket_url = excluded.ticket_url,
  updated_at = now();
