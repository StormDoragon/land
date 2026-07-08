const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this real land?",
    a: "No. A plot is a digital web asset — a visible spot + public profile on our world map. It is not physical real estate.",
  },
  {
    q: "What do I actually own?",
    a: "A unique cell on the global grid, tied to a real-world location, registered to your account with a digital ownership certificate and full transaction history.",
  },
  {
    q: "Can I resell my plot?",
    a: "Yes. Owners can list any plot on the marketplace at any price. Ownership transfers instantly and the sale is recorded on the plot's certificate.",
  },
  {
    q: "Is blockchain required?",
    a: "No. Ownership lives in our database today with a verifiable certificate. On-chain / NFT proof is a planned Phase 2 upgrade — we never claim it exists before it ships.",
  },
  {
    q: "Can businesses buy?",
    a: "Absolutely. Add your logo, link, city and message, and choose Premium, Founder or Homepage tiers for featured placement.",
  },
  {
    q: "How does APlotInWeb earn?",
    a: "From plot sales, tier upgrades, and a marketplace fee on resales. Sponsor zones and verification badges are on the roadmap.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex-1 mx-auto max-w-[1000px] w-full px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold">FAQ</h1>
        <p className="text-[var(--muted)] mt-1">Straight answers for buyers.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {FAQS.map((f) => (
          <div key={f.q} className="card p-5">
            <h3 className="font-semibold mb-2 text-[var(--cyan)]">{f.q}</h3>
            <p className="text-[14px] text-[var(--muted)] leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
