-- Business place listings ($5/mo via Stripe)
create table if not exists public.business_places (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text not null default '',
  neighborhood text not null,
  description text not null default '',
  email text not null,
  website text,
  address text,
  emoji text not null default '📍',
  lat double precision not null,
  lng double precision not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_session_id text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'canceled')),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_places_status_approved_idx
  on public.business_places (status, approved);

create index if not exists business_places_stripe_subscription_idx
  on public.business_places (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.business_places enable row level security;

-- Public map: active + approved listings only
create policy "Public read active approved business places"
  on public.business_places for select
  using (status = 'active' and approved = true);
