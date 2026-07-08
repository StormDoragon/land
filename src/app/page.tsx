import Link from "next/link";
import { MapExplorer } from "@/components/MapExplorer";
import { PricingGrid } from "@/components/PricingGrid";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  const [plotCount, countries, featured] = await Promise.all([
    prisma.plot.count(),
    prisma.plot.findMany({ distinct: ["locationLabel"], select: { locationLabel: true } }),
    prisma.plot.findMany({
      orderBy: [{ purchasePrice: "desc" }, { purchasedAt: "desc" }],
      take: 4,
      include: { owner: { select: { displayName: true } } },
    }),
  ]);

  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="mx-auto max-w-[1220px] px-4 pt-12 pb-8 grid lg:grid-cols-[1.05fr_.95fr] gap-9 items-center">
        <div>
          <div className="pill mb-4">🌐 Blockchain-ready digital ownership</div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Buy your <span className="grad">digital plot</span> on the world map.
          </h1>
          <p className="text-[var(--muted)] text-lg mt-5 max-w-xl leading-relaxed">
            APlotInWeb lets people, creators, and businesses own a visible online plot on a
            real-world map — show your identity, promote your link, and later resell your
            verified digital asset.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/map" className="btn btn-primary">
              Start from ${TIERS.BASIC.price}
            </Link>
            <Link href="/map" className="btn btn-outline">
              Explore the map
            </Link>
            <Link href="/marketplace" className="btn btn-outline">
              View marketplace
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-8">
            <Stat value={`${plotCount}`} label="Plots claimed" />
            <Stat value={`${countries.length}`} label="Locations" />
            <Stat value={`$${TIERS.BASIC.price}`} label="Starting price" />
            <Stat value="10%" label="Marketplace fee" />
          </div>
        </div>

        <div className="card p-3">
          <div className="flex items-center justify-between text-[13px] text-[var(--muted)] px-2 py-1">
            <span>🔎 Click a plot to claim it</span>
            <span className="pill">LIVE MAP</span>
          </div>
          <div className="h-[460px] rounded-2xl overflow-hidden mt-1">
            <MapExplorer
              user={session ? { displayName: session.displayName } : null}
              variant="embed"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section title="How it works" subtitle="Simple first, powerful later.">
        <div className="grid md:grid-cols-3 gap-4">
          <Step n="1" title="Choose your plot">
            Pan the real-world map, click any open cell, and pick a tier from ${TIERS.BASIC.price}.
          </Step>
          <Step n="2" title="Add your identity">
            Name it, add your logo, link and public message. Paint it your color on the map.
          </Step>
          <Step n="3" title="Own &amp; resell">
            Get a digital ownership certificate now — resell your plot on the marketplace anytime.
          </Step>
        </div>
      </Section>

      {/* PRICING */}
      <Section title="Plot tiers" subtitle="Start cheap. Upgrade as your visibility grows.">
        <PricingGrid />
      </Section>

      {/* FEATURED OWNERS */}
      {featured.length > 0 && (
        <Section title="Featured owners" subtitle="People buy because they want to be seen.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <Link key={p.id} href={`/plot/${p.id}`} className="card p-5 text-center hover:border-[var(--cyan)] transition-colors">
                <span
                  className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-3 font-extrabold text-2xl text-[#041018]"
                  style={{ background: p.color }}
                >
                  {(p.name || p.owner.displayName)[0]}
                </span>
                <div className="font-semibold truncate">{p.name || "Unnamed plot"}</div>
                <div className="text-xs text-[var(--muted)] mb-2">
                  {p.locationLabel ?? "Somewhere on Earth"}
                </div>
                <span className="pill">{TIERS[p.tier].label}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-[1220px] px-4 py-16 text-center">
        <div
          className="card p-12"
          style={{
            background:
              "radial-gradient(600px 220px at 50% 0%, rgba(103,232,249,.16), transparent), linear-gradient(180deg,#131f3d,#0f172a)",
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Claim your city before it fills up.
          </h2>
          <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
            Thousands of plots across the world are still unclaimed. Grab yours from just $5.
          </p>
          <Link href="/map" className="btn btn-primary">
            Buy my first plot
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted)]">
        © {new Date().getFullYear()} APlotInWeb.com — Own a visible piece of the internet.
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3">
      <div className="text-xl font-extrabold text-[var(--cyan)]">{value}</div>
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1220px] px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <p className="text-[var(--muted)] mt-1">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="w-9 h-9 rounded-full grid place-items-center font-bold text-[#041018] bg-[var(--cyan)] mb-3">
        {n}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-[14px] text-[var(--muted)] leading-relaxed">{children}</p>
    </div>
  );
}
