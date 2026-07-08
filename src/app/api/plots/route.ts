import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plots?minLat=&minLng=&maxLat=&maxLng=
// Returns sold plots whose center falls within the requested viewport bbox.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minLat = Number(searchParams.get("minLat"));
  const minLng = Number(searchParams.get("minLng"));
  const maxLat = Number(searchParams.get("maxLat"));
  const maxLng = Number(searchParams.get("maxLng"));

  if ([minLat, minLng, maxLat, maxLng].some((n) => !Number.isFinite(n))) {
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  }

  const south = Math.max(-90, Math.min(minLat, maxLat));
  const north = Math.min(90, Math.max(minLat, maxLat));
  const west = Math.max(-180, Math.min(180, minLng));
  const east = Math.max(-180, Math.min(180, maxLng));
  const lngFilter = west <= east
    ? { centerLng: { gte: west, lte: east } }
    : { OR: [{ centerLng: { gte: west } }, { centerLng: { lte: east } }] };

  const plots = await prisma.plot.findMany({
    where: {
      centerLat: { gte: south, lte: north },
      ...lngFilter,
    },
    take: 2000,
    select: {
      id: true,
      gridX: true,
      gridY: true,
      centerLat: true,
      centerLng: true,
      name: true,
      color: true,
      tier: true,
      locationLabel: true,
      owner: { select: { displayName: true } },
      listings: {
        where: { status: "ACTIVE" },
        select: { price: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    plots: plots.map((p) => ({
      id: p.id,
      gridX: p.gridX,
      gridY: p.gridY,
      centerLat: p.centerLat,
      centerLng: p.centerLng,
      name: p.name,
      color: p.color,
      tier: p.tier,
      locationLabel: p.locationLabel,
      ownerName: p.owner.displayName,
      forSalePrice: p.listings[0]?.price ?? null,
    })),
  });
}
