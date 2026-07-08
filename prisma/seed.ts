import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CELL_SIZE = 0.001;

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

// A few famous landmarks, pre-owned by the demo account, so the map isn't empty.
const LANDMARKS: { name: string; lat: number; lng: number; label: string; color: string; price: number }[] = [
  { name: "Eiffel Tower Estate", lat: 48.8584, lng: 2.2945, label: "Paris, France", color: "#f59e0b", price: 5 },
  { name: "Times Square Plot", lat: 40.758, lng: -73.9855, label: "New York, USA", color: "#ef4444", price: 5 },
  { name: "Colosseum Grounds", lat: 41.8902, lng: 12.4922, label: "Rome, Italy", color: "#8b5cf6", price: 5 },
  { name: "Sydney Opera Land", lat: -33.8568, lng: 151.2153, label: "Sydney, Australia", color: "#06b6d4", price: 5 },
  { name: "Shibuya Crossing", lat: 35.6595, lng: 139.7005, label: "Tokyo, Japan", color: "#ec4899", price: 5 },
  { name: "Christ the Redeemer", lat: -22.9519, lng: -43.2105, label: "Rio de Janeiro, Brazil", color: "#22c55e", price: 5 },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@owntheworld.dev" },
    update: {},
    create: {
      email: "demo@owntheworld.dev",
      displayName: "The Cartographer",
      passwordHash,
    },
  });

  for (const lm of LANDMARKS) {
    const cell = cellFor(lm.lat, lm.lng);
    const existing = await prisma.plot.findUnique({
      where: { gridX_gridY: { gridX: cell.gridX, gridY: cell.gridY } },
    });
    if (existing) continue;

    const plot = await prisma.plot.create({
      data: {
        gridX: cell.gridX,
        gridY: cell.gridY,
        centerLat: cell.centerLat,
        centerLng: cell.centerLng,
        name: lm.name,
        color: lm.color,
        locationLabel: lm.label,
        purchasePrice: lm.price,
        ownerId: demo.id,
      },
    });
    await prisma.transaction.create({
      data: { plotId: plot.id, buyerId: demo.id, amount: lm.price, type: "PRIMARY" },
    });
  }

  console.log(`Seeded demo user (demo@owntheworld.dev / password123) and ${LANDMARKS.length} landmark plots.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
