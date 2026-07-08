import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { findCountry } from "@/lib/countries";
import { COUNTRY_COOKIE, GLOBAL_COOKIE_VALUE } from "@/lib/geo";
import { isSameOriginRequest } from "@/lib/security";

const bodySchema = z.object({
  // A 2-letter country code, or the sentinel for the worldwide view.
  code: z.string().min(2).max(6),
});

const ONE_YEAR = 60 * 60 * 24 * 365;

// POST /api/country { code }  — persist the visitor's chosen country scope.
export async function POST(req: Request) {
  if (!(await isSameOriginRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const raw = parsed.data.code.toUpperCase();
  let value: string;
  if (raw === GLOBAL_COOKIE_VALUE) {
    value = GLOBAL_COOKIE_VALUE;
  } else {
    const country = findCountry(raw);
    if (!country) {
      return NextResponse.json({ error: "Unknown country" }, { status: 400 });
    }
    value = country.code;
  }

  const cookieStore = await cookies();
  cookieStore.set(COUNTRY_COOKIE, value, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true, code: value });
}
