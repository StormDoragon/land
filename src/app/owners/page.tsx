import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TIERS, tierRank } from "@/lib/grid";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const plots = await prisma.plot.findMany({
    orderBy: [{ purchasePrice: "desc" }, { purchasedAt: "desc" }],
    take: 60,
    include: { owner: { select: { displayName: true } } },
  });

  // Sort by tier prominence then price.
  plots.sort((a, b) => tierRank(b.tier) - tierRank(a.tier) || b.purchasePrice - a.purchasePrice);

  return (
    <main className="flex-1 mx-auto max-w-[1220px] w-full px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold">Owners</h1>
        <p className="text-[var(--muted)] mt-1">
          The people and brands on the map. Click any owner to see their public plot.
        </p>
      </div>

      {plots.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🌍</div>
          <p className="text-[var(--muted)] mb-4">No plots claimed yet — be the first.</p>
          <Link href="/map" className="btn btn-primary">
            Claim a plot
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plots.map((p) => (
            <Link
              key={p.id}
              href={`/plot/${p.id}`}
              className="card p-5 text-center hover:border-[var(--cyan)] transition-colors flex flex-col"
            >
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logoUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3"
                />
              ) : (
                <span
                  className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-3 font-extrabold text-2xl text-[#041018]"
                  style={{ background: p.color }}
                >
                  {(p.name || p.owner.displayName)[0]}
                </span>
              )}
              <div className="font-semibold truncate">{p.name || "Unnamed plot"}</div>
              <div className="text-xs text-[var(--muted)]">{p.owner.displayName}</div>
              <div className="text-xs text-[var(--muted)] mb-2">
                {p.locationLabel ?? "Somewhere on Earth"}
              </div>
              <span className="pill mt-auto self-center">{TIERS[p.tier].label}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
