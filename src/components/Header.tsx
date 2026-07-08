import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { CountrySelect } from "./CountrySelect";

interface CountryChip {
  code: string;
  name: string;
}

export function Header({
  user,
  country,
  detected,
}: {
  user: { displayName: string; email: string } | null;
  country: CountryChip | null;
  detected: CountryChip | null;
}) {
  return (
    <header className="sticky top-0 z-[1000] backdrop-blur-md bg-[rgba(5,8,22,0.72)] border-b border-[rgba(103,232,249,0.14)]">
      <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-[18px]">
          <span className="logo-grad tracking-tight">APlotInWeb</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-[var(--muted)]">
          <NavLink href="/map">Map</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/owners">Owners</NavLink>
          <NavLink href="/marketplace">Marketplace</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
          {user && <NavLink href="/dashboard">Dashboard</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <CountrySelect current={country} detected={detected} />
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-[var(--muted)]">
                {user.displayName}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline text-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary text-sm">
                Claim Plot
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-full hover:text-[var(--cyan)] hover:bg-[rgba(103,232,249,0.1)]"
    >
      {children}
    </Link>
  );
}
