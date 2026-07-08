import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/plots/[id] — full public detail for a plot (deed page).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  const plot = await prisma.plot.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true } },
      listings: { where: { status: "ACTIVE" }, take: 1 },
      transactions: {
        orderBy: { createdAt: "asc" },
        include: {
          buyer: { select: { displayName: true } },
          seller: { select: { displayName: true } },
        },
      },
    },
  });
  if (!plot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...plot,
    isMine: session?.userId === plot.ownerId,
    forSalePrice: plot.listings[0]?.price ?? null,
  });
}

const patchSchema = z.object({
  name: z.string().max(60).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

// PATCH /api/plots/[id] — owner renames / recolors their plot.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const plot = await prisma.plot.findUnique({ where: { id } });
  if (!plot) return NextResponse.json({ error: "Plot not found." }, { status: 404 });
  if (plot.ownerId !== session.userId) {
    return NextResponse.json({ error: "You don't own this plot." }, { status: 403 });
  }

  const updated = await prisma.plot.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
    },
  });
  return NextResponse.json({ id: updated.id, name: updated.name, color: updated.color });
}
