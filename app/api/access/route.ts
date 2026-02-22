import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "wedding_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  const expected = process.env.APP_ACCESS_CODE?.trim();
  if (!expected) return NextResponse.json({ ok: false }, { status: 503 });
  const ok = token === expected;
  return NextResponse.json({ ok });
}

export async function POST(req: NextRequest) {
  const expected = process.env.APP_ACCESS_CODE?.trim();
  if (!expected) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { code } = await req.json().catch(() => ({}));
  if (String(code).trim() !== expected) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
