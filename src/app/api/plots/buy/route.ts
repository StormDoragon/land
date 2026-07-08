import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cellFromIndices, BASE_PRICE } from "@/lib/grid";
import { reverseGeocode } from "@/lib/geocode";

const schema = z.object({
  gridX: z.number().int(),
  gridY: z.number().int(),
  name: z.string().max(60).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

// POST /api/plots/buy — primary purchase of a fresh cell at BASE_PRICE (mock checkout).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { gridX, gridY, name, color } = parsed.data;
  const cell = cellFromIndices(gridX, gridY);

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
          color: color || "#22c55e",
          locationLabel: label,
          purchasePrice: BASE_PRICE,
          ownerId: session.userId,
        },
      });
      await tx.transaction.create({
        data: {
          plotId: created.id,
          buyerId: session.userId,
          amount: BASE_PRICE,
          type: "PRIMARY",
        },
      });
      return created;
    });

    return NextResponse.json({ id: plot.id, price: BASE_PRICE });
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
