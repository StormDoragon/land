"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeocodeResult } from "@/lib/geocode";
import { readJson } from "@/lib/api-client";

/**
 * Address / place search box for the map. Debounces the query, fetches
 * candidate locations from `/api/geocode`, and hands the chosen one back to the
 * parent so it can fly the map there.
 */
export function AddressSearch({
  onPick,
}: {
  onPick: (result: GeocodeResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const reqIdRef = useRef(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const id = ++reqIdRef.current;
    setLoading(true);
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    const data = await readJson<{ results: GeocodeResult[] }>(res);
    // Ignore results from a stale request that resolved out of order.
    if (id !== reqIdRef.current) return;
    setLoading(false);
    setResults(data?.results ?? []);
    setActive(-1);
    setOpen(true);
  }, []);

  useEffect(() => {
    const q = query.trim();
    // All state changes happen inside the debounced callback so nothing is set
    // synchronously in the effect body (which triggers cascading renders).
    const timer = setTimeout(() => {
      if (q.length < 3) {
        reqIdRef.current++; // cancel any in-flight request's result
        setResults([]);
        setOpen(false);
        setLoading(false);
      } else {
        runSearch(q);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  // Close the dropdown when clicking outside the search box.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(result: GeocodeResult) {
    onPick(result);
    setQuery(result.label);
    setOpen(false);
    setResults([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active >= 0 ? active : 0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          🔍
        </span>
        <input
          className="input pl-9"
          placeholder="Search a city or address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search for an address or place"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
            …
          </span>
        )}
      </div>

      {open && (results.length > 0 || (!loading && query.trim().length >= 3)) && (
        <div className="card absolute left-0 right-0 mt-2 p-1 max-h-72 overflow-y-auto z-[700]">
          {results.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-[var(--muted)]">
              No matching places found.
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.lat},${r.lng},${i}`}
                onClick={() => pick(r)}
                onMouseEnter={() => setActive(i)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: i === active ? "rgba(103,232,249,0.10)" : "transparent",
                }}
              >
                <span className="mr-2">📍</span>
                {r.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
