import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cellFromIndices, TIERS } from "@/lib/grid";
import { reverseGeocode } from "@/lib/geocode";

const schema = z.object({
  gridX: z.number().int(),
  gridY: z.number().int(),
  tier: z.enum(["BASIC", "CITY", "PREMIUM", "FOUNDER", "HOMEPAGE"]).default("BASIC"),
  name: z.string().max(60).optional(),
  linkUrl: z.string().url().max(300).optional().or(z.literal("")),
  message: z.string().max(280).optional(),
  logoUrl: z.string().url().max(300).optional().or(z.literal("")),
});

// POST /api/plots/buy — primary purchase of a fresh cell at the tier's price (mock checkout).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { gridX, gridY, tier, name, linkUrl, message, logoUrl } = parsed.data;
  const cell = cellFromIndices(gridX, gridY);
  const tierInfo = TIERS[tier];

  const label = await reverseGeocode(cell.centerLat, cell.centerLng);

  try {
    const plot = await prisma.$transaction(async (tx) => {
      const created = await tx.plot.create({
        data: {
          gridX,
          gridY,
          centerLat: cell.centerLat,
          centerLng: cell.centerLng,
          name: name || null,
          color: tierInfo.color,
          locationLabel: label,
          tier,
          linkUrl: linkUrl || null,
          message: message || null,
          logoUrl: logoUrl || null,
          purchasePrice: tierInfo.price,
          ownerId: session.userId,
        },
      });
      await tx.transaction.create({
        data: {
          plotId: created.id,
          buyerId: session.userId,
          amount: tierInfo.price,
          type: "PRIMARY",
        },
      });
      return created;
    });

    return NextResponse.json({ id: plot.id, price: tierInfo.price, tier });
  } catch (e) {
    // Unique constraint on (gridX, gridY) => the cell was already claimed.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This plot has already been claimed." },
        { status: 409 },
      );
    }
    throw e;
  }
}
