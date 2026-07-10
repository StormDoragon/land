import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  findCountry,
  flagEmoji,
  focusForCountry,
  type Country,
} from "@/lib/countries";
import { TIERS, TIER_ORDER, type PlotTier } from "@/lib/grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = findCountry(code);
  if (!country) return { title: "Country — APlotInWeb" };
  return {
    title: `${country.name} — plots on APlotInWeb`,
    description: `See how many digital plots are claimed in ${country.name}, who owns them, and claim your own.`,
  };
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = findCountry(code);
  if (!country) notFound();

  const cc = country.code;
  const [session, total, ownersAll, invested, tierGroups, recent, listings] =
    await Promise.all([
      getSession(),
      prisma.plot.count({ where: { countryCode: cc } }),
      prisma.plot.groupBy({
        by: ["ownerId"],
        where: { countryCode: cc },
        _count: { ownerId: true },
        _sum: { purchasePrice: true },
        orderBy: { _count: { ownerId: "desc" } },
      }),
      prisma.plot.aggregate({
        where: { countryCode: cc },
        _sum: { purchasePrice: true },
      }),
      prisma.plot.groupBy({
        by: ["tier"],
        where: { countryCode: cc },
        _count: { tier: true },
      }),
      prisma.plot.findMany({
        where: { countryCode: cc },
        orderBy: { purchasedAt: "desc" },
        take: 8,
        include: { owner: { select: { displayName: true } } },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", plot: { countryCode: cc } },
        orderBy: { price: "asc" },
        take: 6,
        select: {
          id: true,
          price: true,
          plot: {
            select: {
              id: true,
              name: true,
              locationLabel: true,
              color: true,
              tier: true,
              owner: { select: { displayName: true } },
            },
          },
        },
      }),
    ]);

  const uniqueOwners = ownersAll.length;
  const totalInvested = invested._sum.purchasePrice ?? 0;
  const forSaleCount = listings.length;

  // Owner names for the top-owners table.
  const topOwners = ownersAll.slice(0, 8);
  const ownerRows = await prisma.user.findMany({
    where: { id: { in: topOwners.map((o) => o.ownerId) } },
    select: { id: true, displayName: true },
  });
  const nameById = new Map(ownerRows.map((o) => [o.id, o.displayName]));

  const tierCount = new Map<PlotTier, number>(
    tierGroups.map((g) => [g.tier, g._count.tier]),
  );
  const tierMax = Math.max(1, ...tierGroups.map((g) => g._count.tier));

  const focus = focusForCountry(cc);

  return (
    <main className="flex-1 mx-auto max-w-[1100px] w-full px-4 py-8">
      {/* HERO */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none">{flagEmoji(cc)}</span>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Country
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{country.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/map" className="btn btn-primary">
            Claim a plot in {country.name}
          </Link>
          <Link href="/countries" className="btn btn-outline">
            All countries
          </Link>
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat value={total.toLocaleString()} label="Plots claimed" accent="cyan" />
        <Stat value={uniqueOwners.toLocaleString()} label="Owners" accent="violet" />
        <Stat
          value={`$${totalInvested.toLocaleString()}`}
          label="Total invested"
          accent="green"
        />
        <Stat value={forSaleCount.toLocaleString()} label="For sale now" accent="gold" />
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6">
        {/* LEFT: map + recent claims */}
        <div className="space-y-6">
          <div className="card p-3">
            <div className="flex items-center justify-between text-[13px] text-[var(--muted)] px-1 pb-2">
              <span>🗺️ {country.name} on the map</span>
              <span className="pill">click a cell to claim</span>
            </div>
            <div className="h-[360px] rounded-2xl overflow-hidden">
              <MapExplorer
                user={session ? { displayName: session.displayName } : null}
                variant="embed"
                initialFocus={focus}
                focusLabel={country.name}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Recent claims</h2>
            {recent.length === 0 ? (
              <EmptyClaims country={country} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {recent.map((p) => (
                  <li key={p.id} className="py-2.5 flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg grid place-items-center text-[13px] font-bold text-[#041018] shrink-0"
                      style={{ background: p.color }}
                    >
                      {(p.name || p.owner.displayName || "?")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/plot/${p.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {p.name || p.locationLabel || "Unnamed plot"}
                      </Link>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {p.owner.displayName} · {TIERS[p.tier].label}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--muted)] whitespace-nowrap">
                      {timeAgo(p.purchasedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: tiers, owners, for sale */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Plots by tier</h2>
            {total === 0 ? (
              <p className="text-sm text-[var(--muted)]">No plots claimed yet.</p>
            ) : (
              <div className="space-y-2.5">
                {TIER_ORDER.map((t) => {
                  const n = tierCount.get(t) ?? 0;
                  const info = TIERS[t];
                  return (
                    <div key={t} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-[var(--muted)]">{info.label.replace(" Plot", "").replace(" Asset", "")}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-[var(--panel-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(n / tierMax) * 100}%`,
                            background: info.color,
                            minWidth: n > 0 ? "6px" : 0,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums">{n}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Top owners</h2>
            {topOwners.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Be the first to own land in {country.name}.
              </p>
            ) : (
              <ol className="space-y-2">
                {topOwners.map((o, i) => (
                  <li key={o.ownerId} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-[var(--muted)]">
                      {["🥇", "🥈", "🥉"][i] ?? i + 1}
                    </span>
                    <span className="flex-1 font-medium truncate">
                      {nameById.get(o.ownerId) ?? "Unknown"}
                    </span>
                    <span className="text-[var(--muted)] tabular-nums">
                      {o._count.ownerId} plot{o._count.ownerId === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">On the market</h2>
            {listings.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Nothing listed for resale here yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {listings.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/plot/${l.plot.id}`}
                      className="flex items-center gap-3 text-sm group"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: l.plot.color }}
                      />
                      <span className="flex-1 truncate group-hover:underline">
                        {l.plot.name || l.plot.locationLabel || "Unnamed plot"}
                      </span>
                      <span className="font-semibold text-[var(--green)] tabular-nums">
                        ${l.price.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5 text-center">
            <div className="text-2xl font-extrabold grad">Unlimited</div>
            <div className="text-xs text-[var(--muted)] mt-1">
              open cells left in {country.name} — every empty spot is claimable from ${TIERS.BASIC.price}.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: "cyan" | "violet" | "green" | "gold";
}) {
  const color = {
    cyan: "var(--cyan)",
    violet: "var(--violet)",
    green: "var(--green)",
    gold: "var(--gold)",
  }[accent];
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5">{label}</div>
    </div>
  );
}

function EmptyClaims({ country }: { country: Country }) {
  return (
    <div className="text-sm text-[var(--muted)] py-4 text-center">
      No plots claimed in {country.name} yet.{" "}
      <Link href="/map" className="text-[var(--cyan)] hover:underline">
        Be the first →
      </Link>
    </div>
  );
}
