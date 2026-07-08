import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCoords, TIERS } from "@/lib/grid";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const plots = await prisma.plot.findMany({
    where: { ownerId: session.userId },
    orderBy: { purchasedAt: "desc" },
    include: { listings: { where: { status: "ACTIVE" }, take: 1 } },
  });

  const totalValue = plots.reduce((sum, p) => sum + p.purchasePrice, 0);
  const listedCount = plots.filter((p) => p.listings.length > 0).length;

  return (
    <main className="flex-1 mx-auto max-w-[1100px] w-full px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Plots</h1>
          <p className="text-[var(--muted)] text-sm">
            Welcome back, {session.displayName}.
          </p>
        </div>
        <Link href="/map" className="btn btn-primary">
          🌐 Claim more plots
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Plots owned" value={String(plots.length)} />
        <Stat label="Total invested" value={`$${totalValue.toLocaleString()}`} />
        <Stat label="Listed for resale" value={String(listedCount)} />
      </div>

      {plots.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-[var(--muted)] mb-4">
            You don&apos;t own any plots yet. The world is waiting.
          </p>
          <Link href="/map" className="btn btn-primary">
            Explore the map
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((p) => (
            <Link key={p.id} href={`/plot/${p.id}`} className="card p-4 hover:border-[var(--cyan)] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: p.color }}
                />
                <span className="font-semibold truncate flex-1">
                  {p.name || "Unnamed plot"}
                </span>
                <span className="pill text-[11px] py-0.5" style={{ color: TIERS[p.tier].color }}>
                  {TIERS[p.tier].label}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mb-1">
                📍 {p.locationLabel ?? "Somewhere on Earth"}
              </div>
              <div className="text-xs font-mono text-[var(--muted)]">
                {formatCoords(p.centerLat, p.centerLng)}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">
                  Paid ${p.purchasePrice.toLocaleString()}
                </span>
                {p.listings.length > 0 && (
                  <span className="pill text-[var(--emerald)]">
                    Listed ${p.listings[0].price.toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold text-[var(--cyan)]">{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{label}</div>
    </div>
  );
}
