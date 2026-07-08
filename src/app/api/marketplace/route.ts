import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace — all active resale listings.
export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      seller: { select: { displayName: true } },
      plot: {
        select: {
          id: true,
          gridX: true,
          gridY: true,
          centerLat: true,
          centerLng: true,
          name: true,
          color: true,
          locationLabel: true,
          purchasePrice: true,
        },
      },
    },
  });

  return NextResponse.json({
    listings: listings.map((l) => ({
      listingId: l.id,
      price: l.price,
      sellerName: l.seller.displayName,
      createdAt: l.createdAt,
      plot: l.plot,
    })),
  });
}
