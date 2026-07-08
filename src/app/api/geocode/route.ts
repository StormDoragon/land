import { NextResponse } from "next/server";
import { searchAddress } from "@/lib/geocode";

// GET /api/geocode?q=<address>
// Forward-geocodes a free-text address / place name into candidate locations.
// Proxied server-side so we control the User-Agent Nominatim requires and keep
// the browser off a third-party host.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchAddress(q);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
