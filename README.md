# Citipilot — Website

Standalone website for [Citipilot](https://citipilot.app): Richmond event and place discovery.

This project is **fully independent** from the mobile app. The Expo app (`rva-now/apps/mobile`) was used only as a **design and feature reference** when this site was built.

## Features

- **Discover** — personalized events, trending cards, places around town
- **Map** — events and community places on an RVA map
- **Feed** — social-style activity feed
- **You** — neighborhoods, vibes, digest signup, saved stats
- **Event detail** — immersive event pages with tickets and save
- **Submit** — list an event (free, featured, or subscription via Stripe)
- **Privacy & Terms** — required for Stripe and App Store

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (events, submissions, digest)

## Local development

```bash
npm install
cp .env.local.example .env.local   # add your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

## Deploy (Vercel)

1. Push this repo to GitHub (`rva-now-web`)
2. Import in [Vercel](https://vercel.com) — root directory is `.` (this folder)
3. Add the two env vars above
4. Deploy

Use the live URL for Stripe business verification:
- Website: `https://your-domain.vercel.app`
- Privacy: `https://your-domain.vercel.app/privacy`

## Project structure

```
src/
  app/          # Routes (pages)
  components/   # UI components (web-native React, not React Native)
  context/      # App state
  lib/          # API, data, helpers
  types/        # TypeScript types
public/         # Static assets
```

All code in this repo is written for the web. Do not import from the mobile app.
