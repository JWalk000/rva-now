-- ============================================================
-- Twice-daily Posh + Eventbrite sync (6 AM & 6 PM Eastern)
-- Paste into Supabase SQL Editor AFTER deploying sync-events
-- ============================================================
--
-- Prerequisites:
-- 1. Edge Function deployed: supabase functions deploy sync-events --no-verify-jwt
-- 2. Secrets set: SYNC_SECRET, EVENTBRITE_TOKEN, EVENTBRITE_ORG_IDS, POSH_EVENT_URLS
-- 3. Replace YOUR_SYNC_SECRET below with the real value
--
-- User-submitted events (source_platform = 'submission') and manual
-- curated events (source_platform = 'manual') are NEVER overwritten by sync.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove old jobs if re-running
select cron.unschedule(jobid) from cron.job where jobname in (
  'rva-now-sync-twice-daily',
  'rva-now-archive-stale',
  'rva-now-weekly-digest'
);

-- 10:00 & 22:00 UTC ≈ 6:00 AM & 6:00 PM US Eastern (EDT)
select cron.schedule(
  'rva-now-sync-twice-daily',
  '0 10,22 * * *',
  $$
  select net.http_post(
    url := 'https://edorsmasowlidwftzqnh.supabase.co/functions/v1/sync-events',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', 'YOUR_SYNC_SECRET'),
    body := '{}'::jsonb
  );
  select net.http_post(
    url := 'https://edorsmasowlidwftzqnh.supabase.co/functions/v1/archive-stale-events',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', 'YOUR_SYNC_SECRET'),
    body := '{}'::jsonb
  );
  $$
);

-- Sunday 9 AM Eastern — weekly digest email
select cron.schedule(
  'rva-now-weekly-digest',
  '0 13 * * 0',
  $$
  select net.http_post(
    url := 'https://edorsmasowlidwftzqnh.supabase.co/functions/v1/send-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', 'YOUR_SYNC_SECRET'),
    body := '{}'::jsonb
  );
  $$
);
