import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ price: z.number().positive().max(1_000_000_000) });

// POST /api/plots/[id]/list — owner lists a plot for resale at any positive price.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  const plot = await prisma.plot.findUnique({ where: { id } });
  if (!plot) return NextResponse.json({ error: "Plot not found." }, { status: 404 });
  if (plot.ownerId !== session.userId) {
    return NextResponse.json({ error: "You don't own this plot." }, { status: 403 });
  }

  // Replace any existing active listing.
  await prisma.$transaction([
    prisma.listing.updateMany({
      where: { plotId: id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    }),
    prisma.listing.create({
      data: { plotId: id, sellerId: session.userId, price: parsed.data.price },
    }),
  ]);

  return NextResponse.json({ ok: true, price: parsed.data.price });
}
