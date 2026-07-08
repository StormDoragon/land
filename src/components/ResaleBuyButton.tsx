"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ResaleBuyButton({
  plotId,
  price,
  loggedIn,
  isOwn,
}: {
  plotId: string;
  price: number;
  loggedIn: boolean;
  isOwn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loggedIn) {
    return (
      <Link href="/login" className="btn btn-emerald w-full">
        Log in to buy · ${price.toLocaleString()}
      </Link>
    );
  }
  if (isOwn) {
    return <div className="pill w-full justify-center">Your listing</div>;
  }

  async function buy() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/plots/${plotId}/buy-resale`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Purchase failed.");
    router.push(`/plot/${plotId}`);
    router.refresh();
  }

  return (
    <div className="w-full">
      <button onClick={buy} disabled={busy} className="btn btn-emerald w-full">
        {busy ? "Buying…" : `Buy now · $${price.toLocaleString()}`}
      </button>
      {error && <div className="text-xs text-[var(--danger)] mt-2">{error}</div>}
    </div>
  );
}
