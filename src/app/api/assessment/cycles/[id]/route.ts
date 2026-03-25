import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const cycleId = params.id;

  const { data: cycle, error } = await supabase
    .from("assessment_cycles")
    .select("*")
    .eq("id", cycleId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Get raters with employee info
  const { data: raters } = await supabase
    .from("assessment_raters")
    .select("*, ratee:employees!assessment_raters_ratee_id_fkey(id, name, jabatan, divisi), rater:employees!assessment_raters_rater_id_fkey(id, name, jabatan)")
    .eq("cycle_id", cycleId);

  // Get response stats
  const { count: totalRaters } = await supabase
    .from("assessment_raters")
    .select("*", { count: "exact", head: true })
    .eq("cycle_id", cycleId);

  const { count: respondedCount } = await supabase
    .from("assessment_raters")
    .select("*", { count: "exact", head: true })
    .eq("cycle_id", cycleId)
    .eq("has_responded", true);

  // Unique participants (ratees)
  const rateeIds = Array.from(new Set(raters?.map((r) => r.ratee_id) ?? []));

  return NextResponse.json({
    ...cycle,
    raters: raters ?? [],
    participant_count: rateeIds.length,
    rater_count: totalRaters ?? 0,
    response_count: respondedCount ?? 0,
    response_rate:
      totalRaters && totalRaters > 0
        ? Math.round(((respondedCount ?? 0) / totalRaters) * 100)
        : 0,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();
  const cycleId = params.id;

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.period !== undefined) updates.period = body.period;
  if (body.deadline !== undefined) updates.deadline = body.deadline;
  if (body.status !== undefined) updates.status = body.status;
  if (body.description !== undefined) updates.description = body.description;

  const { data, error } = await supabase
    .from("assessment_cycles")
    .update(updates)
    .eq("id", cycleId)
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
  const cycleId = params.id;

  // Only allow deleting draft cycles
  const { data: cycle } = await supabase
    .from("assessment_cycles")
    .select("status")
    .eq("id", cycleId)
    .single();

  if (cycle?.status !== "draft") {
    return NextResponse.json(
      { error: "Hanya siklus draft yang bisa dihapus" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("assessment_cycles")
    .delete()
    .eq("id", cycleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
