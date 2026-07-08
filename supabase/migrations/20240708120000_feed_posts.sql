-- Social feed posts with admin moderation
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_name text not null default 'You',
  user_handle text not null default 'you',
  avatar_color text not null default '#C44B2F',
  caption text not null,
  activity text not null
    check (activity in ('visited', 'at-event', 'recommends', 'checked-in')),
  place_id text,
  place_name text,
  place_category text,
  place_lat double precision,
  place_lng double precision,
  event_title text,
  neighborhood text not null,
  image_url text,
  image_color text not null default '#1A1528',
  image_emoji text not null default '✨',
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_status_created_idx
  on public.feed_posts (status, created_at desc);

alter table public.feed_posts enable row level security;

create policy "Public read approved feed posts"
  on public.feed_posts for select
  using (status = 'approved');

create policy "Anyone can submit pending feed posts"
  on public.feed_posts for insert
  with check (status = 'pending');
