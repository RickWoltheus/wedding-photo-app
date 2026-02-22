import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "qr_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function GET() {
  const c = await cookies();
  const pwd = process.env.QR_PASSWORD?.trim();
  if (!pwd) return NextResponse.json({ ok: false }, { status: 503 });
  const token = c.get(COOKIE_NAME)?.value;
  const ok = token === pwd;
  return NextResponse.json({ ok });
}

export async function POST(req: NextRequest) {
  const pwd = process.env.QR_PASSWORD?.trim();
  if (!pwd) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { password } = await req.json().catch(() => ({}));
  if (String(password).trim() !== pwd) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, pwd, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
