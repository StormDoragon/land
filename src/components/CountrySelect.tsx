"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, flagEmoji, type Country } from "@/lib/countries";
import { readJson } from "@/lib/api-client";

interface Serialized {
  code: string;
  name: string;
}

/**
 * Site-wide country picker. Shows the country in effect (auto-detected from the
 * visitor's IP until they choose one), and lets them switch to any country or
 * the worldwide "Global" view. Selecting persists a cookie and focuses the map.
 */
export function CountrySelect({
  current,
  detected,
}: {
  current: Serialized | null; // null => Global view
  detected: Serialized | null; // IP-detected country, if any
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
    );
  }, [query]);

  async function choose(code: string) {
    setBusy(true);
    const res = await fetch("/api/country", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    await readJson(res);
    setBusy(false);
    setOpen(false);
    setQuery("");
    // The choice is persisted in a cookie; take the visitor to the map and
    // re-render so the header and map both pick up the new scope.
    router.push("/map");
    router.refresh();
  }

  const label = current
    ? `${flagEmoji(current.code)} ${current.name}`
    : "🌍 Global";

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost text-sm !py-2 !px-3 gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Choose a country"
      >
        <span className="max-w-[9rem] truncate">{label}</span>
        <span className="text-[var(--muted)] text-[10px]">▼</span>
      </button>

      {open && (
        <div className="card absolute right-0 mt-2 w-[280px] p-2 z-[1100] shadow-xl">
          <input
            autoFocus
            className="input mb-2 !py-2"
            placeholder="Search countries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-[320px] overflow-y-auto pr-0.5">
            <Option
              active={current === null}
              onClick={() => choose("GLOBAL")}
              disabled={busy}
            >
              🌍 <span className="font-semibold">Global</span>
              <span className="text-[var(--muted)] text-xs ml-1">worldwide</span>
            </Option>

            {detected && (
              <Option
                active={current?.code === detected.code}
                onClick={() => choose(detected.code)}
                disabled={busy}
              >
                {flagEmoji(detected.code)} {detected.name}
                <span className="pill ml-auto !py-0.5 !px-2 text-[10px]">
                  your location
                </span>
              </Option>
            )}

            <div className="my-1 border-t border-[var(--border)]" />

            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[var(--muted)]">
                No countries match “{query}”.
              </div>
            ) : (
              filtered.map((c: Country) => (
                <Option
                  key={c.code}
                  active={current?.code === c.code}
                  onClick={() => choose(c.code)}
                  disabled={busy}
                >
                  {flagEmoji(c.code)} {c.name}
                </Option>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Option({
  children,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      style={{
        background: active ? "rgba(34,211,238,0.12)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(148,197,255,0.08)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
