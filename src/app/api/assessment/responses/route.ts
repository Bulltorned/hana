import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const cycleId = searchParams.get("cycle_id");
  const employeeId = searchParams.get("employee_id");

  if (!cycleId) {
    return NextResponse.json({ error: "cycle_id required" }, { status: 400 });
  }

  let query = supabase
    .from("assessment_responses")
    .select("*")
    .eq("cycle_id", cycleId);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
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

  const { cycle_id, employee_id, rater_id, responses } = body;

  if (!cycle_id || !employee_id || !responses) {
    return NextResponse.json(
      { error: "cycle_id, employee_id, and responses are required" },
      { status: 400 }
    );
  }

  // Insert response
  const { data, error } = await supabase
    .from("assessment_responses")
    .insert({
      cycle_id,
      employee_id,
      responses,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark rater as responded (if rater_id provided)
  if (rater_id) {
    await supabase
      .from("assessment_raters")
      .update({
        has_responded: true,
        responded_at: new Date().toISOString(),
      })
      .eq("cycle_id", cycle_id)
      .eq("rater_id", rater_id)
      .eq("ratee_id", employee_id);
  }

  return NextResponse.json(data, { status: 201 });
}
