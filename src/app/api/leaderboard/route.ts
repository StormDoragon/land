import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard — top landowners by plot count, plus recent sales.
export async function GET() {
  const grouped = await prisma.plot.groupBy({
    by: ["ownerId"],
    _count: { ownerId: true },
    _sum: { purchasePrice: true },
    orderBy: { _count: { ownerId: "desc" } },
    take: 20,
  });

  const owners = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.ownerId) } },
    select: { id: true, displayName: true },
  });
  const nameById = new Map(owners.map((o) => [o.id, o.displayName]));

  const leaders = grouped.map((g, i) => ({
    rank: i + 1,
    name: nameById.get(g.ownerId) ?? "Unknown",
    plots: g._count.ownerId,
    totalSpent: g._sum.purchasePrice ?? 0,
  }));

  const recent = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      buyer: { select: { displayName: true } },
      plot: { select: { id: true, name: true, locationLabel: true } },
    },
  });

  return NextResponse.json({
    leaders,
    recent: recent.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      buyerName: t.buyer.displayName,
      createdAt: t.createdAt,
      plot: t.plot,
    })),
  });
}
