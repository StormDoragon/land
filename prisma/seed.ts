import { PrismaClient, PlotTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CELL_SIZE = 0.001;

const TIER_PRICE: Record<PlotTier, number> = {
  BASIC: 5,
  CITY: 15,
  PREMIUM: 49,
  FOUNDER: 99,
  HOMEPAGE: 199,
};
const TIER_COLOR: Record<PlotTier, string> = {
  BASIC: "#67e8f9",
  CITY: "#34d399",
  PREMIUM: "#a78bfa",
  FOUNDER: "#f5c451",
  HOMEPAGE: "#f472b6",
};

function cellFor(lat: number, lng: number) {
  const gridX = Math.floor(lng / CELL_SIZE);
  const gridY = Math.floor(lat / CELL_SIZE);
  return {
    gridX,
    gridY,
    centerLng: gridX * CELL_SIZE + CELL_SIZE / 2,
    centerLat: gridY * CELL_SIZE + CELL_SIZE / 2,
  };
}

interface Landmark {
  name: string;
  lat: number;
  lng: number;
  label: string;
  tier: PlotTier;
  linkUrl?: string;
  message?: string;
}

// Pre-owned landmark plots (owned by the demo account) so the map isn't empty.
const LANDMARKS: Landmark[] = [
  {
    name: "Eiffel Tower Estate",
    lat: 48.8584,
    lng: 2.2945,
    label: "Paris, France",
    tier: "HOMEPAGE",
    linkUrl: "https://aplotinweb.com",
    message: "The most visible plot in the City of Light.",
  },
  {
    name: "Times Square Plot",
    lat: 40.758,
    lng: -73.9855,
    label: "New York, USA",
    tier: "FOUNDER",
    linkUrl: "https://aplotinweb.com",
    message: "Founding owner at the crossroads of the world.",
  },
  {
    name: "Colosseum Grounds",
    lat: 41.8902,
    lng: 12.4922,
    label: "Rome, Italy",
    tier: "PREMIUM",
    message: "History, owned.",
  },
  {
    name: "Sydney Opera Land",
    lat: -33.8568,
    lng: 151.2153,
    label: "Sydney, Australia",
    tier: "CITY",
    message: "Down-under and on the map.",
  },
  {
    name: "Shibuya Crossing",
    lat: 35.6595,
    lng: 139.7005,
    label: "Tokyo, Japan",
    tier: "PREMIUM",
    message: "The busiest crossing on Earth.",
  },
  {
    name: "Christ the Redeemer",
    lat: -22.9519,
    lng: -43.2105,
    label: "Rio de Janeiro, Brazil",
    tier: "CITY",
    message: "Overlooking Rio.",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@aplotinweb.com" },
    update: { displayName: "King Saleh" },
    create: {
      email: "demo@aplotinweb.com",
      displayName: "King Saleh",
      passwordHash,
    },
  });

  for (const lm of LANDMARKS) {
    const cell = cellFor(lm.lat, lm.lng);
    const existing = await prisma.plot.findUnique({
      where: { gridX_gridY: { gridX: cell.gridX, gridY: cell.gridY } },
    });
    if (existing) continue;

    const price = TIER_PRICE[lm.tier];
    const plot = await prisma.plot.create({
      data: {
        gridX: cell.gridX,
        gridY: cell.gridY,
        centerLat: cell.centerLat,
        centerLng: cell.centerLng,
        name: lm.name,
        color: TIER_COLOR[lm.tier],
        locationLabel: lm.label,
        tier: lm.tier,
        linkUrl: lm.linkUrl ?? null,
        message: lm.message ?? null,
        purchasePrice: price,
        ownerId: demo.id,
      },
    });
    await prisma.transaction.create({
      data: { plotId: plot.id, buyerId: demo.id, amount: price, type: "PRIMARY" },
    });
  }

  console.log(
    `Seeded demo user (demo@aplotinweb.com / password123) and ${LANDMARKS.length} landmark plots.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
