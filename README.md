# 🌐 APlotInWeb — Own a Visible Piece of the Internet

Buy your **digital plot** on a real-world map. Open the map, zoom into any city,
click a plot, and claim it — plots start at **$5**. Add your name, logo, link and
public message, get a shareable **digital ownership certificate**, and later
**resell** your verified digital asset for any price.

> Payments run in **demo mode**: the full buy/resale flow works and every purchase
> is persisted, but no real money moves. The order/ledger model is structured so
> real Stripe Checkout can be dropped in later without changing ownership logic.
> "Blockchain / NFT proof" is a labelled **Phase 2** roadmap item — not implied to
> exist today.

## Plot tiers

| Tier | Price | Highlights |
| --- | --- | --- |
| Basic | $5 | Public name + owner page, resell anytime |
| City | $15 | City placement, owner card, public message |
| Premium | $49 | Logo display, featured owner, premium map color |
| Founder | $99 | Founder badge, priority visibility |
| Homepage | $199 | Homepage visibility, marketplace priority |

Every plot carries a public **owner profile** (name, link, message, optional logo)
shown on the map and on its public owner page. Owners can **upgrade** to a higher
tier at any time.

## How it works

The world is divided into a **fixed global grid**. Each plot is one grid cell
(`~111m × ~111m`), identified by integer indices so cells are globally unique and
**never overlap**:

```
cellSize = 0.001°
gridX = floor(lng / cellSize)
gridY = floor(lat / cellSize)
```

Only *sold* plots are stored in the database — every other cell is computed on the
fly, so we never enumerate the billions of possible cells. A click snaps to the
cell that contains it, so every click resolves to exactly one deterministic plot.

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **PostgreSQL** via **Prisma**
- **Leaflet** + CARTO/OpenStreetMap tiles (no map API key required)
- Custom **JWT-cookie auth** (`jose` + `bcryptjs`) — email/password accounts
- Best-effort reverse geocoding via OpenStreetMap Nominatim

## Getting started

### 1. Database

Use the bundled Postgres via Docker:

```bash
docker compose up -d
```

…or point `DATABASE_URL` at any Postgres instance. Copy the env template:

```bash
cp .env.example .env
# edit DATABASE_URL and AUTH_SECRET
```

### 2. Install, migrate, seed

```bash
npm install
npx prisma migrate dev      # create tables
npm run db:seed             # demo user + landmark plots
```

The seed creates a demo account:

```
demo@aplotinweb.com / password123
```

…which owns a handful of famous landmark plots (Eiffel Tower, Times Square, etc.)
so the map isn't empty.

### 3. Run

```bash
npm run dev
# http://localhost:3000
```

## Deploying to Vercel

1. Import the repo into Vercel (Next.js is auto-detected, no config needed).
2. Add two Environment Variables in the Vercel project settings (Production, Preview, and Development as needed):
   - `DATABASE_URL` — a reachable PostgreSQL connection string (e.g. Vercel Postgres, Neon, Supabase, RDS).
   - `AUTH_SECRET` — a long random string (`openssl rand -base64 32`).
3. Deploy. The build runs `vercel-build` (`prisma generate && prisma migrate deploy && next build`), which applies any pending migrations against `DATABASE_URL` before building — no manual migration step required.
4. Optional: run `npm run db:seed` locally against the production `DATABASE_URL` to create the demo account and landmark plots.

## Features

- 🗺️ **Interactive world map** — pan/zoom anywhere; sold plots render as colored
  territories, a faint grid appears when you zoom in.
- 💵 **Tiered claiming from $5** — click any free cell, pick a tier, add name/link/
  message, buy. Upgrade to a higher tier anytime.
- 🏷️ **Resell for any price** — list plots on the marketplace; ownership transfers
  atomically with a recorded transaction.
- 📜 **Owner pages & certificates** — every plot has a public owner page with logo,
  link, message, tier badge, a digital ownership certificate and full history.
- 🏆 **Leaderboard & live activity** — biggest owners and a recently-sold feed.
- 🔒 **Accounts** — register/login, plots owned under your account.

## Project layout

```
prisma/schema.prisma        # User / Plot (tier + profile) / Listing / Transaction
prisma/seed.ts              # demo data
src/lib/grid.ts             # grid math, snapping, TIERS pricing config
src/lib/auth.ts             # JWT session + password hashing
src/lib/prisma.ts           # Prisma client singleton
src/lib/geocode.ts          # Nominatim reverse geocoding
src/app/api/...             # route handlers (plots, buy, resale, marketplace, ...)
src/components/WorldMap.tsx # Leaflet map (client)
src/components/MapExplorer.tsx  # map + slide-in tier buy/profile panel
src/components/PricingGrid.tsx  # shared tier cards
src/app/page.tsx            # landing (hero + map + how-it-works + pricing + owners)
src/app/map                 # full-screen interactive map
src/app/{pricing,faq,owners,dashboard,marketplace,leaderboard,plot/[id]}
```

## Future work

- Real Stripe Checkout behind the existing buy handlers.
- Tiered / premium pricing by location, map clustering for dense areas.
- Email notifications on sales.
