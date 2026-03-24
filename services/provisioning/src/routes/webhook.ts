import { Router } from "express";
import { z } from "zod";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { provisionTenant } from "../services/provisioner.js";
import { logger } from "../lib/logger.js";

export const webhookRouter = Router();

// Webhook routes also require API key
webhookRouter.use(apiKeyAuth);

// ── Tenant created webhook ──────────────────────────
const tenantCreatedSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_name: z.string(),
  plan: z.string(),
});

webhookRouter.post("/tenant-created", async (req, res) => {
  const parsed = tenantCreatedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const { tenant_id, tenant_name, plan } = parsed.data;

  logger.info(
    { tenant_id, tenant_name, plan },
    "Received tenant-created webhook"
  );

  // Provision in background — return immediately
  res.json({ provisioning: true });

  // Fire and forget
  provisionTenant(tenant_id).catch((err) => {
    logger.error(
      { tenant_id, error: err.message },
      "Background provisioning failed"
    );
  });
});
