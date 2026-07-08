# RVA Now — where you are (updated checklist)

**Full step-by-step (easiest → hardest):** see [`SETUP-ORDER.md`](SETUP-ORDER.md)

## Done ✅

| Item | Status |
|------|--------|
| Phases 1–2 (polish + ops) | **Done** (cron SQL optional) |
| Phase 4 ticketing code | **Done** — Connect, checkout, email, Wallet endpoint |
| Listing + ticket Stripe webhooks | **Deployed** |
| Submit → sell tickets toggle | **In app** |
| Buy tickets on event detail | **In app** |
| Email + QR tickets | **After Resend configured** |
| Apple Wallet | **After Apple Pass certs configured** |

## Your next actions

| Step | Action |
|------|--------|
| 1 | Run **`supabase/phase4-ticketing.sql`** in SQL Editor |
| 2 | Enable **Stripe Connect** (Express) in Stripe Dashboard |
| 3 | Add webhook event **`account.updated`** |
| 4 | Set **`RESEND_API_KEY`** + **`TICKET_FROM_EMAIL`** secrets |
| 5 | (Optional) Apple Wallet certs — see **`supabase/PHASE4-TICKETING.md`** |
| 6 | Reload Expo → test submit with tickets → buy → check email |

Full guide: **`supabase/PHASE4-TICKETING.md`**

## Before App Store

| Task | Status |
|------|--------|
| Design refresh | Your call |
| Privacy policy URL | Required |
| TestFlight build | `apps/mobile/APP_STORE.md` |
| Live Stripe keys | When launching |
