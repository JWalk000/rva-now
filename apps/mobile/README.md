# RVA Now — iOS App

Mobile-first MVP for discovering what's happening in Richmond.

## Run locally

```bash
cd apps/mobile
npm install
cp .env.example .env   # optional — connect Supabase (see below)
npx expo start
```

Scan with **Expo Go** on iPhone.

## Connect Supabase (recommended)

Without `.env`, the app runs on **local sample data**. To persist signups and submissions for real:

1. Follow setup in [`../../supabase/README.md`](../../supabase/README.md)
2. Copy `.env.example` → `.env` with your Supabase URL + anon key
3. Restart: `npx expo start -c`

The Discover tab shows **Live data from Supabase** when connected.

## MVP features (day 1)

- Today / This Weekend / This Week
- Neighborhood + interest filters
- Map view
- Save + share events
- Business submission form → `event_submissions`
- Weekly digest signup → `digest_signups`
- Trending near you
- Curated lists
- Sponsored placement foundations

## App Store

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

Requires Apple Developer Program ($99/year).
