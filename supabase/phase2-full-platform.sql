-- ============================================================
-- RVA NOW — Phase 2 full platform
-- Paste into Supabase SQL Editor → Run (after setup-all + paste-ingestion-now)
-- ============================================================

-- ── Profiles (extends Supabase Auth) ────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  neighborhoods text[] not null default '{}',
  vibes text[] not null default '{}',
  push_enabled boolean not null default true,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ── Cloud saved events ────────────────────────────────────────
create table if not exists public.saved_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_slug)
);

alter table public.saved_events enable row level security;

create policy "Users manage own saves"
  on public.saved_events for all using (auth.uid() = user_id);

-- ── Push tokens ───────────────────────────────────────────────
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  token text not null unique,
  platform text not null default 'ios',
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Users manage own push tokens"
  on public.push_tokens for all using (auth.uid() = user_id);

-- ── Submission payments ───────────────────────────────────────
alter table public.event_submissions
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'waived')),
  add column if not exists stripe_session_id text,
  add column if not exists published_slug text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewer_note text;

-- ── Curated list → event slug links ───────────────────────────
alter table public.curated_lists
  add column if not exists event_slugs text[] not null default '{}';

update public.curated_lists set event_slugs = array[
  'rva-002','rva-004','rva-015'
] where id = 'date-night' and event_slugs = '{}';

update public.curated_lists set event_slugs = array[
  'rva-001','rva-003','rva-005','rva-012'
] where id = 'free-weekend' and event_slugs = '{}';

update public.curated_lists set event_slugs = array[
  'rva-007','rva-009','rva-008','rva-013'
] where id = 'hidden-gems' and event_slugs = '{}';

update public.curated_lists set event_slugs = array[
  'rva-004','rva-007','rva-013'
] where id = 'after-work' and event_slugs = '{}';

update public.curated_lists set event_slugs = array[
  'rva-006','rva-008','rva-005'
] where id = 'dog-friendly' and event_slugs = '{}';

update public.curated_lists set event_slugs = array[
  'rva-012','rva-015','rva-003'
] where id = 'black-owned' and event_slugs = '{}';

-- ── Full-text search on events ────────────────────────────────
alter table public.events
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(venue, '') || ' ' ||
      coalesce(neighborhood, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(source, '')
    )
  ) stored;

create index if not exists events_search_idx on public.events using gin (search_vector);

create or replace function public.search_events(query text, max_results int default 30)
returns setof public.events
language sql stable
as $$
  select *
  from public.events
  where status = 'published'
    and (
      query is null or trim(query) = ''
      or search_vector @@ plainto_tsquery('english', query)
      or title ilike '%' || query || '%'
      or venue ilike '%' || query || '%'
      or neighborhood ilike '%' || query || '%'
    )
  order by trending_score desc
  limit max_results;
$$;

-- ── Archive stale scraped events ──────────────────────────────
create or replace function public.archive_stale_events()
returns integer
language plpgsql security definer
as $$
declare
  archived_count integer;
begin
  update public.events
  set status = 'archived', updated_at = now()
  where status = 'published'
    and starts_at is not null
    and starts_at < now() - interval '1 day'
    and source_platform in ('posh', 'eventbrite');
  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

-- ── Publish approved submission ───────────────────────────────
create or replace function public.publish_submission(submission_id uuid)
returns text
language plpgsql security definer
as $$
declare
  sub record;
  new_slug text;
begin
  select * into sub from public.event_submissions where id = submission_id;
  if not found then raise exception 'Submission not found'; end if;
  if sub.status = 'approved' and sub.published_slug is not null then
    return sub.published_slug;
  end if;

  new_slug := 'sub-' || left(submission_id::text, 8);

  insert into public.events (
    slug, title, neighborhood, vibes, day_label, time_label, venue, price,
    featured, hidden_gem, sponsored, trending_score, time_windows,
    source, source_type, description, lat, lng, status,
    source_platform, source_url, starts_at
  ) values (
    new_slug,
    sub.title,
    sub.neighborhood,
    array['Food & Drink'],
    split_part(sub.date_time, ' ', 1),
    coalesce(nullif(split_part(sub.date_time, ' ', 2), ''), 'TBA'),
    sub.venue,
    'See listing',
    sub.tier in ('featured', 'subscription'),
    true,
    sub.tier in ('featured', 'subscription'),
    case when sub.tier = 'featured' then 85 when sub.tier = 'subscription' then 90 else 60 end,
    array['today', 'week', 'weekend'],
    sub.email,
    'organizer',
    sub.pitch,
    37.5407, -77.4360,
    'published',
    'submission',
    'https://rva-now.local/submissions/' || submission_id::text,
    now() + interval '2 days'
  )
  on conflict (slug) do update set
    title = excluded.title,
    neighborhood = excluded.neighborhood,
    venue = excluded.venue,
    description = excluded.description,
    sponsored = excluded.sponsored,
    featured = excluded.featured,
    updated_at = now();

  update public.event_submissions
  set status = 'approved', published_slug = new_slug, reviewed_at = now()
  where id = submission_id;

  return new_slug;
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
