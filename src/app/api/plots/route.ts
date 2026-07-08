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

  if ([minLat, minLng, maxLat, maxLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  }

  const plots = await prisma.plot.findMany({
    where: {
      centerLat: { gte: minLat, lte: maxLat },
      centerLng: { gte: minLng, lte: maxLng },
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
      locationLabel: p.locationLabel,
      ownerName: p.owner.displayName,
      forSalePrice: p.listings[0]?.price ?? null,
    })),
  });
}
