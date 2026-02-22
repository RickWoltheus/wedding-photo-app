import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return new NextResponse("Missing code. Run /api/drive-auth again.", { status: 400 });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.", { status: 500 });
  }
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${req.nextUrl.origin}/api/drive-auth/callback`
  );
  const { tokens } = await oauth2Client.getToken(code);
  const refreshToken = tokens.refresh_token;
  if (!refreshToken) {
    return new NextResponse(
      "No refresh_token in response. Revoke app access at myaccount.google.com/permissions and run /api/drive-auth again, then sign in and accept.",
      { status: 400 }
    );
  }
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Drive token</title></head>
<body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem;">
  <h1>Add this to .env.local</h1>
  <p>Add this line (guests will not see any login):</p>
  <pre style="background: #f0f0f0; padding: 1rem; overflow-x: auto;">DRIVE_REFRESH_TOKEN=${refreshToken}</pre>
  <p>Keep GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and DRIVE_FOLDER_ID. You can remove DRIVE_KEY if you use this.</p>
  <p>Restart the dev server after editing .env.local.</p>
</body>
</html>
  `;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
