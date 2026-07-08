# RVA Now

RVA Now is a website-first, app-second local discovery platform for Richmond, Virginia (RVA).

The goal is to help people quickly find what is happening nearby through a more useful experience than a generic event calendar:
- hyperlocal neighborhood discovery
- personalized event ranking by interests
- hidden-gem surfacing
- curated local lists
- business and organizer submissions
- featured placements for monetization
- weekly digest capture for retention
- a foundation for an organizer dashboard

## Product vision

RVA Now is designed to become the fastest way to discover what is happening in Richmond by combining:
1. **Aggregation** — bringing local happenings into one place
2. **Personalization** — ranking events based on neighborhoods and vibe preferences
3. **Neighborhood-first discovery** — making Richmond feel browsable by area, not just by date
4. **Local flavor** — highlighting hidden gems, recurring community activity, and curated lists
5. **Monetization from day one** — featured listings, organizer subscriptions, and sponsorship-ready placements

## Included in this starter

This starter includes a monorepo with:

### `apps/web`
A mobile-friendly website prototype that includes:
- hero section and product positioning
- personalized feed concept
- neighborhood and vibe filters
- list / map-style toggle
- saved events
- curated lists
- featured events
- hidden gems
- weekly digest signup capture
- organizer/business event submission form
- organizer dashboard foundation

### `apps/mobile`
A mobile app starter that includes:
- shared event data
- shared personalization logic
- neighborhood and vibe preferences
- a simple personalized mobile feed
- monetization lane placeholders

### `packages/shared`
Shared sample data and helper logic for:
- neighborhoods
- vibes
- sample events
- curated lists
- personalization scoring
- feed filtering

## Current stack in this prototype

This is currently a lightweight starter scaffold, not a production deployment.

- Web: static HTML, CSS, JavaScript
- Mobile: React Native style starter file structure
- Shared logic: JavaScript modules
- Repo structure: monorepo-style organization

## Recommended production upgrade path

If you continue building this into a real product, the recommended next version is:

- **Web:** Next.js
- **App:** Expo / React Native
- **Backend:** Supabase or PostgreSQL + API layer
- **Auth:** Supabase Auth or Clerk
- **Maps:** Mapbox or Google Maps
- **Search/filtering:** Postgres + full-text or Algolia
- **Email digest:** Resend / SendGrid
- **Payments:** Stripe
- **Admin / organizer dashboard:** internal admin panel + organizer portal

## Competitive advantages built into the concept

This starter was structured around the strongest differentiators for an RVA-focused discovery product:

### 1. Personalized feed
Users can select neighborhoods and vibes so the product ranks events based on preference instead of just showing a generic feed.

### 2. Neighborhood-first browsing
The product is organized around real RVA neighborhoods such as Downtown, The Fan, Scott's Addition, Church Hill, Manchester, and Carytown.

### 3. Hidden gems layer
The concept intentionally surfaces smaller and more local-feeling experiences, not just the most obvious public events.

### 4. Curated lists
Examples include:
- date night in RVA
- free this weekend
- hidden local gems

### 5. Retention loop
The weekly digest signup is included as an early retention mechanism.

### 6. Supply-side growth
Businesses and organizers can submit events directly, which helps solve the cold-start content problem.

### 7. Monetization lanes
The UI includes foundations for:
- featured placements
- organizer subscriptions
- digest sponsorships / promoted exposure

### 8. Organizer dashboard foundation
The prototype includes the start of the B2B side of the product, not just the consumer side.

## Suggested MVP priorities

If you build this out further, the order should be:

### Phase 1 — Website MVP
- launch one city only: RVA
- ingest and manage real event data
- add organizer submission moderation
- add onboarding for interests / neighborhoods
- support basic save/share functionality
- launch weekly digest

### Phase 2 — Revenue and retention
- featured listings
- recurring organizer packages
- neighborhood pages
- trending this weekend
- analytics for organizer submissions

### Phase 3 — App rollout
- personalized push notifications
- saved plans / collections
- location-aware discovery
- social sharing and friend-based recommendations

## File structure

```bash
rva-now/
├── apps/
│   ├── mobile/
│   │   ├── App.js
│   │   └── package.json
│   └── web/
│       ├── index.html
│       ├── package.json
│       ├── script.js
│       └── styles.css
├── packages/
│   └── shared/
│       └── src/
│           ├── data.js
│           └── helpers.js
├── .gitignore
├── package.json
└── README.md
```

## Local usage

Because this starter uses a simple static web prototype, you can preview the website locally with a basic static server.

Example:

```bash
cd rva-now/apps/web
python3 -m http.server 4173
```

Then open:

```bash
http://localhost:4173
```

## What is still missing

This starter is intentionally a front-end concept scaffold. It does **not** yet include:
- real event ingestion pipelines
- authentication
- database schema
- organizer accounts
- moderation tools
- production mobile app config
- ticketing integrations
- payments
- deployment config

## Recommended next build steps

1. Convert the website to Next.js
2. Add a real event database
3. Add admin moderation tools
4. Build organizer accounts and event submissions
5. Add featured listing payments
6. Add weekly digest automation
7. Connect the mobile app to the same backend
8. Launch with a small set of Richmond neighborhoods first

## Naming

Project name: **RVA Now**

Suggested positioning:
> The fastest way to know what’s happening in RVA.

## License

This repository currently has no license file included. Add one if you want to open-source it.
