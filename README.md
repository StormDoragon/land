# 🌍 Own the World — Virtual Land Marketplace

Buy virtual plots of land tied to **real-world locations**. Open the map, zoom
into any city, click a plot, and claim it — plots start at **$5**. Name it, paint
its flag, get a shareable **deed certificate**, and later **resell** it to anyone
for any price.

> Payments run in **demo mode**: the full buy/resale flow works and every purchase
> is persisted, but no real money moves. The order/ledger model is structured so
> real Stripe Checkout can be dropped in later without changing ownership logic.

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
demo@owntheworld.dev / password123
```

…which owns a handful of famous landmark plots (Eiffel Tower, Times Square, etc.)
so the map isn't empty.

### 3. Run

```bash
npm run dev
# http://localhost:3000
```

## Features

- 🗺️ **Interactive world map** — pan/zoom anywhere; sold plots render as colored
  territories, a faint grid appears when you zoom in.
- 💵 **Claim from $5** — click any free cell, name it, pick a flag color, buy.
- 🏷️ **Resell for any price** — list plots on the marketplace; ownership transfers
  atomically with a recorded transaction.
- 📜 **Deed certificates** — every plot has a shareable certificate page with full
  ownership history.
- 🏆 **Leaderboard & live activity** — biggest landowners and a recently-sold feed.
- 🔒 **Accounts** — register/login, plots owned under your account.

## Project layout

```
prisma/schema.prisma        # User / Plot / Listing / Transaction
prisma/seed.ts              # demo data
src/lib/grid.ts             # grid math, snapping, pricing (BASE_PRICE)
src/lib/auth.ts             # JWT session + password hashing
src/lib/prisma.ts           # Prisma client singleton
src/lib/geocode.ts          # Nominatim reverse geocoding
src/app/api/...             # route handlers (plots, buy, resale, marketplace, ...)
src/components/WorldMap.tsx # Leaflet map (client)
src/components/MapExplorer.tsx  # map + slide-in plot panel + buy flow
src/app/page.tsx            # home (map)
src/app/{dashboard,marketplace,leaderboard,plot/[id]}  # pages
```

## Future work

- Real Stripe Checkout behind the existing buy handlers.
- Tiered / premium pricing by location, map clustering for dense areas.
- Email notifications on sales.
