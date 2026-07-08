# Phase 2 ops — auto-sync, moderation, cron

Run once after Stripe checkout is working.

## 1. Secrets (~3 min)

```powershell
cd c:\Users\jrwal\Documents\rva-now
copy supabase\.env.sync.example supabase\.env.sync
```

Edit `supabase/.env.sync`:

- `SYNC_SECRET` — any long random string (e.g. from a password generator)
- `ADMIN_SECRET` — different random string (for `apps/admin/index.html`)
- `POSH_EVENT_URLS` — comma-separated Posh event URLs to scrape

Upload:

```powershell
.\supabase\setup-ops-secrets.ps1
```

Or paste each key in [Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/edorsmasowlidwftzqnh/settings/functions).

## 2. Deploy functions (~2 min)

```powershell
npx supabase functions deploy sync-events --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy archive-stale-events --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy approve-submission --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy send-digest --no-verify-jwt --project-ref edorsmasowlidwftzqnh
```

## 3. Test manual sync

```powershell
$secret = "YOUR_SYNC_SECRET"
Invoke-RestMethod -Uri "https://edorsmasowlidwftzqnh.supabase.co/functions/v1/sync-events" -Method POST -Headers @{ "x-sync-secret" = $secret }
```

Check `sync_runs` table in Supabase for results.

## 4. Schedule twice-daily cron

After secrets are in `.env.sync`:

```powershell
.\supabase\setup-schedule.ps1
```

Then paste **`supabase/schedule-sync-ready.sql`** into [SQL Editor](https://supabase.com/dashboard/project/edorsmasowlidwftzqnh/sql/new) → **Run**

Jobs: sync + archive at 6 AM & 6 PM Eastern; weekly digest Sunday 9 AM Eastern.

## 5. Admin moderation (free submissions)

1. Open `apps/admin/index.html` in a browser
2. Supabase URL: `https://edorsmasowlidwftzqnh.supabase.co`
3. Anon key: from `apps/mobile/.env`
4. Admin secret: your `ADMIN_SECRET`
5. Approve/reject free listings; paid featured listings auto-publish via Stripe webhook

## Eventbrite (optional)

When you have an Eventbrite private token and organization IDs:

```
EVENTBRITE_TOKEN=...
EVENTBRITE_ORG_IDS=org_id_1,org_id_2
```

Re-run `setup-ops-secrets.ps1` and trigger sync.
