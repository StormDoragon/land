// Best-effort geocoding via OpenStreetMap Nominatim.
// Failures are non-fatal — reverse lookups just keep a null location label,
// address searches return an empty result set.

const NOMINATIM_HEADERS = { "User-Agent": "OwnTheWorld/1.0 (demo app)" };

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Forward geocoding: turn a free-text address / place query into a ranked list
 * of candidate locations the user can pick from in the map search bar.
 */
export async function searchAddress(
  query: string,
  limit = 6,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2` +
      `&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=0`;
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    if (!Array.isArray(data)) return [];
    return data
      .map((d) => ({
        label: d.display_name ?? "",
        lat: Number(d.lat),
        lng: Number(d.lon),
      }))
      .filter(
        (r) =>
          r.label !== "" &&
          Number.isFinite(r.lat) &&
          Number.isFinite(r.lng),
      );
  } catch {
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
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
