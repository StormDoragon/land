"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(isRegister ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isRegister ? { email, displayName, password } : { email, password },
      ),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex-1 grid place-items-center px-4 py-12">
      <div className="card p-7 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2 grad font-extrabold">APlotInWeb</div>
          <h1 className="text-xl font-bold">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isRegister
              ? "Claim your visible piece of the internet."
              : "Sign in to manage your plots."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Display name</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={40}
                placeholder="Land Baron"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-[var(--danger)]">{error}</div>}

          <button type="submit" disabled={busy} className="btn btn-gold w-full">
            {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <div className="text-center text-sm text-[var(--muted)] mt-5">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/register" className="text-[var(--accent)] hover:underline">
                Create an account
              </Link>
            </>
          )}
        </div>

        {!isRegister && (
          <div className="text-center text-xs text-[var(--muted)] mt-4 border-t border-[var(--border)] pt-4">
            Demo account: <span className="font-mono">demo@aplotinweb.com</span> /{" "}
            <span className="font-mono">password123</span>
          </div>
        )}
      </div>
    </div>
  );
}
