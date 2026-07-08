import "server-only";
import { headers } from "next/headers";

function getExpectedOrigin(headerList: Headers): string | null {
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerList.get("host");
  if (!host) return null;
  return `${forwardedProto || "https"}://${host}`;
}

/**
 * Best-effort CSRF guard for cookie-authenticated mutation routes.
 * Allows same-origin requests and non-browser clients that omit Origin/Referer.
 */
export async function isSameOriginRequest(): Promise<boolean> {
  const headerList = await headers();
  const expectedOrigin = getExpectedOrigin(headerList);
  const origin = headerList.get("origin");
  const referer = headerList.get("referer");

  if (!expectedOrigin) return true;
  if (origin) return origin === expectedOrigin;
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }
  return true;
}
