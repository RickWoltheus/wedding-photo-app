import { NextRequest, NextResponse } from "next/server";

// TODO: Google Drive client with service account
// Filename: ${Date.now()}_${sessionId}_${promptId}.jpg

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const sessionId = formData.get("sessionId") as string | null;
    const promptId = formData.get("promptId") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer); // use when wiring Drive

    console.log("Received file", {
      name: file.name,
      size: file.size,
      type: file.type,
      sessionId,
      promptId,
    });

    // TODO: upload buffer to Google Drive
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}
