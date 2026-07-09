import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { COUNTRIES, flagEmoji } from "@/lib/countries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Countries — APlotInWeb",
  description:
    "Browse digital-plot activity by country: how many plots are claimed and owned around the world.",
};

export default async function CountriesPage() {
  // Plot counts per country, most active first.
  const grouped = await prisma.plot.groupBy({
    by: ["countryCode"],
    _count: { countryCode: true },
    orderBy: { _count: { countryCode: "desc" } },
  });
  const countByCode = new Map(
    grouped
      .filter((g) => g.countryCode)
      .map((g) => [g.countryCode as string, g._count.countryCode]),
  );

  const active = COUNTRIES.filter((c) => countByCode.has(c.code)).sort(
    (a, b) => (countByCode.get(b.code) ?? 0) - (countByCode.get(a.code) ?? 0),
  );
  const rest = COUNTRIES.filter((c) => !countByCode.has(c.code));
  const totalClaimed = [...countByCode.values()].reduce((a, b) => a + b, 0);

  return (
    <main className="flex-1 mx-auto max-w-[1100px] w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Explore by country</h1>
      <p className="text-[var(--muted)] text-sm mb-6">
        {totalClaimed.toLocaleString()} plots claimed across{" "}
        {countByCode.size.toLocaleString()}{" "}
        {countByCode.size === 1 ? "country" : "countries"} — and counting.
      </p>

      {active.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            Where land is being claimed
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {active.map((c) => (
              <Link
                key={c.code}
                href={`/country/${c.code}`}
                className="card p-4 flex items-center gap-3 hover:border-[var(--cyan)] transition-colors"
              >
                <span className="text-3xl leading-none">{flagEmoji(c.code)}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {(countByCode.get(c.code) ?? 0).toLocaleString()} plot
                    {countByCode.get(c.code) === 1 ? "" : "s"} claimed
                  </div>
                </div>
                <span className="text-[var(--muted)]">→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
        Every country {active.length > 0 ? "— be the first" : ""}
      </h2>
      <div className="card p-2">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rest.map((c) => (
            <Link
              key={c.code}
              href={`/country/${c.code}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--panel-2)] transition-colors"
            >
              <span>{flagEmoji(c.code)}</span>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
