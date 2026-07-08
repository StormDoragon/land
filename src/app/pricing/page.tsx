import Link from "next/link";
import { PricingGrid } from "@/components/PricingGrid";

export default function PricingPage() {
  return (
    <main className="flex-1 mx-auto max-w-[1220px] w-full px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold">Pricing</h1>
        <p className="text-[var(--muted)] mt-1">
          Start cheap. Upgrade your plot as demand grows. Resale price is always yours to set.
        </p>
      </div>
      <PricingGrid />
      <div className="text-center mt-10">
        <Link href="/map" className="btn btn-primary">
          Explore the map &amp; claim a plot
        </Link>
      </div>
    </main>
  );
}
