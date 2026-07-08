import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCoords } from "@/lib/grid";
import { ResaleBuyButton } from "@/components/ResaleBuyButton";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await getSession();
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { displayName: true } },
      plot: true,
    },
  });

  return (
    <main className="flex-1 mx-auto max-w-[1100px] w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Resale Marketplace</h1>
        <p className="text-[var(--muted)] text-sm">
          Plots listed by their owners. Prices are set by sellers — from a few
          dollars to a king&apos;s ransom.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-[var(--muted)] mb-4">
            No plots are for resale right now. Be the first to flip one!
          </p>
          <Link href="/" className="btn btn-gold">
            Claim &amp; list a plot
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div key={l.id} className="card p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: l.plot.color }} />
                <Link href={`/plot/${l.plot.id}`} className="font-semibold truncate hover:underline">
                  {l.plot.name || "Unnamed plot"}
                </Link>
              </div>
              <div className="text-xs text-[var(--muted)] mb-1">
                📍 {l.plot.locationLabel ?? "Somewhere on Earth"}
              </div>
              <div className="text-xs font-mono text-[var(--muted)] mb-3">
                {formatCoords(l.plot.centerLat, l.plot.centerLng)}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-[var(--emerald)]">
                  ${l.price.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mb-4">
                Sold by {l.seller.displayName}
              </div>
              <div className="mt-auto">
                <ResaleBuyButton
                  plotId={l.plot.id}
                  price={l.price}
                  loggedIn={!!session}
                  isOwn={session?.userId === l.plot.ownerId}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
