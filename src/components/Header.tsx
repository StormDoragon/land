import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function Header({
  user,
}: {
  user: { displayName: string; email: string } | null;
}) {
  return (
    <header className="sticky top-0 z-[1000] backdrop-blur-md bg-[rgba(8,12,24,0.72)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-[15px]">
          <span className="text-lg">🌍</span>
          <span>
            Own<span className="text-[var(--gold)]">The</span>World
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-sm text-[var(--muted)]">
          <Link href="/" className="px-3 py-2 rounded-lg hover:text-[var(--text)] hover:bg-[var(--panel)]">
            Explore
          </Link>
          <Link href="/marketplace" className="px-3 py-2 rounded-lg hover:text-[var(--text)] hover:bg-[var(--panel)]">
            Marketplace
          </Link>
          <Link href="/leaderboard" className="px-3 py-2 rounded-lg hover:text-[var(--text)] hover:bg-[var(--panel)]">
            Leaderboard
          </Link>
          {user && (
            <Link href="/dashboard" className="px-3 py-2 rounded-lg hover:text-[var(--text)] hover:bg-[var(--panel)]">
              My Land
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-[var(--muted)]">
                {user.displayName}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-gold text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
