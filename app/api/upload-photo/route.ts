import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/app/lib/drive";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const sessionId = (formData.get("sessionId") as string | null) ?? "";
    const promptId = (formData.get("promptId") as string | null) ?? "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.split(".").pop() || "jpg";
    const name = `${Date.now()}_${sessionId}_${promptId}.${ext}`;

    const drive = getDriveClient();
    if (!drive) {
      return NextResponse.json(
        {
          error:
            "Drive not configured. Use OAuth: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, then visit /api/drive-auth once to get DRIVE_REFRESH_TOKEN. Or use service account: set DRIVE_KEY and DRIVE_FOLDER_ID (Shared Drive).",
        },
        { status: 500 }
      );
    }

    const folderId = (process.env.DRIVE_FOLDER_ID ?? "").trim();
    if (!folderId) {
      return NextResponse.json(
        { error: "DRIVE_FOLDER_ID is required." },
        { status: 500 }
      );
    }

    const res = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || "image/jpeg",
        body: Readable.from(buffer),
      },
    });

    return NextResponse.json({ ok: true, id: res.data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload error", debug: message }, { status: 500 });
  }
}
