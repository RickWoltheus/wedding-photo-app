import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/app/lib/drive";

const EMAILS_FILENAME = "wedding-emails.txt";

function escape(s: string) {
  return s.replace(/\t/g, " ").replace(/\n/g, " ");
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email, selfDescription } = await req.json();
    if (!email && !selfDescription) {
      return NextResponse.json({ error: "Email or comment required" }, { status: 400 });
    }
    const drive = getDriveClient();
    const folderId = process.env.DRIVE_FOLDER_ID?.trim();
    if (!drive || !folderId) {
      return NextResponse.json({ error: "Drive not configured" }, { status: 503 });
    }

    const line = [
      new Date().toISOString(),
      escape(String(email ?? "")),
      escape(String(selfDescription ?? "")),
      String(sessionId ?? ""),
    ].join("\t") + "\n";

    const list = await drive.files.list({
      q: `'${folderId}' in parents and name = '${EMAILS_FILENAME}' and trashed = false`,
      fields: "files(id)",
    });
    const fileId = list.data.files?.[0]?.id;

    let body: string;
    if (fileId) {
      const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "text" }
      );
      body = (res.data as string) + line;
    } else {
      body = "timestamp\temail\tselfDescription\tsessionId\n" + line;
    }

    const stream = Readable.from(Buffer.from(body, "utf-8"));
    const mime = "text/plain";
    if (fileId) {
      await drive.files.update({
        fileId,
        media: { mimeType: mime, body: stream },
      });
    } else {
      await drive.files.create({
        requestBody: {
          name: EMAILS_FILENAME,
          parents: [folderId],
          mimeType: mime,
        },
        media: { mimeType: mime, body: stream },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
