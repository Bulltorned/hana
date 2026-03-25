import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const status = searchParams.get("status");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  let query = supabase
    .from("assessment_cycles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with rater/response stats
  const enriched = await Promise.all(
    (data ?? []).map(async (cycle) => {
      const { count: raterCount } = await supabase
        .from("assessment_raters")
        .select("*", { count: "exact", head: true })
        .eq("cycle_id", cycle.id);

      const { count: responseCount } = await supabase
        .from("assessment_raters")
        .select("*", { count: "exact", head: true })
        .eq("cycle_id", cycle.id)
        .eq("has_responded", true);

      // Count unique ratees (participants)
      const { data: ratees } = await supabase
        .from("assessment_raters")
        .select("ratee_id")
        .eq("cycle_id", cycle.id);

      const uniqueRatees = new Set(ratees?.map((r) => r.ratee_id) ?? []);

      return {
        ...cycle,
        participant_count: uniqueRatees.size,
        rater_count: raterCount ?? 0,
        response_count: responseCount ?? 0,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { tenant_id, name, period, deadline, description } = body;

  if (!tenant_id || !name) {
    return NextResponse.json(
      { error: "tenant_id and name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("assessment_cycles")
    .insert({
      tenant_id,
      name,
      period: period ?? "",
      deadline: deadline || null,
      description: description ?? null,
      status: "draft",
      participants: [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
