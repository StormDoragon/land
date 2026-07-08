import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TIERS, tierRank } from "@/lib/grid";

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
  linkUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
  message: z.string().max(280).nullable().optional().or(z.literal("")),
  logoUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
  tier: z.enum(["BASIC", "CITY", "PREMIUM", "FOUNDER", "HOMEPAGE"]).optional(),
});

// PATCH /api/plots/[id] — owner edits their plot's profile, or upgrades its tier.
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
  const d = parsed.data;

  const plot = await prisma.plot.findUnique({ where: { id } });
  if (!plot) return NextResponse.json({ error: "Plot not found." }, { status: 404 });
  if (plot.ownerId !== session.userId) {
    return NextResponse.json({ error: "You don't own this plot." }, { status: 403 });
  }

  // A tier change is an upgrade only (never downgrade); it charges the difference
  // and recolors the plot to the new tier.
  let tierData = {};
  if (d.tier && d.tier !== plot.tier) {
    if (tierRank(d.tier) < tierRank(plot.tier)) {
      return NextResponse.json(
        { error: "You can only upgrade to a higher tier." },
        { status: 400 },
      );
    }
    const newInfo = TIERS[d.tier];
    const diff = Math.max(0, newInfo.price - plot.purchasePrice);
    tierData = { tier: d.tier, color: newInfo.color, purchasePrice: newInfo.price };
    await prisma.transaction.create({
      data: { plotId: id, buyerId: session.userId, amount: diff, type: "PRIMARY" },
    });
  }

  const updated = await prisma.plot.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.color !== undefined ? { color: d.color } : {}),
      ...(d.linkUrl !== undefined ? { linkUrl: d.linkUrl || null } : {}),
      ...(d.message !== undefined ? { message: d.message || null } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl || null } : {}),
      ...tierData,
    },
  });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    tier: updated.tier,
  });
}
