# Stripe setup for RVA Now — detailed walkthrough

This guide connects your **JWALK** Stripe account to RVA Now so organizers can pay **$25** (featured) or **$50/mo** (subscription) when listing events.

**Time needed:** ~20 minutes  
**You need:** Stripe account, Supabase project access, PowerShell/terminal

---

## What happens when someone pays

1. Organizer opens the app → **Submit** tab
2. Fills out event info → picks **Featured · $25** or **Subscription · $50/mo**
3. Taps **Submit listing**
4. App saves the submission → opens **Stripe Checkout** in the browser
5. They pay on Stripe’s secure page
6. Stripe sends a webhook to Supabase → `stripe-webhook` function runs
7. Submission is marked **paid** → event is **auto-published** with featured placement

Free listings skip payment and wait for manual admin approval.

---

## Before you start — checklist

- [ ] Supabase project: `edorsmasowlidwftzqnh` is running
- [ ] You ran `supabase/phase2-full-platform.sql` in SQL Editor (adds `payment_status` column)
- [ ] Expo app works and connects to Supabase
- [ ] Stripe account: [JWALK dashboard](https://dashboard.stripe.com/acct_1TgWJPRFPQMdz8G1)

### Your Stripe products (already created)

| What | Stripe ID | Price |
|------|-----------|-------|
| Featured listing | `price_1TgWQhRFPQMdz8G1iI9ieuiS` | $25 one-time |
| Business subscription | `price_1TgWQhRFPQMdz8G1lZqVSOIH` | $50/month |

These are in **Live mode** — real cards will be charged. For safe testing, see [Appendix: Test mode](#appendix-test-mode-optional) at the bottom.

---

## Step 1 — Get your Stripe secret key

1. Open [Stripe API keys](https://dashboard.stripe.com/acct_1TgWJPRFPQMdz8G1/apikeys)
2. Make sure the toggle says **Live** (top-right) since your products are live
3. Under **Secret key**, click **Reveal live key**
4. Copy the key — it starts with `sk_live_`
5. **Do not** share this key in chat, email, or commit it to git

You do **not** need the Publishable key (`pk_live_...`) for this setup — checkout runs on the server.

---

## Step 2 — Create the Stripe webhook

The webhook tells Supabase when someone finishes paying.

1. Go to [Stripe → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint** (or **+ Add destination**)
3. Fill in:

   | Field | Value |
   |-------|-------|
   | **Endpoint URL** | `https://edorsmasowlidwftzqnh.supabase.co/functions/v1/stripe-webhook` |
   | **Description** | `RVA Now payment confirmations` |

4. Under **Events to send**, click **Select events**
5. Search for and check: **`checkout.session.completed`**
6. Click **Add endpoint** / **Save**

7. On the new webhook’s page, find **Signing secret**
8. Click **Reveal** and copy it — starts with `whsec_`

Keep both keys handy:
- `sk_live_...` (from Step 1)
- `whsec_...` (from this step)

---

## Step 3 — Save keys locally (gitignored)

1. Open File Explorer → go to your project folder:
   ```
   c:\Users\jrwal\Documents\rva-now\supabase\
   ```

2. Copy the example file:
   - Copy `supabase\.env.stripe.example`
   - Paste as `supabase\.env.stripe` (same folder)

3. Open `supabase\.env.stripe` in a text editor and replace the placeholders:

   ```
   STRIPE_SECRET_KEY=sk_live_paste_your_actual_key_here
   STRIPE_WEBHOOK_SECRET=whsec_paste_your_actual_secret_here
   ```

4. Save the file. **No quotes** around the values.

This file is gitignored — it will not be committed.

---

## Step 4 — Log in to Supabase CLI

Open **PowerShell** and run:

```powershell
cd c:\Users\jrwal\Documents\rva-now
npx supabase login
```

- A browser window opens
- Log in with the same account that owns the Supabase project
- When it says success, return to PowerShell

Link this folder to your project:

```powershell
npx supabase link --project-ref edorsmasowlidwftzqnh
```

If it asks for the database password, use the password from Supabase Dashboard → Project Settings → Database.

---

## Step 5 — Upload secrets to Supabase

Still in PowerShell, from the project root:

```powershell
.\supabase\scripts\set-stripe-secrets.ps1
```

You should see:

```
Setting STRIPE_SECRET_KEY...
Setting STRIPE_WEBHOOK_SECRET...
Done. Deploy functions:
```

**Alternative (Supabase Dashboard):**

1. [Supabase Dashboard](https://supabase.com/dashboard/project/edorsmasowlidwftzqnh/settings/functions)
2. **Edge Functions** → **Secrets** (or Project Settings → Edge Functions)
3. Add:
   - Name: `STRIPE_SECRET_KEY` → Value: your `sk_live_...`
   - Name: `STRIPE_WEBHOOK_SECRET` → Value: your `whsec_...`
4. Save each secret

---

## Step 6 — Deploy the payment functions

In PowerShell (project root):

```powershell
npx supabase functions deploy create-checkout --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref edorsmasowlidwftzqnh
```

Wait for each to finish with `Deployed Function`.

Verify in Supabase Dashboard → **Edge Functions** — you should see:
- `create-checkout`
- `stripe-webhook`

---

## Step 7 — Confirm database is ready

In [Supabase SQL Editor](https://supabase.com/dashboard/project/edorsmasowlidwftzqnh/sql/new), run this quick check:

```sql
select column_name
from information_schema.columns
where table_name = 'event_submissions'
  and column_name in ('payment_status', 'stripe_session_id');
```

You should get **2 rows**. If you get 0 rows, paste and run the full file:
`supabase/phase2-full-platform.sql`

---

## Step 8 — Test a payment in the app

1. **Reload Expo Go** (shake → Reload) so the app is fresh
2. Open **Submit** tab
3. Fill in:
   - Event title: `Stripe Test Event`
   - Neighborhood: any
   - Date/time: `Saturday 7:00 PM`
   - Venue: `Test Venue`
   - Email: your real email
4. Select **Featured placement · $25**
5. Tap **Submit listing**

**Expected behavior:**
- Message: submitted / opening payment
- Browser opens with **Stripe Checkout** showing **$25.00**
- After paying, you return to the app

6. Check Stripe Dashboard → **Payments** — payment should appear
7. Check Supabase → **Table Editor** → `events` — new row with `source_platform = submission`, `featured = true`

### If checkout says "STRIPE_SECRET_KEY not configured"

- Re-run Step 5 (secrets script)
- Re-run Step 6 (deploy functions)

### If payment succeeds but event doesn’t appear

- Stripe Dashboard → **Webhooks** → your endpoint → **Event deliveries**
- Look for failed deliveries (red) and click for error details
- Common fix: wrong `STRIPE_WEBHOOK_SECRET` — re-copy from Stripe and re-run secrets script

---

## Step 9 — Verify webhook manually (optional)

In Stripe Dashboard → Webhooks → your endpoint → **Send test webhook**

Or after a real payment, click the `checkout.session.completed` event and confirm **Response: 200**.

---

## Summary — what lives where

| Secret / config | Where it goes | Used by |
|-----------------|---------------|---------|
| `sk_live_...` | Supabase secret `STRIPE_SECRET_KEY` | `create-checkout` |
| `whsec_...` | Supabase secret `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` |
| Webhook URL | Stripe Dashboard only | Stripe → Supabase |
| Supabase anon key | `apps/mobile/.env` (already set) | Mobile app |

---

## Appendix: Test mode (optional)

Your products were created in **Live mode**. To test without real charges:

1. Stripe Dashboard → toggle **Test mode** (top-right)
2. Create new test products/prices at $25 and $50 (or ask Cursor Stripe plugin)
3. Update price IDs in `supabase/functions/create-checkout/index.ts` → `PRICE_IDS`
4. Use `sk_test_...` instead of `sk_live_...` in `.env.stripe`
5. Create a **separate test webhook** with the same Supabase URL
6. Redeploy functions and re-run secrets script

Test card: `4242 4242 4242 4242` · any future expiry · any CVC

---

## Appendix: Going live for real customers

- [ ] Stripe business verification complete
- [ ] Live webhook + live secret key configured
- [ ] Test one real $25 payment yourself
- [ ] Privacy policy URL ready (App Store requirement if you charge in-app)

---

## Need help?

Tell your assistant:
- "keys are in" — after Step 3, for deploy help
- Paste the **error message** from Stripe webhook deliveries or Expo — not your secret keys
