import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/security";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  if (!(await isSameOriginRequest())) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  await createSession({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  return NextResponse.json({ id: user.id, displayName: user.displayName });
}
