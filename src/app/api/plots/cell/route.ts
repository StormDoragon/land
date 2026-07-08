import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cellFromIndices, TIERS } from "@/lib/grid";
import { getSession } from "@/lib/auth";

// GET /api/plots/cell?x=&y=
// Status of a single grid cell: available (with base price) or owned (with details).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gridX = Number(searchParams.get("x"));
  const gridY = Number(searchParams.get("y"));
  if (Number.isNaN(gridX) || Number.isNaN(gridY)) {
    return NextResponse.json({ error: "Invalid cell" }, { status: 400 });
  }

  const cell = cellFromIndices(gridX, gridY);
  const session = await getSession();

  const plot = await prisma.plot.findUnique({
    where: { gridX_gridY: { gridX, gridY } },
    include: {
      owner: { select: { id: true, displayName: true } },
      listings: { where: { status: "ACTIVE" }, take: 1 },
    },
  });

  if (!plot) {
    return NextResponse.json({
      status: "available",
      gridX,
      gridY,
      centerLat: cell.centerLat,
      centerLng: cell.centerLng,
      price: TIERS.BASIC.price,
    });
  }

  const listing = plot.listings[0] ?? null;
  return NextResponse.json({
    status: "owned",
    id: plot.id,
    gridX,
    gridY,
    centerLat: cell.centerLat,
    centerLng: cell.centerLng,
    name: plot.name,
    color: plot.color,
    locationLabel: plot.locationLabel,
    tier: plot.tier,
    linkUrl: plot.linkUrl,
    message: plot.message,
    logoUrl: plot.logoUrl,
    owner: plot.owner,
    isMine: session?.userId === plot.ownerId,
    forSale: !!listing,
    listingId: listing?.id ?? null,
    forSalePrice: listing?.price ?? null,
  });
}
