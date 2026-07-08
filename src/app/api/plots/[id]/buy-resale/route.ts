import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/security";

// POST /api/plots/[id]/buy-resale — buy an actively-listed plot (mock checkout).
// Ownership transfer + listing close + ledger entry all run in one transaction.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isSameOriginRequest())) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { plotId: id, status: "ACTIVE" },
        include: { plot: true },
        orderBy: { createdAt: "desc" },
      });
      if (!listing) throw new Error("NOT_LISTED");
      if (listing.plot.ownerId === session.userId) throw new Error("OWN_PLOT");
      if (listing.sellerId !== listing.plot.ownerId) throw new Error("STALE_LISTING");

      const sold = await tx.listing.updateMany({
        where: { id: listing.id, status: "ACTIVE" },
        data: { status: "SOLD" },
      });
      if (sold.count !== 1) throw new Error("NOT_LISTED");

      await tx.plot.update({
        where: { id },
        data: { ownerId: session.userId, purchasePrice: listing.price, purchasedAt: new Date() },
      });
      await tx.transaction.create({
        data: {
          plotId: id,
          buyerId: session.userId,
          sellerId: listing.sellerId,
          amount: listing.price,
          type: "RESALE",
        },
      });
      return { price: listing.price };
    });

    return NextResponse.json({ ok: true, price: result.price });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const map: Record<string, [string, number]> = {
      NOT_FOUND: ["Plot not found.", 404],
      NOT_LISTED: ["This plot is not for sale.", 409],
      OWN_PLOT: ["You already own this plot.", 400],
      STALE_LISTING: ["This listing is no longer valid.", 409],
    };
    const [error, status] = map[msg] ?? ["Something went wrong.", 500];
    return NextResponse.json({ error }, { status });
  }
}
