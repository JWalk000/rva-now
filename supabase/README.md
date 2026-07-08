# RVA Now — Supabase backend

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier works).
2. Wait for the database to finish provisioning.

## 2. Run the schema

Open **SQL Editor** in your Supabase dashboard and run these files in order:

1. `migrations/20240609000000_initial.sql` — tables + RLS policies
2. `seed.sql` — 15 launch events + 6 curated lists

## 3. Connect the mobile app

In `apps/mobile/`:

```bash
cp .env.example .env
```

Fill in from **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

Restart Expo after changing `.env`:

```bash
npx expo start -c
```

## Tables

| Table | Purpose |
|-------|---------|
| `events` | Published, approved listings (app reads these) |
| `event_submissions` | Business form → moderation queue |
| `digest_signups` | Weekly email/SMS signups |
| `curated_lists` | Social discovery lists |

## Moderation workflow (manual for now)

1. Business submits via app → row in `event_submissions` with `status = pending`
2. Review in Supabase Table Editor
3. Copy approved submission into `events` table (or build admin UI in Phase 3)
4. Set `status = published` on the event

## Viewing signups & submissions

In Supabase dashboard:

- **digest_signups** — retention pipeline
- **event_submissions** — supply-side growth / cold-start content
