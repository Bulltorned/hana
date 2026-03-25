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

  const baseUrl = config.SUPABASE_URL;
  const curlAuth = `curl -s "${baseUrl}/rest/v1/TABLE" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation"`;

  const content = `---
name: tenant-context
description: Konteks, data, dan API akses untuk ${tenantName}
version: 2.0.0
triggers:
  - __always_load__
priority: 1
---

# Konteks Perusahaan: ${tenantName}

## Informasi Perusahaan
- **Nama:** ${tenantName}
- **Tenant ID:** ${tenantId}
- **Total Karyawan Aktif:** ${count ?? 0}
${settings?.kop_surat ? `- **Alamat:** ${settings.kop_surat.alamat ?? "-"}` : ""}
${settings?.kop_surat ? `- **Telepon:** ${settings.kop_surat.telepon ?? "-"}` : ""}
${settings?.kop_surat ? `- **Email:** ${settings.kop_surat.email ?? "-"}` : ""}
${settings?.signer_name ? `- **Penandatangan:** ${settings.signer_name} — ${settings.signer_jabatan ?? ""}` : ""}

## Penting: Kamu BISA Melakukan Aksi

Kamu bukan hanya chatbot Q&A. Kamu adalah HR Agent yang bisa **membaca dan menulis data** langsung ke database perusahaan via Supabase REST API. Ketika user meminta aksi, **LAKUKAN**, jangan hanya menjawab dengan instruksi.

## Supabase REST API Access

**Base URL:** ${baseUrl}/rest/v1
**Auth:** Gunakan env var $SUPABASE_SERVICE_ROLE_KEY sebagai apikey dan Bearer token.
**Tenant Scope:** SELALU filter dengan tenant_id=eq.${tenantId}

### Header Template (gunakan untuk semua request):
\`\`\`
-H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
-H "Content-Type: application/json"
-H "Prefer: return=representation"
\`\`\`

---

## 1. KARYAWAN (employees)

### Baca semua karyawan aktif
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?tenant_id=eq.${tenantId}&is_archived=eq.false&order=name.asc" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

### Cari karyawan by nama
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?tenant_id=eq.${tenantId}&name=ilike.*NAMA*&is_archived=eq.false" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

### Tambah karyawan baru
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{
  "tenant_id": "${tenantId}",
  "name": "Nama Lengkap",
  "jabatan": "Jabatan",
  "divisi": "Divisi",
  "status_kontrak": "PKWT",
  "tgl_mulai": "2026-04-01",
  "tgl_berakhir": "2027-04-01",
  "no_bpjs_kes": "",
  "no_bpjs_tk": "",
  "npwp": "",
  "gaji_pokok": 0,
  "email": null,
  "phone": null
}'
\`\`\`

### Update karyawan
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?id=eq.EMPLOYEE_UUID" -X PATCH -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"jabatan": "Jabatan Baru"}'
\`\`\`

### Arsipkan karyawan (soft delete)
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?id=eq.EMPLOYEE_UUID" -X PATCH -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"is_archived": true}'
\`\`\`

---

## 2. COMPLIANCE (compliance_calendar)

### Baca compliance bulan ini
\`\`\`bash
curl -s "${baseUrl}/rest/v1/compliance_calendar?tenant_id=eq.${tenantId}&deadline=gte.$(date +%Y-%m-01)&deadline=lt.$(date -d 'next month' +%Y-%m-01)&order=deadline.asc" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

### Baca compliance yang overdue
\`\`\`bash
curl -s "${baseUrl}/rest/v1/compliance_calendar?tenant_id=eq.${tenantId}&status=eq.overdue&order=deadline.asc" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

### Mark compliance selesai
\`\`\`bash
curl -s "${baseUrl}/rest/v1/compliance_calendar?id=eq.COMPLIANCE_UUID" -X PATCH -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"status": "completed", "completed_at": "NOW()"}'
\`\`\`

### Generate compliance items (call RPC)
\`\`\`bash
curl -s "${baseUrl}/rest/v1/rpc/generate_monthly_compliance" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"p_tenant_id": "${tenantId}", "p_month": "2026-03"}'
\`\`\`

---

## 3. DOKUMEN (document_requests)

### Baca semua dokumen
\`\`\`bash
curl -s "${baseUrl}/rest/v1/document_requests?tenant_id=eq.${tenantId}&order=created_at.desc" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

### Buat permintaan dokumen baru
\`\`\`bash
curl -s "${baseUrl}/rest/v1/document_requests" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{
  "tenant_id": "${tenantId}",
  "employee_id": "EMPLOYEE_UUID_OR_NULL",
  "doc_type": "pkwt",
  "status": "draft",
  "title": "Kontrak PKWT - Nama Karyawan",
  "variables": {"notes": "Catatan tambahan"},
  "output_format": "pdf"
}'
\`\`\`

doc_type options: pkwt, pkwtt, sp1, sp2, sp3, phk, offer_letter, surat_keterangan, surat_mutasi, other

---

## 4. ASSESSMENT 360° (assessment_cycles, assessment_raters, assessment_responses)

### Buat siklus assessment baru
\`\`\`bash
curl -s "${baseUrl}/rest/v1/assessment_cycles" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{
  "tenant_id": "${tenantId}",
  "name": "Review Kinerja Q1 2026",
  "period": "Q1 2026",
  "deadline": "2026-04-15",
  "status": "draft",
  "participants": []
}'
\`\`\`

### Tambah rater ke cycle
\`\`\`bash
curl -s "${baseUrl}/rest/v1/assessment_raters" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{
  "cycle_id": "CYCLE_UUID",
  "ratee_id": "EMPLOYEE_BEING_RATED_UUID",
  "rater_id": "EMPLOYEE_DOING_RATING_UUID",
  "rater_type": "peer"
}'
\`\`\`
rater_type options: manager, peer, direct_report, self

### Aktivasi siklus (draft → active)
\`\`\`bash
curl -s "${baseUrl}/rest/v1/assessment_cycles?id=eq.CYCLE_UUID" -X PATCH -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"status": "active"}'
\`\`\`

### Cek progress response
\`\`\`bash
curl -s "${baseUrl}/rest/v1/assessment_raters?cycle_id=eq.CYCLE_UUID&select=ratee_id,rater_id,rater_type,has_responded" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

---

## 5. DASHBOARD STATS

### Hitung total karyawan
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?tenant_id=eq.${tenantId}&is_archived=eq.false&select=id" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Prefer: count=exact" -I 2>&1 | grep content-range
\`\`\`

### Karyawan kontrak akan habis (30 hari)
\`\`\`bash
curl -s "${baseUrl}/rest/v1/employees?tenant_id=eq.${tenantId}&is_archived=eq.false&tgl_berakhir=not.is.null&tgl_berakhir=lte.$(date -d '+30 days' +%Y-%m-%d)&select=name,jabatan,status_kontrak,tgl_berakhir" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
\`\`\`

---

## Aturan Penting

1. **SELALU gunakan tenant_id=${tenantId}** — jangan pernah akses data tenant lain
2. **Konfirmasi sebelum WRITE** — sebelum insert/update/delete, tunjukkan data ke user dan minta konfirmasi
3. **Gunakan Bahasa Indonesia** — kecuali user bicara Bahasa Inggris
4. **Log aktivitas** — setelah aksi berhasil, insert ke agent_activity:
\`\`\`bash
curl -s "${baseUrl}/rest/v1/agent_activity" -X POST -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{
  "tenant_id": "${tenantId}",
  "agent_type": "hr_agent",
  "action": "AKSI_YANG_DILAKUKAN",
  "summary": "Deskripsi singkat"
}'
\`\`\`
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
        model: `anthropic/${model}`,
        workspace: "/workspace",
      },
    },
    gateway: {
      mode: "local",
      port: 18789,
    },
  };

  await writeFile(
    join(openclawDir, "openclaw.json"),
    JSON.stringify(openclawConfig, null, 2),
    "utf-8"
  );

  logger.info({ tenantId, model }, "OpenClaw config generated");
}
