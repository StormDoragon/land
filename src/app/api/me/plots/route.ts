import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/me/plots — plots owned by the signed-in user.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const plots = await prisma.plot.findMany({
    where: { ownerId: session.userId },
    orderBy: { purchasedAt: "desc" },
    include: { listings: { where: { status: "ACTIVE" }, take: 1 } },
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
      purchasePrice: p.purchasePrice,
      purchasedAt: p.purchasedAt,
      forSalePrice: p.listings[0]?.price ?? null,
    })),
  });
}
