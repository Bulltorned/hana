import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

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

  // Generate unique filename
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
    if (uploadError.message?.includes("not found")) {
      return NextResponse.json(
        { error: "Storage bucket 'chat-attachments' belum dibuat." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);

  // Extract text content from file
  let extractedText = "";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (ext === "docx" || ext === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (ext === "pdf") {
      const result = await pdfParse(buffer);
      extractedText = result.text;
    } else if (ext === "csv" || ext === "tsv") {
      extractedText = buffer.toString("utf-8");
    } else if (ext === "txt" || ext === "md" || ext === "json") {
      extractedText = buffer.toString("utf-8");
    } else if (ext === "xls" || ext === "xlsx") {
      extractedText = "[File Excel — konten tidak bisa diekstrak secara otomatis. Silakan jelaskan isi file.]";
    } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      extractedText = "[File gambar — agent tidak bisa membaca konten visual secara langsung. Silakan jelaskan apa yang ada di gambar.]";
    }

    // Truncate very long text (max ~8000 chars to fit in context)
    if (extractedText.length > 8000) {
      extractedText = extractedText.slice(0, 8000) + "\n\n[... teks terpotong, file terlalu panjang ...]";
    }
  } catch (err) {
    console.error("Failed to extract text from file:", err);
    extractedText = "[Gagal mengekstrak teks dari file.]";
  }

  return NextResponse.json({
    url: publicUrl,
    filename: file.name,
    path: uploadData.path,
    size: file.size,
    type: file.type,
    extractedText,
  });
}
