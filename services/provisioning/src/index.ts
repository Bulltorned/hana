import "dotenv/config";
import express from "express";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { gatewayRouter } from "./routes/gateway.js";
import { adminRouter } from "./routes/admin.js";
import { webhookRouter } from "./routes/webhook.js";
import { errorHandler } from "./middleware/error-handler.js";
import { checkStaleness, syncContainerHealth } from "./services/heartbeat.js";
import { startComplianceScheduler } from "./services/compliance-scheduler.js";
import {
  generateComplianceForTenant,
  generateComplianceForAllTenants,
} from "./services/compliance-scheduler.js";
import { apiKeyAuth } from "./middleware/api-key-auth.js";

const app = express();

// ── Middleware ───────────────────────────────────────
app.use(express.json());

// ── Health check ────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Routes ──────────────────────────────────────────
app.use("/gateway", gatewayRouter);
app.use("/admin", adminRouter);
app.use("/webhook", webhookRouter);

// ── Manual compliance trigger (admin) ───────────────
app.post("/admin/compliance/generate", apiKeyAuth, async (req, res) => {
  const { tenant_id, month } = req.body;

  try {
    if (tenant_id) {
      await generateComplianceForTenant(tenant_id, month);
      res.json({ success: true, tenant_id });
    } else {
      const result = await generateComplianceForAllTenants(month);
      res.json(result);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Error handler ───────────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────
app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "🚀 Provisioning service started");

  // Sync container health → heartbeat table (every 30s)
  syncContainerHealth().catch(() => {});
  setInterval(() => {
    syncContainerHealth().catch((err) => {
      logger.error({ error: err.message }, "Container health sync failed");
    });
  }, 30_000);

  // Start heartbeat staleness checker (every 60s)
  setInterval(() => {
    checkStaleness().catch((err) => {
      logger.error({ error: err.message }, "Staleness check failed");
    });
  }, 60_000);

  // Start compliance scheduler
  startComplianceScheduler();
});
