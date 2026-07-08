-- RVA Now initial schema

create extension if not exists "pgcrypto";

-- Published events (approved listings)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  neighborhood text not null,
  vibes text[] not null default '{}',
  day_label text not null,
  time_label text not null,
  venue text not null,
  price text not null default 'Free',
  featured boolean not null default false,
  hidden_gem boolean not null default false,
  sponsored boolean not null default false,
  trending_score integer not null default 0,
  time_windows text[] not null default '{}',
  source text not null default '',
  source_type text not null default 'community',
  description text not null default '',
  lat double precision not null,
  lng double precision not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Business / organizer submissions (moderation queue)
create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  neighborhood text not null,
  date_time text not null,
  venue text not null,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'featured', 'subscription')),
  pitch text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Weekly digest signups (email or SMS)
create table if not exists public.digest_signups (
  id uuid primary key default gen_random_uuid(),
  contact text not null,
  channel text not null check (channel in ('email', 'sms')),
  created_at timestamptz not null default now(),
  unique (contact, channel)
);

-- Curated lists (social discovery)
create table if not exists public.curated_lists (
  id text primary key,
  title text not null,
  by_line text not null,
  description text not null default '',
  items text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_neighborhood_idx on public.events (neighborhood);
create index if not exists events_trending_idx on public.events (trending_score desc);
create index if not exists event_submissions_status_idx on public.event_submissions (status);
create index if not exists digest_signups_created_idx on public.digest_signups (created_at desc);

alter table public.events enable row level security;
alter table public.event_submissions enable row level security;
alter table public.digest_signups enable row level security;
alter table public.curated_lists enable row level security;

-- Public read: published events only
create policy "Public can read published events"
  on public.events for select
  using (status = 'published');

-- Public read: curated lists
create policy "Public can read curated lists"
  on public.curated_lists for select
  using (true);

-- Anyone can submit an event listing
create policy "Public can submit events"
  on public.event_submissions for insert
  with check (true);

-- Required for insert...returning (app reads id after submit)
create policy "Public can read submissions"
  on public.event_submissions for select
  using (true);

-- Anyone can sign up for digest
create policy "Public can sign up for digest"
  on public.digest_signups for insert
  with check (true);

-- Service role handles moderation + publishing (no public update policies)
