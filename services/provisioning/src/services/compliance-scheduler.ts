import cron from "node-cron";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { config } from "../config.js";

/**
 * Generate monthly compliance items for all active tenants.
 * Calls existing Supabase RPCs.
 */
export async function generateComplianceForAllTenants(
  month?: string
): Promise<{ total: number; success: number; failed: number }> {
  const targetMonth =
    month ?? new Date().toISOString().slice(0, 7); // yyyy-MM

  logger.info({ month: targetMonth }, "Starting compliance generation");

  // Get all active tenants
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("status", "active");

  if (error || !tenants) {
    logger.error({ error: error?.message }, "Failed to fetch tenants");
    return { total: 0, success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const tenant of tenants) {
    try {
      // Generate monthly compliance (BPJS, PPh21, THR, etc.)
      const { error: genError } = await supabase.rpc(
        "generate_monthly_compliance",
        {
          p_tenant_id: tenant.id,
          p_month: targetMonth,
        }
      );

      if (genError) {
        throw new Error(genError.message);
      }

      // Detect PKWT expiries
      const { error: expError } = await supabase.rpc(
        "detect_pkwt_expiries",
        {
          p_tenant_id: tenant.id,
        }
      );

      if (expError) {
        logger.warn(
          { tenantId: tenant.id, error: expError.message },
          "PKWT expiry detection failed"
        );
      }

      // Create a pending task for the agent to review & notify
      await supabase.from("pending_tasks").insert({
        tenant_id: tenant.id,
        task_type: "compliance_check",
        priority: 1,
        payload: {
          month: targetMonth,
          action: "review_and_notify",
        },
      });

      success++;
      logger.info(
        { tenantId: tenant.id, name: tenant.name },
        "Compliance generated"
      );
    } catch (err: any) {
      failed++;
      logger.error(
        { tenantId: tenant.id, error: err.message },
        "Compliance generation failed for tenant"
      );
    }
  }

  const result = { total: tenants.length, success, failed };
  logger.info(result, "Compliance generation complete");
  return result;
}

/**
 * Generate compliance for a single tenant (manual trigger).
 */
export async function generateComplianceForTenant(
  tenantId: string,
  month?: string
): Promise<void> {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);

  const { error: genError } = await supabase.rpc(
    "generate_monthly_compliance",
    {
      p_tenant_id: tenantId,
      p_month: targetMonth,
    }
  );

  if (genError) throw new Error(genError.message);

  const { error: expError } = await supabase.rpc("detect_pkwt_expiries", {
    p_tenant_id: tenantId,
  });

  if (expError) {
    logger.warn(
      { tenantId, error: expError.message },
      "PKWT expiry detection failed"
    );
  }

  logger.info({ tenantId, month: targetMonth }, "Compliance generated for tenant");
}

/**
 * Start the compliance cron scheduler.
 */
export function startComplianceScheduler(): void {
  const schedule = config.CRON_COMPLIANCE;

  cron.schedule(schedule, () => {
    logger.info("Compliance scheduler triggered");
    generateComplianceForAllTenants().catch((err) => {
      logger.error({ error: err.message }, "Compliance scheduler failed");
    });
  });

  logger.info({ schedule }, "Compliance scheduler started");
}
