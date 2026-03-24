import { mkdir, cp, writeFile, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { supabase } from "../lib/supabase.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

const TENANTS_DATA_DIR = "/data/tenants";

/**
 * Create workspace directories and config for a tenant.
 */
export async function createTenantWorkspace(
  tenantId: string,
  tenantName: string,
  plan: string
): Promise<string> {
  const tenantDir = join(TENANTS_DATA_DIR, tenantId);
  const skillsDir = join(tenantDir, "skills");
  const stateDir = join(tenantDir, "state");
  // stateDir maps to /workspace/.openclaw/ inside container
  // So openclaw.json goes directly in stateDir (not nested .openclaw)

  logger.info({ tenantId, tenantDir }, "Creating tenant workspace");

  // 1. Create directories
  await mkdir(skillsDir, { recursive: true });
  await mkdir(stateDir, { recursive: true });
  await mkdir(join(stateDir, "memory"), { recursive: true });

  // 2. Copy skills from template
  await copySkills(plan, skillsDir);

  // 3. Generate tenant-context skill with real data
  await generateTenantContext(tenantId, tenantName, skillsDir);

  // 4. Generate openclaw.json config (directly in stateDir)
  await generateOpenClawConfig(tenantId, tenantName, plan, stateDir);

  logger.info({ tenantId }, "Tenant workspace created");
  return tenantDir;
}

/**
 * Remove tenant workspace.
 */
export async function removeTenantWorkspace(tenantId: string): Promise<void> {
  const tenantDir = join(TENANTS_DATA_DIR, tenantId);
  if (existsSync(tenantDir)) {
    await rm(tenantDir, { recursive: true, force: true });
    logger.info({ tenantId }, "Tenant workspace removed");
  }
}

/**
 * Copy skill files from the shared skills directory based on plan.
 */
async function copySkills(plan: string, destDir: string): Promise<void> {
  const sourceDir = join(config.SKILLS_PATH, "hrd-agent-skills");

  if (!existsSync(sourceDir)) {
    logger.warn({ sourceDir }, "Skills source directory not found");
    return;
  }

  // All plans get these base skills
  const baseSkills = [
    "agent-identity",
    "tenant-context",
    "compliance",
    "hr-helpdesk",
  ];

  // Growth and Pro get additional skills
  const advancedSkills = [
    "document-drafter",
    "360-assessment",
  ];

  const skillsToCopy = plan === "trial" || plan === "starter"
    ? baseSkills
    : [...baseSkills, ...advancedSkills];

  for (const skill of skillsToCopy) {
    const src = join(sourceDir, skill);
    const dest = join(destDir, skill);
    if (existsSync(src)) {
      await cp(src, dest, { recursive: true });
    }
  }

  logger.info({ plan, skills: skillsToCopy }, "Skills copied");
}

/**
 * Generate tenant-context/SKILL.md with real company data from Supabase.
 */
async function generateTenantContext(
  tenantId: string,
  tenantName: string,
  skillsDir: string
): Promise<void> {
  // Fetch tenant settings
  const { data: settings } = await supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  // Fetch employee count
  const { count } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_archived", false);

  const contextDir = join(skillsDir, "tenant-context");
  await mkdir(contextDir, { recursive: true });

  const content = `---
name: tenant-context
description: Konteks dan data perusahaan ${tenantName}
version: 1.0.0
triggers:
  - __always_load__
priority: 1
---

# Konteks Perusahaan

## Informasi Perusahaan
- **Nama:** ${tenantName}
- **Total Karyawan Aktif:** ${count ?? 0}
${settings?.kop_surat ? `- **Alamat:** ${settings.kop_surat.alamat ?? "-"}` : ""}
${settings?.kop_surat ? `- **Telepon:** ${settings.kop_surat.telepon ?? "-"}` : ""}
${settings?.kop_surat ? `- **Email:** ${settings.kop_surat.email ?? "-"}` : ""}
${settings?.signer_name ? `- **Penandatangan:** ${settings.signer_name} — ${settings.signer_jabatan ?? ""}` : ""}

## Akses Data
Untuk membaca atau menulis data, gunakan Supabase REST API:
- **URL:** ${config.SUPABASE_URL}
- **Auth Header:** apikey: (gunakan env var SUPABASE_SERVICE_ROLE_KEY)
- **Tenant Filter:** Selalu filter dengan tenant_id=eq.${tenantId}

### Endpoint Penting
- Karyawan: GET /rest/v1/employees?tenant_id=eq.${tenantId}&is_archived=eq.false
- Compliance: GET /rest/v1/compliance_calendar?tenant_id=eq.${tenantId}
- Dokumen: POST /rest/v1/document_requests
- Activity Log: POST /rest/v1/agent_activity
- Heartbeat: POST /rest/v1/agent_heartbeats (upsert)
`;

  await writeFile(join(contextDir, "SKILL.md"), content, "utf-8");
  logger.info({ tenantId }, "Tenant context skill generated");
}

/**
 * Generate openclaw.json configuration file.
 */
async function generateOpenClawConfig(
  tenantId: string,
  tenantName: string,
  plan: string,
  openclawDir: string
): Promise<void> {
  // Choose model based on plan
  const model = plan === "pro" ? "claude-sonnet-4-20250514" : "claude-sonnet-4-20250514";

  const openclawConfig = {
    agents: {
      defaults: {
        name: `HR Agent ${tenantName}`,
        identity: `Kamu adalah HR Agent untuk ${tenantName}. Kamu membantu tim HRD dengan compliance, dokumen, assessment, dan pertanyaan regulasi ketenagakerjaan Indonesia. Selalu jawab dalam Bahasa Indonesia kecuali user menulis dalam Bahasa Inggris.`,
        model,
      },
    },
    tools: {
      elevated: [],
      exec: { enabled: true },
    },
    provider: {
      type: "anthropic",
      apiKey: "${ANTHROPIC_API_KEY}",
    },
    skills: {
      load: {
        dirs: ["/workspace/skills"],
      },
    },
    gateway: {
      mode: "local",
      port: 18789,
      host: "0.0.0.0",
    },
    memory: {
      enabled: true,
      dir: "/workspace/.openclaw/memory",
    },
  };

  await writeFile(
    join(openclawDir, "openclaw.json"),
    JSON.stringify(openclawConfig, null, 2),
    "utf-8"
  );

  logger.info({ tenantId, model }, "OpenClaw config generated");
}
