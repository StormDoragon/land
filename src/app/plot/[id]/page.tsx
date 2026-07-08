import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCoords, cellFromIndices, TIERS } from "@/lib/grid";

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
  const tierInfo = TIERS[plot.tier];

  return (
    <main className="flex-1 mx-auto max-w-[760px] w-full px-4 py-8">
      <Link href="/map" className="text-sm text-[var(--cyan)] hover:underline">
        ← Back to the map
      </Link>

      {/* Owner header */}
      <div className="card mt-4 p-6 flex items-center gap-4">
        {plot.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plot.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <span
            className="w-16 h-16 rounded-2xl grid place-items-center font-extrabold text-2xl text-[#041018] shrink-0"
            style={{ background: plot.color }}
          >
            {(plot.name || plot.owner.displayName)[0]}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{plot.name || "Unnamed Plot"}</h1>
            <span className="pill" style={{ color: tierInfo.color }}>
              {tierInfo.label}
            </span>
          </div>
          <div className="text-[var(--muted)] text-sm">
            {plot.owner.displayName} · 📍 {plot.locationLabel ?? "Somewhere on Earth"}
          </div>
        </div>
      </div>

      {(plot.message || plot.linkUrl) && (
        <div className="card mt-4 p-5">
          {plot.message && <p className="italic text-[var(--muted)]">“{plot.message}”</p>}
          {plot.linkUrl && (
            <a
              href={plot.linkUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-block mt-2 text-[var(--cyan)] hover:underline break-all"
            >
              🔗 {plot.linkUrl}
            </a>
          )}
        </div>
      )}

      {/* Deed certificate */}
      <div
        className="card mt-4 p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #131f3d, #0f172a), radial-gradient(600px 200px at 100% 0%, rgba(103,232,249,0.14), transparent)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ background: `repeating-linear-gradient(45deg, ${plot.color} 0 2px, transparent 2px 18px)` }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs uppercase tracking-[0.2em] grad font-semibold">
              Digital Ownership Certificate
            </div>
            <div className="text-2xl">🌐</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Owner" value={plot.owner.displayName} />
            <Field label="Tier" value={tierInfo.label} />
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
            <Field label="Blockchain proof" value="Phase 2 ready" />
          </div>

          {listing && (
            <div className="mt-6 pill text-[var(--green)]">
              🏷️ Listed for resale · ${listing.price.toLocaleString()}
            </div>
          )}

          {isMine && (
            <div className="mt-6">
              <Link href="/dashboard" className="btn btn-primary">
                Manage in Dashboard
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
