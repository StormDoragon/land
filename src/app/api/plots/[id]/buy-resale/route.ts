import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/plots/[id]/buy-resale — buy an actively-listed plot (mock checkout).
// Ownership transfer + listing close + ledger entry all run in one transaction.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const plot = await tx.plot.findUnique({
        where: { id },
        include: { listings: { where: { status: "ACTIVE" }, take: 1 } },
      });
      if (!plot) throw new Error("NOT_FOUND");
      const listing = plot.listings[0];
      if (!listing) throw new Error("NOT_LISTED");
      if (plot.ownerId === session.userId) throw new Error("OWN_PLOT");

      const sellerId = plot.ownerId;

      await tx.plot.update({
        where: { id },
        data: { ownerId: session.userId, purchasePrice: listing.price, purchasedAt: new Date() },
      });
      await tx.listing.update({
        where: { id: listing.id },
        data: { status: "SOLD" },
      });
      await tx.transaction.create({
        data: {
          plotId: id,
          buyerId: session.userId,
          sellerId,
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
    };
    const [error, status] = map[msg] ?? ["Something went wrong.", 500];
    return NextResponse.json({ error }, { status });
  }
}
