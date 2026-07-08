import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(40),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { email, displayName, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: { email, displayName, passwordHash: await hashPassword(password) },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  return NextResponse.json({ id: user.id, displayName: user.displayName });
}
