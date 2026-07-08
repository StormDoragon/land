"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SoldPlot, SelectedCell } from "./WorldMap";
import type { CellBounds, PlotTier } from "@/lib/grid";
import { formatCoords, TIERS, TIER_ORDER } from "@/lib/grid";

const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center text-[var(--muted)]">
      Loading the world…
    </div>
  ),
});

interface CellInfo {
  status: "available" | "owned";
  id?: string;
  gridX: number;
  gridY: number;
  centerLat: number;
  centerLng: number;
  price?: number;
  name?: string | null;
  color?: string;
  tier?: PlotTier;
  linkUrl?: string | null;
  message?: string | null;
  logoUrl?: string | null;
  locationLabel?: string | null;
  owner?: { id: string; displayName: string };
  isMine?: boolean;
  forSale?: boolean;
  listingId?: string | null;
  forSalePrice?: number | null;
}

export function MapExplorer({
  user,
  variant = "full",
}: {
  user: { displayName: string } | null;
  variant?: "full" | "embed";
}) {
  const router = useRouter();
  const [plots, setPlots] = useState<SoldPlot[]>([]);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [cell, setCell] = useState<CellInfo | null>(null);
  const [bounds, setBounds] = useState<CellBounds | null>(null);
  const [zoom, setZoom] = useState(3);
  const [loadingCell, setLoadingCell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tier, setTier] = useState<PlotTier>("BASIC");
  const [name, setName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [message, setMessage] = useState("");
  const [listPrice, setListPrice] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPlots = useCallback(async (b: CellBounds) => {
    const qs = new URLSearchParams({
      minLat: String(b.south),
      minLng: String(b.west),
      maxLat: String(b.north),
      maxLng: String(b.east),
    });
    const res = await fetch(`/api/plots?${qs}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlots(data.plots);
  }, []);

  const onBoundsChange = useCallback(
    (b: CellBounds, z: number) => {
      setBounds(b);
      setZoom(z);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadPlots(b), 250);
    },
    [loadPlots],
  );

  const selectCell = useCallback(async (c: SelectedCell) => {
    setSelected(c);
    setCell(null);
    setError(null);
    setTier("BASIC");
    setName("");
    setLinkUrl("");
    setMessage("");
    setListPrice("");
    setLoadingCell(true);
    const res = await fetch(`/api/plots/cell?x=${c.gridX}&y=${c.gridY}`);
    const data = await res.json();
    setLoadingCell(false);
    setCell(data);
    if (data.status === "owned") {
      setName(data.name ?? "");
      setLinkUrl(data.linkUrl ?? "");
      setMessage(data.message ?? "");
    }
  }, []);

  async function refreshAfterChange() {
    if (bounds) await loadPlots(bounds);
    if (selected) {
      const res = await fetch(`/api/plots/cell?x=${selected.gridX}&y=${selected.gridY}`);
      setCell(await res.json());
    }
    router.refresh();
  }

  async function buy() {
    if (!cell) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/plots/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gridX: cell.gridX,
        gridY: cell.gridY,
        tier,
        name: name || undefined,
        linkUrl: linkUrl || undefined,
        message: message || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Purchase failed.");
    await refreshAfterChange();
  }

  async function buyResale() {
    if (!cell?.id) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/plots/${cell.id}/buy-resale`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Purchase failed.");
    await refreshAfterChange();
  }

  async function listForSale() {
    if (!cell?.id) return;
    const price = Number(listPrice);
    if (!price || price <= 0) return setError("Enter a valid price.");
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/plots/${cell.id}/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not list plot.");
    await refreshAfterChange();
  }

  async function unlist() {
    if (!cell?.id) return;
    setBusy(true);
    const res = await fetch(`/api/plots/${cell.id}/unlist`, { method: "POST" });
    setBusy(false);
    if (res.ok) await refreshAfterChange();
  }

  async function saveProfile() {
    if (!cell?.id) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/plots/${cell.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || null,
        linkUrl: linkUrl || null,
        message: message || null,
      }),
    });
    setBusy(false);
    if (res.ok) await refreshAfterChange();
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const rootClass =
    variant === "full"
      ? "relative w-full h-[calc(100vh-3.5rem)]"
      : "relative w-full h-full";

  return (
    <div className={rootClass}>
      <WorldMap
        plots={plots}
        selected={selected}
        currentBounds={bounds}
        currentZoom={zoom}
        onSelect={selectCell}
        onBoundsChange={onBoundsChange}
      />

      {/* Floating intro card when nothing is selected */}
      {!selected && (
        <div className="pointer-events-none absolute left-4 bottom-6 z-[500] max-w-sm">
          <div className="card p-4 pointer-events-auto">
            <div className="text-sm font-semibold mb-1">
              Own a visible piece of the internet 🌐
            </div>
            <p className="text-[13px] text-[var(--muted)] leading-relaxed">
              Zoom into any city and click a plot to claim it. Plots start at{" "}
              <span className="text-[var(--cyan)] font-semibold">$5</span>. Add your name,
              link and message — then resell your verified digital asset.
            </p>
          </div>
        </div>
      )}

      {/* Zoom hint */}
      {selected && zoom < 13 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-[500]">
          <div className="pill">🔍 Zoom in to see individual plots clearly</div>
        </div>
      )}

      {/* Slide-in plot panel */}
      {selected && (
        <div className="absolute top-4 right-4 z-[600] w-[340px] max-w-[calc(100vw-2rem)] slidein">
          <div className="card p-5 max-h-[calc(100%-2rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Plot #{selected.gridX}, {selected.gridY}
                </div>
                <div className="text-sm font-mono text-[var(--muted)] mt-0.5">
                  {cell ? formatCoords(cell.centerLat, cell.centerLng) : "…"}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setCell(null);
                }}
                className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {loadingCell && (
              <div className="text-sm text-[var(--muted)] py-6 text-center">
                Checking the registry…
              </div>
            )}

            {cell?.locationLabel && <div className="pill mb-3">📍 {cell.locationLabel}</div>}

            {/* AVAILABLE */}
            {cell?.status === "available" && (
              <>
                <label className="block text-xs text-[var(--muted)] mb-1">Choose a tier</label>
                <div className="space-y-2 mb-4">
                  {TIER_ORDER.map((t) => {
                    const info = TIERS[t];
                    const active = tier === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTier(t)}
                        className="w-full text-left rounded-xl border p-2.5 flex items-center gap-3 transition-colors"
                        style={{
                          borderColor: active ? info.color : "var(--border)",
                          background: active ? "rgba(103,232,249,0.08)" : "transparent",
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: info.color }}
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">{info.label}</span>
                          <span className="block text-[11px] text-[var(--muted)]">
                            {info.blurb}
                          </span>
                        </span>
                        <span className="font-bold" style={{ color: info.color }}>
                          ${info.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {user ? (
                  <>
                    <input
                      className="input mb-2"
                      placeholder="Your name or business"
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className="input mb-2"
                      placeholder="Website or social link (optional)"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <textarea
                      className="input mb-3"
                      placeholder="Public message (optional)"
                      rows={2}
                      value={message}
                      maxLength={280}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button onClick={buy} disabled={busy} className="btn btn-primary w-full">
                      {busy ? "Claiming…" : `Claim ${TIERS[tier].label} · $${TIERS[tier].price}`}
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="btn btn-primary w-full">
                    Log in to claim · from $5
                  </Link>
                )}
              </>
            )}

            {/* OWNED */}
            {cell?.status === "owned" && (
              <>
                <div className="mb-3 flex items-center gap-3">
                  {cell.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cell.logoUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      className="w-10 h-10 rounded-lg grid place-items-center font-bold text-[#041018]"
                      style={{ background: cell.color }}
                    >
                      {(cell.name || cell.owner?.displayName || "?")[0]}
                    </span>
                  )}
                  <div>
                    <div className="text-base font-semibold leading-tight">
                      {cell.name || "Unnamed plot"}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {cell.tier ? TIERS[cell.tier].label : "Basic"} · owned by{" "}
                      {cell.isMine ? "you" : cell.owner?.displayName}
                    </div>
                  </div>
                </div>

                {cell.message && (
                  <p className="text-sm text-[var(--muted)] italic mb-3">“{cell.message}”</p>
                )}
                {cell.linkUrl && (
                  <a
                    href={cell.linkUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-[var(--cyan)] hover:underline break-all block mb-3"
                  >
                    🔗 {cell.linkUrl}
                  </a>
                )}

                {cell.forSale && !cell.isMine && (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold text-[var(--green)]">
                        ${cell.forSalePrice}
                      </span>
                      <span className="text-sm text-[var(--muted)]">resale price</span>
                    </div>
                    {user ? (
                      <button onClick={buyResale} disabled={busy} className="btn btn-emerald w-full">
                        {busy ? "Buying…" : `Buy now · $${cell.forSalePrice}`}
                      </button>
                    ) : (
                      <Link href="/login" className="btn btn-emerald w-full">
                        Log in to buy · ${cell.forSalePrice}
                      </Link>
                    )}
                  </>
                )}

                {!cell.forSale && !cell.isMine && (
                  <div className="pill">🔒 Not currently for sale</div>
                )}

                {cell.isMine && (
                  <div className="space-y-3">
                    <input
                      className="input"
                      placeholder="Plot name"
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Website or social link"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <textarea
                      className="input"
                      placeholder="Public message"
                      rows={2}
                      value={message}
                      maxLength={280}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button onClick={saveProfile} disabled={busy} className="btn btn-outline w-full">
                      Save profile
                    </button>

                    <hr className="border-[var(--border)]" />

                    {cell.forSale ? (
                      <>
                        <div className="pill mb-1">🏷️ Listed for ${cell.forSalePrice}</div>
                        <button onClick={unlist} disabled={busy} className="btn btn-ghost w-full">
                          Remove from sale
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          placeholder="Resale price $"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                        />
                        <button
                          onClick={listForSale}
                          disabled={busy}
                          className="btn btn-emerald whitespace-nowrap"
                        >
                          List
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {cell.id && (
                  <Link
                    href={`/plot/${cell.id}`}
                    className="block text-center text-sm text-[var(--cyan)] mt-4 hover:underline"
                  >
                    View owner page & certificate →
                  </Link>
                )}
              </>
            )}

            {error && <div className="text-sm text-[var(--danger)] mt-3">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
