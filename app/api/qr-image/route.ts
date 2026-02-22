import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

const COOKIE_NAME = "qr_admin";

export async function GET() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  const pwd = process.env.QR_PASSWORD?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const code = process.env.APP_ACCESS_CODE?.trim();
  if (!pwd || token !== pwd || !baseUrl || !code) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = `${baseUrl.replace(/\/$/, "")}?code=${encodeURIComponent(code)}`;
  const png = await QRCode.toBuffer(url, { type: "png", width: 400, margin: 2 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline; filename=wedding-photo-qr.png",
    },
  });
}
