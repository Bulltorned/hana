import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import type { AgentType } from "../types.js";

interface HeartbeatData {
  tenant_id: string;
  agent_type: AgentType;
  status: "online" | "offline" | "error";
  message_count?: number;
  model?: string;
  uptime_seconds?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Record (upsert) an agent heartbeat.
 */
export async function recordHeartbeat(data: HeartbeatData): Promise<void> {
  const { error } = await supabase.from("agent_heartbeats").upsert(
    {
      tenant_id: data.tenant_id,
      agent_type: data.agent_type,
      status: data.status,
      last_seen: new Date().toISOString(),
      message_count: data.message_count ?? 0,
      model: data.model ?? null,
      uptime_seconds: data.uptime_seconds ?? 0,
      metadata: data.metadata ?? {},
    },
    {
      onConflict: "tenant_id,agent_type",
    }
  );

  if (error) {
    logger.error({ error: error.message }, "Failed to record heartbeat");
    throw error;
  }
}

/**
 * Mark stale agents (no heartbeat for > 2 minutes) as offline.
 * Should be called on a 60-second interval.
 */
export async function checkStaleness(): Promise<number> {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("agent_heartbeats")
    .update({ status: "offline" })
    .eq("status", "online")
    .lt("last_seen", twoMinutesAgo)
    .select("tenant_id");

  if (error) {
    logger.error({ error: error.message }, "Failed to check staleness");
    return 0;
  }

  if (data && data.length > 0) {
    logger.warn(
      { count: data.length, tenants: data.map((d) => d.tenant_id) },
      "Marked stale agents as offline"
    );
  }

  return data?.length ?? 0;
}

/**
 * Get heartbeat for a specific tenant.
 */
export async function getHeartbeat(
  tenantId: string,
  agentType: AgentType = "hr_agent"
) {
  const { data } = await supabase
    .from("agent_heartbeats")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("agent_type", agentType)
    .single();

  return data;
}

/**
 * Sync container health with heartbeat table.
 * Checks all running containers and updates their heartbeat status.
 * Should be called on a 30-second interval.
 */
export async function syncContainerHealth(): Promise<void> {
  const { listAgentContainers } = await import("../lib/docker.js");

  try {
    const containers = await listAgentContainers();

    for (const container of containers) {
      const isRunning = container.state === "running";

      await recordHeartbeat({
        tenant_id: container.tenantId,
        agent_type: "hr_agent",
        status: isRunning ? "online" : "offline",
        model: "anthropic/claude-sonnet-4-20250514",
        metadata: {
          container_id: container.containerId,
          container_state: container.state,
        },
      });
    }

    if (containers.length > 0) {
      logger.info(
        { count: containers.length, online: containers.filter((c) => c.state === "running").length },
        "Container health synced"
      );
    }
  } catch (err: any) {
    logger.error({ error: err.message }, "Failed to sync container health");
  }
}
