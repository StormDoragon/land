import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/plots/[id]/unlist — cancel the active resale listing for a plot.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const plot = await prisma.plot.findUnique({ where: { id } });
  if (!plot) return NextResponse.json({ error: "Plot not found." }, { status: 404 });
  if (plot.ownerId !== session.userId) {
    return NextResponse.json({ error: "You don't own this plot." }, { status: 403 });
  }

  await prisma.listing.updateMany({
    where: { plotId: id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
