# Phase 4 — Ticket sales

Organizers sell tickets **only on their own submitted events** via Stripe Connect.

## 1. Run SQL

Paste **`supabase/phase4-ticketing.sql`** into [Supabase SQL Editor](https://supabase.com/dashboard/project/edorsmasowlidwftzqnh/sql/new) → **Run**.

## 2. Stripe Connect (Dashboard)

1. [Stripe Connect settings](https://dashboard.stripe.com/settings/connect) → enable Connect
2. Choose **Express** accounts for organizers
3. Webhook: add event **`account.updated`** to your existing endpoint:
   `https://edorsmasowlidwftzqnh.supabase.co/functions/v1/stripe-webhook`

## 3. Deploy functions

```powershell
cd c:\Users\jrwal\Documents\rva-now
npx supabase functions deploy create-connect-link --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy create-ticket-checkout --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy wallet-pass --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref edorsmasowlidwftzqnh
```

## 4. Email tickets (Resend)

Add Supabase secrets:

| Secret | Example |
|--------|---------|
| `RESEND_API_KEY` | `re_...` |
| `TICKET_FROM_EMAIL` | `RVA Now <tickets@yourdomain.com>` |

Buyers receive HTML email with QR codes + Apple Wallet link after payment.

## 5. Apple Wallet (optional, iOS)

Requires Apple Developer Pass Type ID + certificate.

| Secret | Description |
|--------|-------------|
| `APPLE_PASS_TYPE_ID` | `pass.com.rvanow.ticket` |
| `APPLE_TEAM_ID` | 10-char team ID |
| `APPLE_PASS_CERT_PEM` | Pass signing cert (PEM or base64) |
| `APPLE_PASS_KEY_PEM` | Private key (PEM or base64) |
| `APPLE_PASS_KEY_PASSPHRASE` | Key password if any |
| `APPLE_WWDR_PEM` | Apple WWDR intermediate cert |

Until configured, wallet endpoint returns JSON + QR; email still works.

## 6. Fee model

- **$0.50 + 3.5%** per order (platform application fee)
- Organizer receives ticket subtotal via Connect transfer
- Standard bank payout: free (Stripe default schedule)

## 7. Test flow

1. Submit event → enable **Sell tickets on RVA Now** → set price/qty
2. Complete **Stripe Connect** onboarding when prompted
3. Approve/publish listing (admin or paid featured)
4. Open event in app → **Buy tickets**
5. Pay with test card `4242 4242 4242 4242`
6. Check email + **Saved & tickets** tab
