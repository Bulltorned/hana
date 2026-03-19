import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const docType = searchParams.get("doc_type");
  const status = searchParams.get("status");

  let query = supabase
    .from("document_requests")
    .select("*, employee:employees(id, name, jabatan, divisi)")
    .order("created_at", { ascending: false });

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (docType && docType !== "all") query = query.eq("doc_type", docType);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { tenant_id, employee_id, doc_type, title, variables } = body;

  const { data: { user } } = await supabase.auth.getUser();

  // Create document request
  const { data: docReq, error: docErr } = await supabase
    .from("document_requests")
    .insert({
      tenant_id,
      employee_id: employee_id || null,
      doc_type,
      title,
      variables: variables || {},
      requested_by: user?.id || null,
      status: "draft",
    })
    .select()
    .single();

  if (docErr) {
    return NextResponse.json({ error: docErr.message }, { status: 500 });
  }

  // Create pending task for the agent
  const { error: taskErr } = await supabase
    .from("pending_tasks")
    .insert({
      tenant_id,
      task_type: "generate_document",
      priority: 1,
      payload: {
        document_request_id: docReq.id,
        doc_type,
        employee_id,
        variables,
      },
      created_by: user?.id || null,
    });

  if (taskErr) {
    // Not critical — doc request still exists
    console.error("Failed to create agent task:", taskErr);
  }

  return NextResponse.json(docReq, { status: 201 });
}
