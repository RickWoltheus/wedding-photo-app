import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse(
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local (from Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application). Add redirect URI: http://localhost:3000/api/drive-auth/callback",
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${req.nextUrl.origin}/api/drive-auth/callback`
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  return NextResponse.redirect(url);
}
