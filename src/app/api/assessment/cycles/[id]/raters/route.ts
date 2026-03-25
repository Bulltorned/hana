import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assessment_raters")
    .select("*, ratee:employees!assessment_raters_ratee_id_fkey(id, name, jabatan, divisi), rater:employees!assessment_raters_rater_id_fkey(id, name, jabatan)")
    .eq("cycle_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();

  const { raters } = body;

  if (!Array.isArray(raters) || raters.length === 0) {
    return NextResponse.json(
      { error: "raters array is required" },
      { status: 400 }
    );
  }

  // Validate cycle exists
  const { data: cycle } = await supabase
    .from("assessment_cycles")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  // Insert raters
  const inserts = raters.map(
    (r: { ratee_id: string; rater_id: string; rater_type: string }) => ({
      cycle_id: params.id,
      ratee_id: r.ratee_id,
      rater_id: r.rater_id,
      rater_type: r.rater_type,
    })
  );

  const { data, error } = await supabase
    .from("assessment_raters")
    .upsert(inserts, { onConflict: "cycle_id,ratee_id,rater_id" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const raterId = searchParams.get("rater_id");

  if (!raterId) {
    return NextResponse.json({ error: "rater_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("assessment_raters")
    .delete()
    .eq("id", raterId)
    .eq("cycle_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
