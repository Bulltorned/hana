import { supabase } from "../lib/supabase.js";
import {
  createAgentContainer,
  startContainer,
  stopContainer,
  removeContainer,
  getContainerStatus,
  getOpenClawGatewayUrl,
} from "../lib/docker.js";
import { createTenantWorkspace, removeTenantWorkspace } from "./workspace.js";
import { recordHeartbeat } from "./heartbeat.js";
import { logger } from "../lib/logger.js";

/**
 * Provision an OpenClaw agent container for a tenant.
 * Creates workspace, copies skills, generates config, starts container.
 */
export async function provisionTenant(tenantId: string): Promise<{
  containerId: string;
  gatewayUrl: string;
  status: string;
}> {
  // 1. Check if already provisioned
  const existing = await getContainerStatus(tenantId);
  if (existing.status === "running") {
    throw new Error(`Tenant ${tenantId} is already provisioned and running`);
  }

  // 2. Fetch tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  logger.info(
    { tenantId, name: tenant.name, plan: tenant.plan },
    "Provisioning tenant with OpenClaw"
  );

  // 3. If there's a stopped container, remove it first
  if (existing.status === "stopped" && existing.containerId) {
    await removeContainer(existing.containerId);
  }

  // 4. Create tenant workspace (dirs, skills, openclaw.json)
  await createTenantWorkspace(tenantId, tenant.name, tenant.plan);

  // 5. Create and start container
  const containerId = await createAgentContainer({
    tenantId,
    tenantName: tenant.name,
    plan: tenant.plan,
  });

  await startContainer(containerId);

  // 6. Wait for OpenClaw gateway to be healthy (max 30 seconds)
  const gatewayUrl = getOpenClawGatewayUrl(tenantId);
  const healthy = await waitForHealth(gatewayUrl, 30_000);

  if (!healthy) {
    logger.warn({ tenantId }, "OpenClaw gateway did not become healthy in 30s — container may still be starting");
  }

  // 7. Update tenant status to active
  await supabase
    .from("tenants")
    .update({ status: "active" })
    .eq("id", tenantId);

  // 8. Insert initial heartbeat
  await recordHeartbeat({
    tenant_id: tenantId,
    agent_type: "hr_agent",
    status: "online",
    message_count: 0,
    uptime_seconds: 0,
  });

  logger.info(
    { tenantId, containerId, gatewayUrl },
    "Tenant provisioned successfully with OpenClaw"
  );

  return { containerId, gatewayUrl, status: "running" };
}

/**
 * Deprovision (remove) an OpenClaw container and workspace for a tenant.
 */
export async function deprovisionTenant(
  tenantId: string,
  removeData: boolean = false
): Promise<void> {
  const { status, containerId } = await getContainerStatus(tenantId);

  if (status !== "not_found" && containerId) {
    if (status === "running") {
      await stopContainer(containerId);
    }
    await removeContainer(containerId);
  }

  // Optionally remove workspace data
  if (removeData) {
    await removeTenantWorkspace(tenantId);
  }

  // Mark heartbeat offline
  await recordHeartbeat({
    tenant_id: tenantId,
    agent_type: "hr_agent",
    status: "offline",
  });

  logger.info({ tenantId, removeData }, "Tenant deprovisioned");
}

/**
 * Wait for OpenClaw gateway to respond to health check.
 */
async function waitForHealth(
  gatewayUrl: string,
  timeoutMs: number
): Promise<boolean> {
  const start = Date.now();
  const healthUrl = `${gatewayUrl}/health`;

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(healthUrl, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        logger.info({ gatewayUrl }, "OpenClaw gateway is healthy");
        return true;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}
