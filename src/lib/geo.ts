import "server-only";
import { cookies, headers } from "next/headers";
import { findCountry, type Country } from "./countries";

export const COUNTRY_COOKIE = "aplot_country";
/** Cookie value meaning "the visitor explicitly chose the worldwide view". */
export const GLOBAL_COOKIE_VALUE = "GLOBAL";

/**
 * Best-effort country from the visitor's IP. Reads the geo headers set by the
 * edge/CDN (Vercel, Cloudflare, and common proxy variants). Returns an
 * uppercase alpha-2 code or null when it can't be determined.
 */
export async function detectCountryCode(): Promise<string | null> {
  const h = await headers();
  const raw =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    h.get("x-geo-country");
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  // Some providers send "XX"/"T1" for unknown / Tor exit nodes.
  if (code.length !== 2 || code === "XX" || code === "T1") return null;
  return code;
}

export interface CountryScope {
  /** The country in effect, or null for the global (worldwide) view. */
  country: Country | null;
  /** Whether the scope came from an explicit choice vs. IP auto-detection. */
  explicit: boolean;
  /** The IP-detected country, if any — used to offer "your country". */
  detected: Country | null;
}

/**
 * Resolve the country scope for the current request: an explicit cookie choice
 * wins, otherwise fall back to IP auto-detection, otherwise the global view.
 */
export async function getCountryScope(): Promise<CountryScope> {
  const cookieStore = await cookies();
  const chosen = cookieStore.get(COUNTRY_COOKIE)?.value;
  const detectedCode = await detectCountryCode();
  const detected = findCountry(detectedCode) ?? null;

  if (chosen === GLOBAL_COOKIE_VALUE) {
    return { country: null, explicit: true, detected };
  }
  const chosenCountry = findCountry(chosen);
  if (chosenCountry) {
    return { country: chosenCountry, explicit: true, detected };
  }
  // No valid choice yet — default to the visitor's detected country.
  return { country: detected, explicit: false, detected };
}
