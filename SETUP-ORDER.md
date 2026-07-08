# Citipilot — setup order (easiest → hardest)

Work through these in order. Check off as you go.

---

## Step 1 — Expo Go dev connection ✅ (code ready)

**You do:**
1. Double-click `apps/mobile/START-EXPO.bat`
2. When prompted to log in → **↓** then **Enter** → **Proceed anonymously**
3. Open `apps/mobile/connect.html` in your browser (it auto-detects the tunnel URL when the server is running)
4. Scan QR with iPhone Camera → **Open in Expo Go**
5. First load takes 30–60 seconds — wait for the bundle

**If it fails:** In Expo Go → **Enter URL manually** → paste the URL shown on `connect.html`.

---

## Step 2 — Auth magic links ✅ (automated)

**Done via** `supabase/config.toml` + `npx supabase config push`:
- Site URL: `citipilot://auth`
- Redirect URLs: `citipilot://auth`, `exp://**`, `exp://**/--/auth`

**Test:** App → **Account** → enter email → open magic link **on the same phone** → should show “Signed in”.

---

## Step 3 — Fresh event content

### 3a. Upload sync secrets (automated script)

```powershell
cd c:\Users\jrwal\Documents\rva-now
.\supabase\setup-ops-secrets.ps1
```

Secrets live in `supabase/.env.sync` (already filled: `SYNC_SECRET`, `ADMIN_SECRET`, `POSH_EVENT_URLS`).

### 3b. Deploy sync functions (if not already)

```powershell
npx supabase functions deploy sync-events --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy archive-stale-events --no-verify-jwt --project-ref edorsmasowlidwftzqnh
npx supabase functions deploy approve-submission --no-verify-jwt --project-ref edorsmasowlidwftzqnh
```

### 3c. Run a manual sync now

```powershell
.\supabase\test-sync.ps1
```

Check `sync_runs` table in Supabase for results.

### 3d. Schedule twice-daily auto-sync ✅ (automated)

Run (or use `.\supabase\run-setup.ps1` for everything at once):

```powershell
npx supabase db query --linked -f supabase\schedule-sync-ready.sql
```

Jobs active: `rva-now-sync-twice-daily` (6 AM & 6 PM Eastern), `rva-now-weekly-digest` (Sunday 9 AM).

### 3e. Moderate submissions

Open `apps/admin/index.html` in a browser:
- Supabase URL: `https://edorsmasowlidwftzqnh.supabase.co`
- Anon key: from `apps/mobile/.env`
- Admin secret: from `supabase/.env.sync` → `ADMIN_SECRET`

Approve pending listings → they publish to the app feed.

### Optional — Eventbrite

Add to `supabase/.env.sync`, re-run `setup-ops-secrets.ps1`:
```
EVENTBRITE_TOKEN=your_private_token
EVENTBRITE_ORG_IDS=org_id_1,org_id_2
```

---

## Step 4 — Ticketing + email

### 4a. SQL (likely done)

`ticket_types` table exists. If ticketing errors, re-run `supabase/phase4-ticketing.sql`.

### 4b. Stripe secrets

```powershell
.\supabase\scripts\set-stripe-secrets.ps1
```

### 4c. Stripe Connect (Dashboard — manual)

1. [Enable Connect → Express](https://dashboard.stripe.com/settings/connect)
2. Webhook endpoint: `https://edorsmasowlidwftzqnh.supabase.co/functions/v1/stripe-webhook`
3. Add event: **`account.updated`** (plus existing `checkout.session.completed`)

### 4d. Deploy ticket functions

```powershell
.\supabase\deploy-ticketing.ps1
```

### 4e. Resend (ticket + digest emails)

1. Create account at [resend.com](https://resend.com), verify a domain (or use their test domain for dev)
2. Add to `supabase/.env.sync`:
   ```
   RESEND_API_KEY=re_...
   TICKET_FROM_EMAIL=Citipilot <tickets@yourdomain.com>
   DIGEST_FROM_EMAIL=Citipilot <digest@yourdomain.com>
   ```
3. Re-run `.\supabase\setup-ops-secrets.ps1`

### 4f. Test ticket flow

1. Submit event → enable **Sell tickets**
2. Complete Stripe Connect onboarding
3. Approve listing (admin)
4. Buy with test card `4242 4242 4242 4242`
5. Check email + **Saved & tickets** tab

---

## Step 5 — TestFlight / App Store

### 5a. Apple Developer ($99/yr)

Enroll at [developer.apple.com](https://developer.apple.com).

### 5b. App Store Connect

Create app with bundle ID **`com.citipilot.app`**.

### 5c. Update `apps/mobile/eas.json`

Replace placeholders:
- `appleId` — your Apple ID email
- `ascAppId` — App Store Connect app ID
- `appleTeamId` — 10-char team ID from Apple Developer

### 5d. Privacy policy

Host a privacy policy URL (required). Add to App Store Connect listing.

### 5e. Build

On Mac or via EAS cloud:

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

Full guide: `apps/mobile/APP_STORE.md`

### 5f. Before public launch

- Switch Stripe to **live** keys in `supabase/.env.stripe`
- Apple Wallet certs (optional) — `supabase/PHASE4-TICKETING.md`

---

## Quick status

| Step | Automated | Your action |
|------|-----------|-------------|
| 1 Expo Go | `START-EXPO.bat`, `connect.html` | Run bat, scan QR |
| 2 Auth | App code | Add redirect URLs in Supabase |
| 3 Content | `setup-ops-secrets.ps1`, `test-sync.ps1` | Run cron SQL, use admin |
| 4 Ticketing | `set-stripe-secrets.ps1`, `deploy-ticketing.ps1` | Connect + Resend in dashboards |
| 5 App Store | `eas.json` template | Apple account, privacy policy, EAS build |
