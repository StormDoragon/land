import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/security";
import { destroySession } from "@/lib/auth";

export async function POST() {
  if (!(await isSameOriginRequest())) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
