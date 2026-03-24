import { supabase } from "../lib/supabase.js";
import {
  createAgentContainer,
  startContainer,
  stopContainer,
  removeContainer,
  getContainerStatus,
} from "../lib/docker.js";
import { recordHeartbeat } from "./heartbeat.js";
import { logger } from "../lib/logger.js";
import type { Tenant, TenantSettings } from "../types.js";

/**
 * Provision an agent container for a tenant.
 * Creates Docker container, starts it, updates tenant status.
 */
export async function provisionTenant(tenantId: string): Promise<{
  containerId: string;
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
    .select("*, tenant_settings(*)")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  logger.info(
    { tenantId, name: tenant.name, plan: tenant.plan },
    "Provisioning tenant"
  );

  // 3. If there's a stopped container, remove it first
  if (existing.status === "stopped" && existing.containerId) {
    await removeContainer(existing.containerId);
  }

  // 4. Create and start container
  const containerId = await createAgentContainer({
    tenantId,
    tenantName: tenant.name,
    plan: tenant.plan,
  });

  await startContainer(containerId);

  // 5. Update tenant status to active
  await supabase
    .from("tenants")
    .update({ status: "active" })
    .eq("id", tenantId);

  // 6. Insert initial heartbeat
  await recordHeartbeat({
    tenant_id: tenantId,
    agent_type: "hr_agent",
    status: "online",
    message_count: 0,
    uptime_seconds: 0,
  });

  logger.info(
    { tenantId, containerId },
    "Tenant provisioned successfully"
  );

  return { containerId, status: "running" };
}

/**
 * Deprovision (remove) an agent container for a tenant.
 */
export async function deprovisionTenant(tenantId: string): Promise<void> {
  const { status, containerId } = await getContainerStatus(tenantId);

  if (status === "not_found") {
    logger.warn({ tenantId }, "No container to deprovision");
    return;
  }

  if (status === "running" && containerId) {
    await stopContainer(containerId);
  }

  if (containerId) {
    await removeContainer(containerId);
  }

  // Mark heartbeat offline
  await recordHeartbeat({
    tenant_id: tenantId,
    agent_type: "hr_agent",
    status: "offline",
  });

  logger.info({ tenantId }, "Tenant deprovisioned");
}
