import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";

export async function POST(request: Request) {
  const supabase = await createClient();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const tenantId = formData.get("tenant_id") as string | null;

  if (!file || !tenantId) {
    return NextResponse.json(
      { error: "file and tenant_id are required" },
      { status: 400 }
    );
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File terlalu besar (max 10MB)" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);

  const buffer = Buffer.from(await file.arrayBuffer());

  // ── Images: return base64 for Claude Vision ───────
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
    const base64 = buffer.toString("base64");
    const mediaType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      extractedText: "",
      image: { base64, mediaType },
    });
  }

  // ── Documents: extract text ───────────────────────
  let extractedText = "";
  try {
    if (ext === "docx" || ext === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (ext === "pdf") {
      // Lazy import to avoid DOMMatrix error at module load
      try {
        // Dynamic require to avoid SSR DOMMatrix crash
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const parsePdf = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
        const result = await parsePdf(buffer);
        extractedText = result.text;
      } catch {
        extractedText = "[PDF parsing gagal — coba upload sebagai .docx atau .txt]";
      }
    } else if (["csv", "tsv", "txt", "md", "json"].includes(ext)) {
      extractedText = buffer.toString("utf-8");
    } else if (ext === "xls" || ext === "xlsx") {
      extractedText = "[File Excel — jelaskan isi file untuk analisis]";
    } else {
      extractedText = "[Format file tidak didukung untuk ekstraksi teks]";
    }

    // Truncate
    if (extractedText.length > 8000) {
      extractedText = extractedText.slice(0, 8000) + "\n\n[... teks terpotong ...]";
    }
  } catch (err) {
    console.error("Text extraction failed:", err);
    extractedText = "[Gagal mengekstrak teks dari file]";
  }

  return NextResponse.json({
    url: publicUrl,
    filename: file.name,
    size: file.size,
    type: file.type,
    extractedText,
  });
}
