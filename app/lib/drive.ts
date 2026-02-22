import { google } from "googleapis";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

export function getDriveClientOAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export function getDriveClientServiceAccount() {
  const key = process.env.DRIVE_KEY;
  if (!key) return null;
  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials =
      typeof key === "string" && key.startsWith("{")
        ? JSON.parse(key)
        : JSON.parse(Buffer.from(key, "base64").toString());
  } catch {
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [DRIVE_SCOPE],
  });
  return google.drive({ version: "v3", auth });
}

export function getDriveClient() {
  return getDriveClientOAuth() ?? getDriveClientServiceAccount();
}
