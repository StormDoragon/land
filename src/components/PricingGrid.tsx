import Link from "next/link";
import { TIER_ORDER, TIERS } from "@/lib/grid";

export function PricingGrid({ cta = true }: { cta?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {TIER_ORDER.map((t) => {
        const info = TIERS[t];
        return (
          <div
            key={t}
            className="card p-5 flex flex-col"
            style={{ boxShadow: `inset 0 2px 0 ${info.color}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ background: info.color }} />
              <h3 className="font-semibold">{info.label}</h3>
            </div>
            <div className="text-3xl font-extrabold my-2" style={{ color: info.color }}>
              ${info.price}
            </div>
            <p className="text-[13px] text-[var(--muted)] mb-3">{info.blurb}</p>
            <ul className="text-[13px] text-[var(--muted)] space-y-1 mb-4">
              {info.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <span style={{ color: info.color }}>✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            {cta && (
              <Link href="/map" className="btn btn-outline w-full mt-auto">
                Choose {info.label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
