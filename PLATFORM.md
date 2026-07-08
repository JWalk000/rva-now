# RVA Now — Full Platform Setup

Everything added in Phase 2: auth, search, location, cloud saves, moderation, Stripe, digest, push, admin, twice-daily sync.

## 1. Database (Supabase SQL Editor)

Run in order:

1. `supabase/setup-all.sql` (if fresh)
2. `supabase/paste-ingestion-now.sql`
3. `supabase/phase2-full-platform.sql`

## 2. Enable Supabase Auth

Dashboard → Authentication → Providers → enable **Email** (magic link).

Redirect URL: `rvanow://auth`

## 3. Deploy Edge Functions

```bash
npx supabase login
npx supabase link --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy sync-events --no-verify-jwt
npx supabase functions deploy archive-stale-events --no-verify-jwt
npx supabase functions deploy send-digest --no-verify-jwt
npx supabase functions deploy approve-submission --no-verify-jwt
npx supabase functions deploy create-checkout --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

## 4. Secrets (Edge Functions)

| Secret | Purpose |
|--------|---------|
| `SYNC_SECRET` | Protect sync, archive, digest cron |
| `ADMIN_SECRET` | Admin dashboard + approve/reject |
| `EVENTBRITE_TOKEN` | Eventbrite API |
| `EVENTBRITE_ORG_IDS` | Comma-separated org IDs |
| `POSH_EVENT_URLS` | Comma-separated Posh event URLs |
| `RESEND_API_KEY` | Weekly digest emails |
| `DIGEST_FROM_EMAIL` | e.g. `digest@yourdomain.com` |
| `STRIPE_SECRET_KEY` | Featured/subscription checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification (optional) |

## 5. Schedule jobs

Paste `supabase/schedule-sync-twice-daily.sql` (replace `YOUR_SYNC_SECRET`).

- **Twice daily** (~6 AM & 6 PM Eastern): Posh/Eventbrite sync + stale archive
- **Sunday 9 AM Eastern**: weekly digest email

## 6. Stripe

1. Create products for Featured ($25) and Subscription ($50/mo) — or use dynamic checkout (already coded)
2. Webhook endpoint: `https://edorsmasowlidwftzqnh.supabase.co/functions/v1/stripe-webhook`
3. Event: `checkout.session.completed`

## 7. Mobile app

```bash
cd apps/mobile
npm install
npm run start:lan
```

New features in app:
- Onboarding (first launch)
- Search bar on Discover
- Location-based "Trending near you"
- Account / magic-link sign-in
- Cloud saved events (when signed in)
- Curated lists → tap to open events
- Add to calendar on event detail
- Share with `rvanow://event/{id}` deep links
- Push notification registration
- Stripe checkout for featured/subscription tiers on Submit

## 8. Admin dashboard

Open `apps/admin/index.html` in a browser.

Enter Supabase URL, anon key, and `ADMIN_SECRET`. Approve/reject submissions, trigger sync, view logs.

## User-submitted events are protected

Scrapers never overwrite `source_platform = submission` or `manual`.
