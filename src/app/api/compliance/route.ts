import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const status = searchParams.get("status");
  const month = searchParams.get("month"); // YYYY-MM

  let query = supabase
    .from("compliance_calendar")
    .select("*, employee:employees(id, name, jabatan, status_kontrak)")
    .order("deadline", { ascending: true });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (month) {
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = new Date(y, m, 0).toISOString().split("T")[0]; // last day of month
    query = query.gte("deadline", startDate).lte("deadline", endDate);
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

  const { action, tenant_id, month } = body;

  if (action === "generate_monthly") {
    // Call the generate_monthly_compliance function
    const { error } = await supabase.rpc("generate_monthly_compliance", {
      p_tenant_id: tenant_id,
      p_month: `${month}-01`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also detect PKWT expiries
    await supabase.rpc("detect_pkwt_expiries", {
      p_tenant_id: tenant_id,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { id, status, notes } = body;

  const updates: Record<string, unknown> = { status };
  if (notes !== undefined) updates.notes = notes;
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) updates.completed_by = user.id;
  }

  const { data, error } = await supabase
    .from("compliance_calendar")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
