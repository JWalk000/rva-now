-- Phase 4: Ticket sales (organizer-submitted events only)
-- Run in Supabase SQL Editor after phase2-full-platform.sql

alter table public.event_submissions
  add column if not exists ticketing_enabled boolean not null default false;

alter table public.events
  add column if not exists sells_tickets boolean not null default false,
  add column if not exists submission_id uuid references public.event_submissions (id) on delete set null;

-- Stripe Connect accounts for organizers (keyed by submit email)
create table if not exists public.organizer_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  stripe_account_id text unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizer_accounts_stripe_idx on public.organizer_accounts (stripe_account_id);

-- Ticket inventory (created at submit, linked to event on publish)
create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.event_submissions (id) on delete cascade,
  event_slug text references public.events (slug) on delete set null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity > 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ticket_types_event_slug_idx on public.ticket_types (event_slug);
create index if not exists ticket_types_submission_idx on public.ticket_types (submission_id);

-- Checkout orders
create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types (id),
  event_slug text not null,
  buyer_email text not null,
  quantity integer not null check (quantity > 0),
  subtotal_cents integer not null,
  platform_fee_cents integer not null,
  total_cents integer not null,
  stripe_session_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists ticket_orders_email_idx on public.ticket_orders (buyer_email);
create index if not exists ticket_orders_session_idx on public.ticket_orders (stripe_session_id);

-- Individual tickets (QR / Wallet / email)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ticket_orders (id) on delete cascade,
  ticket_code text not null unique,
  event_slug text not null,
  event_title text not null,
  ticket_type_name text not null,
  venue text not null,
  event_day text not null,
  event_time text not null,
  buyer_email text not null,
  status text not null default 'valid' check (status in ('valid', 'used', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists tickets_code_idx on public.tickets (ticket_code);
create index if not exists tickets_buyer_email_idx on public.tickets (buyer_email);

alter table public.organizer_accounts enable row level security;
alter table public.ticket_types enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.tickets enable row level security;

drop policy if exists "Public read ticket types" on public.ticket_types;
create policy "Public read ticket types"
  on public.ticket_types for select using (active = true);

drop policy if exists "Public read own tickets by email" on public.tickets;
create policy "Public read own tickets by email"
  on public.tickets for select using (true);

drop policy if exists "Public read organizer account status" on public.organizer_accounts;
create policy "Public read organizer account status"
  on public.organizer_accounts for select using (true);

drop policy if exists "Public insert ticket types" on public.ticket_types;
create policy "Public insert ticket types"
  on public.ticket_types for insert
  with check (
    exists (
      select 1 from public.event_submissions s where s.id = submission_id
    )
  );

-- Link ticket types + event flags when a submission is published
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
    source_platform, source_url, starts_at, sells_tickets, submission_id
  ) values (
    new_slug,
    sub.title,
    sub.neighborhood,
    array['Food & Drink'],
    split_part(sub.date_time, ' ', 1),
    coalesce(nullif(split_part(sub.date_time, ' ', 2), ''), 'TBA'),
    sub.venue,
    case when sub.ticketing_enabled then 'Tickets on RVA Now' else 'See listing' end,
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
    now() + interval '2 days',
    coalesce(sub.ticketing_enabled, false),
    submission_id
  )
  on conflict (slug) do update set
    title = excluded.title,
    neighborhood = excluded.neighborhood,
    venue = excluded.venue,
    description = excluded.description,
    sponsored = excluded.sponsored,
    featured = excluded.featured,
    sells_tickets = excluded.sells_tickets,
    submission_id = excluded.submission_id,
    price = excluded.price,
    updated_at = now();

  update public.ticket_types
  set event_slug = new_slug
  where submission_id = publish_submission.submission_id;

  update public.event_submissions
  set status = 'approved', published_slug = new_slug, reviewed_at = now()
  where id = submission_id;

  return new_slug;
end;
$$;
