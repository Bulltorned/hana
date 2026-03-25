import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROVISIONING_URL =
  process.env.PROVISIONING_URL ?? "http://168.144.40.98:3100";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  // Get user profile for role-based filtering
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  // Build query
  let query = supabase
    .from("agent_heartbeats")
    .select("*, tenants(name)")
    .order("last_seen", { ascending: false });

  if (profile?.role === "client_hrd" && profile.tenant_id) {
    // Client HRD only sees their own tenant
    query = query.eq("tenant_id", profile.tenant_id);
  } else if (tenantId) {
    // Operator filtering by specific tenant
    query = query.eq("tenant_id", tenantId);
  }

  const { data: heartbeats, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with live container status from provisioning service (for operators)
  if (profile?.role === "operator") {
    try {
      const liveRes = await fetch(`${PROVISIONING_URL}/admin/agents`, {
        headers: {
          "X-API-Key": process.env.PROVISIONING_ADMIN_KEY ?? "hana-admin-a1b2c3d4e5f6",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (liveRes.ok) {
        const containers = await liveRes.json();
        // Merge container status with heartbeat data
        const enriched = (heartbeats ?? []).map((hb) => {
          const container = (containers as Array<Record<string, unknown>>).find(
            (c) => c.tenantId === hb.tenant_id
          );
          return {
            ...hb,
            container_state: container?.state ?? "not_found",
            container_id: container?.containerId ?? null,
          };
        });
        return NextResponse.json(enriched);
      }
    } catch {
      // VPS unreachable — return heartbeat data only
    }
  }

  return NextResponse.json(heartbeats ?? []);
}
