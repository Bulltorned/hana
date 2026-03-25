import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const { data } = await supabase
    .from("token_usage")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("month", month)
    .single();

  return NextResponse.json({
    tokensUsed: data?.tokens_used ?? 0,
    costUsd: data?.cost_usd ?? 0,
    month,
  });
}
