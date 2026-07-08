# Stripe — Premium listings for RVA Now

Organizers pay for **Featured** or **Business subscription** when submitting an event. Free listings stay free.

## How it works (already coded)

```
Submit tab → pick tier → submit form
    → free: goes to moderation queue
    → featured / subscription: opens Stripe Checkout in browser
        → payment succeeds → webhook marks paid → auto-publishes event
```

| Tier | Price | What they get |
|------|-------|----------------|
| **Free** | $0 | Standard listing after manual review |
| **Featured** | $25 one-time | `featured` + `sponsored` flags, top of feed |
| **Subscription** | $50/month | Same as featured + recurring priority |

Code lives in:
- `supabase/functions/create-checkout` — starts Stripe Checkout
- `supabase/functions/stripe-webhook` — confirms payment, publishes event
- `apps/mobile/app/(tabs)/submit.tsx` — tier picker + opens checkout

---

## RVA Now Stripe account (linked)

| Item | ID |
|------|-----|
| Account | `acct_1TgWJPRFPQMdz8G1` (JWALK) |
| Featured product | `prod_UfsAsjIPOFI82K` — **$25** |
| Featured price | `price_1TgWQhRFPQMdz8G1iI9ieuiS` |
| Subscription product | `prod_UfsAYVDkQtJ2dC` — **$50/mo** |
| Subscription price | `price_1TgWQhRFPQMdz8G1lZqVSOIH` |

Products are in **live mode** — use `sk_live_...` keys in Supabase.

## Setup (one-time)

### 1. Stripe account

Already connected via Cursor Stripe plugin. API keys:
[https://dashboard.stripe.com/acct_1TgWJPRFPQMdz8G1/apikeys](https://dashboard.stripe.com/acct_1TgWJPRFPQMdz8G1/apikeys)

### 2. Get API keys

Dashboard → **Developers → API keys**

- **Publishable key** — not needed in app (checkout runs server-side)
- **Secret key** (`sk_test_...`) — add to Supabase secrets

### 3. Deploy Edge Functions

```bash
npx supabase functions deploy create-checkout --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4. Add Supabase secrets

**Option A — script (recommended)**

1. Copy `supabase/.env.stripe.example` → `supabase/.env.stripe`
2. Paste your `sk_live_...` and `whsec_...` keys
3. Run:
   ```powershell
   npx supabase login
   npx supabase link --project-ref edorsmasowlidwftzqnh
   .\supabase\scripts\set-stripe-secrets.ps1
   ```

**Option B — Dashboard**

Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx   # from step 5
```

### 5. Create Stripe webhook

Dashboard → **Developers → Webhooks → Add endpoint**

- **URL:** `https://edorsmasowlidwftzqnh.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`
- Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Supabase

### 6. Run Phase 2 SQL (if not done)

`supabase/phase2-full-platform.sql` adds `payment_status` and `stripe_session_id` on submissions.

---

## Test a payment

1. Open app → **Submit** tab
2. Fill out event details
3. Choose **Featured placement**
4. Tap **Submit listing** → Stripe test checkout opens
5. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. After payment, event should auto-publish with featured placement

---

## Going live

1. Complete Stripe business verification
2. Switch to **Live mode** keys (`sk_live_...`)
3. Update webhook endpoint to use live signing secret
4. Update prices in `create-checkout/index.ts` if needed

---

## Optional later

- Stripe Customer Portal for subscription management
- Apple Pay in Checkout (enabled by default on Stripe hosted page)
- In-app purchases (IAP) instead of Stripe — required if Apple deems it digital goods; **event listings for local businesses** typically use Stripe on web/checkout, which is what we do now
