// Best-effort reverse geocoding via OpenStreetMap Nominatim.
// Failures are non-fatal — a plot just keeps a null location label.

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OwnTheWorld/1.0 (demo app)" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const a = data.address ?? {};
    const city =
      a.city || a.town || a.village || a.municipality || a.county || a.state;
    const country = a.country;
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    return data.display_name?.split(",").slice(0, 2).join(",").trim() ?? null;
  } catch {
    return null;
  }
}
