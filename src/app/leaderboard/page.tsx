import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function LeaderboardPage() {
  const grouped = await prisma.plot.groupBy({
    by: ["ownerId"],
    _count: { ownerId: true },
    _sum: { purchasePrice: true },
    orderBy: { _count: { ownerId: "desc" } },
    take: 20,
  });
  const owners = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.ownerId) } },
    select: { id: true, displayName: true },
  });
  const nameById = new Map(owners.map((o) => [o.id, o.displayName]));

  const recent = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      buyer: { select: { displayName: true } },
      plot: { select: { id: true, name: true, locationLabel: true } },
    },
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="flex-1 mx-auto max-w-[1000px] w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Landowner Leaderboard</h1>
      <p className="text-[var(--muted)] text-sm mb-6">
        The biggest empires on Earth — ranked by plots owned.
      </p>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
        <div className="card p-2">
          {grouped.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)]">
              No land has been claimed yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-xs uppercase">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Owner</th>
                  <th className="text-right px-3 py-2 font-medium">Plots</th>
                  <th className="text-right px-3 py-2 font-medium">Invested</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g, i) => (
                  <tr key={g.ownerId} className="border-t border-[var(--border)]">
                    <td className="px-3 py-3">{medals[i] ?? i + 1}</td>
                    <td className="px-3 py-3 font-semibold">
                      {nameById.get(g.ownerId) ?? "Unknown"}
                    </td>
                    <td className="px-3 py-3 text-right">{g._count.ownerId}</td>
                    <td className="px-3 py-3 text-right text-[var(--muted)]">
                      ${(g._sum.purchasePrice ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold mb-3">🔥 Recently sold</div>
          {recent.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">No activity yet.</div>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => (
                <li key={t.id} className="text-sm">
                  <Link href={`/plot/${t.plot.id}`} className="hover:underline">
                    <span className="font-semibold">{t.buyer.displayName}</span>{" "}
                    <span className="text-[var(--muted)]">
                      {t.type === "PRIMARY" ? "claimed" : "bought"}
                    </span>{" "}
                    {t.plot.name || t.plot.locationLabel || "a plot"}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">
                    ${t.amount.toLocaleString()} · {timeAgo(t.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
