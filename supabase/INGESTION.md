# Event ingestion — Posh, Eventbrite, dedupe

## Not seeing Posh/Eventbrite events in the app?

The mobile app reads from **Supabase** — it does not scrape Posh or Eventbrite on the phone. Scraped events only appear after:

1. **Database columns exist** — run `paste-ingestion-now.sql` (or `add-ingestion.sql`)
2. **Data is in the `events` table** — either paste SQL sample rows **or** deploy + run the `sync-events` Edge Function
3. **Reload Expo Go** after SQL runs (pull down to refresh)

Right now your database has the original 15 seed events only. The Edge Function is **not deployed** yet (returns 404).

**Quick fix (2 minutes):** Supabase Dashboard → SQL Editor → paste all of `supabase/paste-ingestion-now.sql` → Run → reload the app.

You should then see:
- **Posh** badge on Scott's Addition Rooftop Mixer
- **Eventbrite** badge on Sunset on Brown's Island
- **New events** like "Sunset & Soul VA Beach…" (Posh) and "RVA Juneteenth Dayparty…" (Eventbrite)

---

## 1. Run database update

In Supabase SQL Editor, paste and run:

`supabase/add-ingestion.sql`

This adds:
- `source_url`, `ticket_url`, `source_platform`, `external_id`
- `duplicate_events` — log when a sync skips a duplicate
- `sync_runs` — log each ingestion run

## 2. Deploy the Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref edorsmasowlidwftzqnh
supabase functions deploy sync-events --no-verify-jwt
```

## 3. Set secrets (Supabase Dashboard → Edge Functions → sync-events → Secrets)

| Secret | Example | Purpose |
|--------|---------|---------|
| `EVENTBRITE_TOKEN` | `YOUR_PRIVATE_TOKEN` | Eventbrite API auth |
| `EVENTBRITE_ORG_IDS` | `123456789,987654321` | RVA organizer org IDs (comma-separated) |
| `POSH_EVENT_URLS` | `https://posh.vip/e/your-event-slug,...` | Posh event pages to ingest |
| `SYNC_SECRET` | `your-random-secret` | Protect manual sync calls |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically.

### Get Eventbrite org IDs

1. Find RVA organizers on Eventbrite
2. Use API: `GET /v3/users/me/organizations/` with your token
3. Add org IDs to `EVENTBRITE_ORG_IDS`

### Get Posh URLs

Posh has no public search API. Add individual event URLs:

```
https://posh.vip/e/your-event-slug
```

## 4. Run a sync

```bash
curl -X POST "https://edorsmasowlidwftzqnh.supabase.co/functions/v1/sync-events" \
  -H "x-sync-secret: your-random-secret"
```

Response example:

```json
{
  "eventbrite": { "inserted": 3, "updated": 0, "skipped_duplicates": 1, "errors": [] },
  "posh": { "inserted": 2, "updated": 0, "skipped_duplicates": 0, "errors": [] },
  "total_inserted": 5,
  "total_skipped_duplicates": 1
}
```

## 5. Duplicate detection

The sync skips (and logs) duplicates when:

1. **Same `external_id` + `source_platform`** — exact match from Posh/Eventbrite
2. **Same `dedupe_key`** — normalized title + venue + date
3. **Fuzzy match** — same title, venue, and day

View skipped duplicates in Supabase → **duplicate_events** table.

## 6. Schedule twice-daily sync

Paste `supabase/schedule-sync-twice-daily.sql` into the SQL Editor (replace `YOUR_SYNC_SECRET`).

Runs at **~6 AM and 6 PM Eastern** (10:00 & 22:00 UTC).

### What sync will NOT touch

Events with `source_platform` of **`submission`** (user/business uploads) or **`manual`** (curated seed/editorial) are skipped — scrapers never overwrite them.

Posh and Eventbrite rows continue to update on each sync (new listings, date changes, ticket URLs).
