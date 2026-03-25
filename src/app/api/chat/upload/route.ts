import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    // If bucket doesn't exist, return helpful error
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        {
          error:
            "Storage bucket 'chat-attachments' belum dibuat. Buat di Supabase Dashboard → Storage.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);

  return NextResponse.json({
    url: publicUrl,
    filename: file.name,
    path: data.path,
    size: file.size,
    type: file.type,
  });
}
