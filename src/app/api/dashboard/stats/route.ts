import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Get total employees across all tenants (operator view)
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);

  // Get total tenants
  const { count: totalTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  // Get active tenants
  const { count: activeTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get employees with expiring contracts (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { count: expiringContracts } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false)
    .not("tgl_berakhir", "is", null)
    .lte("tgl_berakhir", thirtyDaysFromNow.toISOString().split("T")[0]);

  // Get compliance items pending
  const { count: compliancePending } = await supabase
    .from("compliance_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get documents this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: docsThisMonth } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .gte("generated_at", startOfMonth.toISOString());

  return NextResponse.json({
    totalEmployees: totalEmployees ?? 0,
    totalTenants: totalTenants ?? 0,
    activeTenants: activeTenants ?? 0,
    expiringContracts: expiringContracts ?? 0,
    compliancePending: compliancePending ?? 0,
    docsThisMonth: docsThisMonth ?? 0,
  });
}
