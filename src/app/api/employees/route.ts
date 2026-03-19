import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/validations/employee";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const search = searchParams.get("search");
  const statusKontrak = searchParams.get("status_kontrak");
  const divisi = searchParams.get("divisi");
  const archived = searchParams.get("archived") === "true";

  let query = supabase
    .from("employees")
    .select("*")
    .eq("is_archived", archived)
    .order("created_at", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,employee_id.ilike.%${search}%,jabatan.ilike.%${search}%`
    );
  }

  if (statusKontrak) {
    query = query.eq("status_kontrak", statusKontrak);
  }

  if (divisi) {
    query = query.eq("divisi", divisi);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const result = employeeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const tenantId = body.tenant_id;
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({ ...result.data, tenant_id: tenantId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
