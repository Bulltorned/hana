import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_requests")
    .select("*, employee:employees(id, name, jabatan, divisi, status_kontrak, tgl_mulai, tgl_berakhir)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();

  const allowedFields = ["status", "title", "variables", "output_url", "draft_content"];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key];
  }

  if (update.status === "ready" || update.status === "signed") {
    update.generated_at = new Date().toISOString();
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("document_requests")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Only allow deleting draft documents
  const { data: doc } = await supabase
    .from("document_requests")
    .select("status")
    .eq("id", params.id)
    .single();

  if (doc?.status !== "draft") {
    return NextResponse.json(
      { error: "Hanya dokumen draft yang bisa dihapus" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("document_requests")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
