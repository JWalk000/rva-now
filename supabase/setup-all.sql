-- ============================================================
-- RVA NOW — paste ALL of this into Supabase SQL Editor → Run
-- ============================================================

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

create policy "Public can read published events"
  on public.events for select
  using (status = 'published');

create policy "Public can read curated lists"
  on public.curated_lists for select
  using (true);

create policy "Public can submit events"
  on public.event_submissions for insert
  with check (true);

create policy "Public can read submissions"
  on public.event_submissions for select
  using (true);

create policy "Public can sign up for digest"
  on public.digest_signups for insert
  with check (true);

-- Seed events
insert into public.events (slug, title, neighborhood, vibes, day_label, time_label, venue, price, featured, hidden_gem, sponsored, trending_score, time_windows, source, source_type, description, lat, lng) values
('rva-001', 'Sunset on Brown''s Island', 'Downtown', array['Live Music','Free'], 'Friday', '7:00 PM', 'Brown''s Island', 'Free', true, false, true, 92, array['today','weekend','week'], 'Downtown venue', 'venue', 'Riverfront concert with food trucks and downtown views.', 37.533, -77.441),
('rva-002', 'Carytown Dessert Crawl', 'Carytown', array['Food & Drink'], 'Saturday', '2:00 PM', 'Carytown Mile', '$15+', true, true, false, 88, array['weekend','week'], 'Local business', 'business', 'Self-guided dessert stops and small-shop promos.', 37.553, -77.484),
('rva-003', 'Church Hill Makers Market', 'Church Hill', array['Markets','Family','Free'], 'Sunday', '11:00 AM', 'Jefferson Park', 'Free', false, true, false, 76, array['weekend','week'], 'Community group', 'community', 'Handmade goods, local coffee, and neighborhood vendors.', 37.531, -77.421),
('rva-004', 'Scott''s Addition Rooftop Mixer', 'Scott''s Addition', array['Networking','Nightlife'], 'Thursday', '6:30 PM', 'Rooftop Lounge', '$25', true, false, true, 85, array['today','week','weekend'], 'Partner venue', 'venue', 'Post-work networking with founders and creatives.', 37.568, -77.469),
('rva-005', 'Fan District Porch Sessions', 'The Fan', array['Live Music','Free'], 'Saturday', '5:00 PM', 'Hanover Ave', 'Free', false, true, false, 71, array['weekend','week'], 'Community', 'community', 'Acoustic sets in a walkable Fan pocket.', 37.555, -77.463),
('rva-006', 'Manchester Morning Run Club', 'Manchester', array['Fitness','Free'], 'Wednesday', '6:30 AM', 'Floodwall Parking Lot', 'Free', false, false, false, 62, array['today','week'], 'Community', 'community', 'Social run with coffee after the route.', 37.522, -77.449),
('rva-007', 'After-Work Trivia at Wonderland', 'Church Hill', array['Food & Drink','Nightlife'], 'Tuesday', '7:00 PM', 'Wonderland', 'Free', false, true, false, 68, array['today','week'], 'Bar & venue', 'venue', 'Low-key trivia night locals actually show up for.', 37.528, -77.418),
('rva-008', 'Downtown Food Truck Row', 'Downtown', array['Food & Drink','Free'], 'Today', '11:30 AM', '7th Street Plaza', 'Free entry', false, true, false, 80, array['today','week','weekend'], 'Pop-up vendors', 'popup', 'Rotating trucks and quick lunch options.', 37.538, -77.434),
('rva-009', 'Carytown Vinyl Night', 'Carytown', array['Live Music','Nightlife'], 'Friday', '8:00 PM', 'Deep Groove Records', 'Free', false, true, false, 74, array['today','weekend','week'], 'Local business', 'business', 'In-store listening party and local DJ sets.', 37.554, -77.486),
('rva-010', 'Family Story Hour at Library', 'The Fan', array['Family','Free'], 'Saturday', '10:00 AM', 'Richmond Public Library', 'Free', false, false, false, 55, array['weekend','week'], 'Community', 'community', 'Morning story time for kids under 8.', 37.552, -77.461),
('rva-011', 'SA Brewery Tour & Tasting', 'Scott''s Addition', array['Food & Drink','Nightlife'], 'Saturday', '1:00 PM', 'Brewery Row', '$20', true, false, true, 90, array['weekend','week'], 'Venue partner', 'venue', 'Guided tasting across three Scott''s Addition breweries.', 37.566, -77.472),
('rva-012', 'Manchester Night Market', 'Manchester', array['Markets','Food & Drink','Free'], 'Friday', '5:00 PM', 'Hull Street', 'Free', false, true, false, 83, array['today','weekend','week'], 'Market organizer', 'market', 'Small vendors, live DJ, and walkable street energy.', 37.52, -77.446),
('rva-013', 'Startup Coffee Chat', 'Downtown', array['Networking','Free'], 'Today', '8:30 AM', 'CoLab Cafe', 'Free', false, true, false, 64, array['today','week'], 'Organizer submission', 'organizer', 'Casual founder meetup before the workday.', 37.536, -77.438),
('rva-014', 'Sunrise Yoga at Belle Isle', 'Manchester', array['Fitness','Free'], 'Sunday', '8:00 AM', 'Belle Isle', 'Free', false, false, false, 70, array['weekend','week'], 'Community', 'community', 'Outdoor yoga with river views. Bring a mat.', 37.525, -77.455),
('rva-015', 'Church Hill Jazz Brunch', 'Church Hill', array['Live Music','Food & Drink'], 'Sunday', '11:00 AM', 'The Hill Cafe', '$18+', true, false, false, 87, array['weekend','week'], 'Restaurant partner', 'business', 'Live jazz trio and neighborhood brunch crowd.', 37.53, -77.419)
on conflict (slug) do nothing;

-- Seed curated lists
insert into public.curated_lists (id, title, by_line, description, items, sort_order) values
('date-night', 'Date night in RVA', 'RVA Now', 'Walkable dinners, drinks, and low-pressure plans.', array['Carytown Dessert Crawl','Scott''s Addition Rooftop Mixer','Church Hill Jazz Brunch'], 1),
('free-weekend', 'Free things this weekend', 'RVA Now', 'No cover, no excuse.', array['Sunset on Brown''s Island','Church Hill Makers Market','Fan District Porch Sessions','Manchester Night Market'], 2),
('hidden-gems', 'Hidden local gems', 'Neighborhood curators', 'Smaller events big platforms miss.', array['After-Work Trivia at Wonderland','Carytown Vinyl Night','Downtown Food Truck Row','Startup Coffee Chat'], 3),
('after-work', 'Things to do after work', 'RVA Now', 'Weeknight-friendly and close to downtown.', array['Scott''s Addition Rooftop Mixer','After-Work Trivia at Wonderland','Startup Coffee Chat'], 4),
('dog-friendly', 'Dog-friendly spots & events', 'Community picks', 'Bring the pup — patios and parks welcome.', array['Manchester Morning Run Club','Downtown Food Truck Row','Fan District Porch Sessions'], 5),
('black-owned', 'Black-owned events & businesses', 'RVA Now', 'Support and discover local Black-owned happenings.', array['Manchester Night Market','Church Hill Jazz Brunch','Church Hill Makers Market'], 6)
on conflict (id) do nothing;
