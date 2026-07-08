import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCoords, cellFromIndices } from "@/lib/grid";

export const dynamic = "force-dynamic";

export default async function PlotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const plot = await prisma.plot.findUnique({
    where: { id },
    include: {
      owner: { select: { displayName: true } },
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
  if (!plot) notFound();

  const isMine = session?.userId === plot.ownerId;
  const listing = plot.listings[0] ?? null;
  const cell = cellFromIndices(plot.gridX, plot.gridY);

  return (
    <main className="flex-1 mx-auto max-w-[760px] w-full px-4 py-8">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Back to the map
      </Link>

      {/* Deed certificate */}
      <div
        className="card mt-4 p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #182241, #0f1730), radial-gradient(600px 200px at 100% 0%, rgba(245,196,81,0.12), transparent)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ background: `repeating-linear-gradient(45deg, ${plot.color} 0 2px, transparent 2px 18px)` }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
              Certificate of Ownership
            </div>
            <div className="text-2xl">🌍</div>
          </div>

          <div className="flex items-center gap-3 mb-1">
            <span
              className="w-6 h-6 rounded-full border-2 border-white/30"
              style={{ background: plot.color }}
            />
            <h1 className="text-2xl font-bold">
              {plot.name || "Unnamed Plot"}
            </h1>
          </div>
          <div className="text-[var(--muted)] mb-6">
            📍 {plot.locationLabel ?? "An undisclosed corner of Earth"}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Owner" value={plot.owner.displayName} />
            <Field label="Plot ID" value={`#${plot.gridX}, ${plot.gridY}`} />
            <Field label="Coordinates" value={formatCoords(cell.centerLat, cell.centerLng)} mono />
            <Field
              label="Claimed"
              value={new Date(plot.purchasedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </div>

          {listing && (
            <div className="mt-6 pill text-[var(--emerald)]">
              🏷️ Listed for resale · ${listing.price.toLocaleString()}
            </div>
          )}

          {isMine && (
            <div className="mt-6">
              <Link href="/dashboard" className="btn btn-gold">
                Manage in My Land
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card mt-6 p-6">
        <div className="text-sm font-semibold mb-4">Ownership history</div>
        <ol className="space-y-3">
          {plot.transactions.map((t) => (
            <li key={t.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1 w-2 h-2 rounded-full bg-[var(--gold)] shrink-0" />
              <div>
                <div>
                  <span className="font-semibold">{t.buyer.displayName}</span>{" "}
                  {t.type === "PRIMARY" ? (
                    <>claimed this plot from the wild</>
                  ) : (
                    <>
                      bought it from{" "}
                      <span className="font-semibold">
                        {t.seller?.displayName ?? "a previous owner"}
                      </span>
                    </>
                  )}{" "}
                  for <span className="text-[var(--gold)]">${t.amount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)] uppercase tracking-wide">{label}</div>
      <div className={mono ? "font-mono" : "font-semibold"}>{value}</div>
    </div>
  );
}
