import { Router } from "express";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { provisionTenant, deprovisionTenant } from "../services/provisioner.js";
import { getHeartbeat } from "../services/heartbeat.js";
import { getPendingCount } from "../services/task-manager.js";
import {
  getContainerStatus,
  listAgentContainers,
  restartContainer,
} from "../lib/docker.js";
import { logger } from "../lib/logger.js";

export const adminRouter = Router();

// All admin routes require API key
adminRouter.use(apiKeyAuth);

// ── Provision tenant ────────────────────────────────
adminRouter.post("/tenants/:tenantId/provision", async (req, res) => {
  const { tenantId } = req.params;

  try {
    const result = await provisionTenant(tenantId);
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes("already provisioned")) {
      res.status(409).json({ error: err.message });
    } else {
      logger.error({ tenantId, error: err.message }, "Provision failed");
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Deprovision tenant ──────────────────────────────
adminRouter.post("/tenants/:tenantId/deprovision", async (req, res) => {
  const { tenantId } = req.params;

  try {
    await deprovisionTenant(tenantId);
    res.json({ status: "removed" });
  } catch (err: any) {
    logger.error({ tenantId, error: err.message }, "Deprovision failed");
    res.status(500).json({ error: err.message });
  }
});

// ── Tenant status ───────────────────────────────────
adminRouter.get("/tenants/:tenantId/status", async (req, res) => {
  const { tenantId } = req.params;

  const [containerInfo, heartbeat, pendingCount] = await Promise.all([
    getContainerStatus(tenantId),
    getHeartbeat(tenantId),
    getPendingCount(tenantId),
  ]);

  res.json({
    container: containerInfo,
    heartbeat,
    pending_task_count: pendingCount,
  });
});

// ── List all agents ─────────────────────────────────
adminRouter.get("/agents", async (_req, res) => {
  try {
    const containers = await listAgentContainers();
    res.json(containers);
  } catch (err: any) {
    logger.error({ error: err.message }, "Failed to list agents");
    res.status(500).json({ error: err.message });
  }
});

// ── Restart agent ───────────────────────────────────
adminRouter.post("/tenants/:tenantId/restart", async (req, res) => {
  const { tenantId } = req.params;

  try {
    await restartContainer(tenantId);
    res.json({ status: "restarted" });
  } catch (err: any) {
    logger.error({ tenantId, error: err.message }, "Restart failed");
    res.status(500).json({ error: err.message });
  }
});
