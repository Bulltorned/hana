import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// ══════════════════════════════════════════════════════
// Tool Definitions (Claude Function Calling Schema)
// ══════════════════════════════════════════════════════

export const ALL_TOOLS: Anthropic.Tool[] = [
  // ── Employee Tools ────────────────────────────────
  {
    name: "search_employees",
    description:
      "Cari karyawan berdasarkan nama, jabatan, divisi, atau status kontrak. Gunakan ini untuk melihat data karyawan yang ada.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Kata kunci pencarian (nama, jabatan, divisi)",
        },
        status_kontrak: {
          type: "string",
          enum: ["PKWTT", "PKWT", "Probation"],
          description: "Filter berdasarkan status kontrak",
        },
        limit: {
          type: "number",
          description: "Jumlah hasil maksimal (default 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "add_employee",
    description:
      "Tambahkan karyawan baru ke database. WAJIB minta konfirmasi user sebelum menjalankan tool ini. Tampilkan data yang akan ditambahkan dan tanya 'Apakah data sudah benar?'",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nama lengkap karyawan" },
        jabatan: { type: "string", description: "Jabatan/posisi" },
        divisi: { type: "string", description: "Divisi/departemen" },
        status_kontrak: {
          type: "string",
          enum: ["PKWTT", "PKWT", "Probation"],
          description: "Status kontrak",
        },
        tgl_mulai: {
          type: "string",
          description: "Tanggal mulai kerja (YYYY-MM-DD)",
        },
        tgl_berakhir: {
          type: "string",
          description: "Tanggal berakhir kontrak (YYYY-MM-DD), null untuk PKWTT",
        },
        employee_id: { type: "string", description: "ID karyawan (opsional)" },
        email: { type: "string", description: "Email karyawan (opsional)" },
        phone: { type: "string", description: "No telepon (opsional)" },
        gaji_pokok: { type: "number", description: "Gaji pokok (opsional)" },
        no_bpjs_kes: { type: "string", description: "No BPJS Kesehatan (opsional)" },
        no_bpjs_tk: { type: "string", description: "No BPJS Ketenagakerjaan (opsional)" },
        npwp: { type: "string", description: "NPWP (opsional)" },
      },
      required: ["name", "jabatan", "divisi", "status_kontrak", "tgl_mulai"],
    },
  },
  {
    name: "add_employees_bulk",
    description:
      "Tambahkan beberapa karyawan sekaligus ke database. Gunakan ini untuk import data dari gambar/file. LANGSUNG gunakan tool ini setelah user konfirmasi — JANGAN gunakan escalate_to_background.",
    input_schema: {
      type: "object" as const,
      properties: {
        employees: {
          type: "array",
          description: "Array data karyawan",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              jabatan: { type: "string" },
              divisi: { type: "string" },
              status_kontrak: { type: "string", enum: ["PKWTT", "PKWT", "Probation"] },
              tgl_mulai: { type: "string" },
              tgl_berakhir: { type: "string" },
              email: { type: "string" },
              gaji_pokok: { type: "number" },
            },
            required: ["name", "jabatan", "status_kontrak", "tgl_mulai"],
          },
        },
      },
      required: ["employees"],
    },
  },
  {
    name: "update_employee",
    description:
      "Update data karyawan. WAJIB minta konfirmasi user sebelum menjalankan. Tampilkan perubahan: 'Akan mengubah X dari Y menjadi Z'",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_id: { type: "string", description: "UUID karyawan yang akan di-update" },
        updates: {
          type: "object",
          description: "Fields yang akan di-update",
          properties: {
            name: { type: "string" },
            jabatan: { type: "string" },
            divisi: { type: "string" },
            status_kontrak: { type: "string" },
            tgl_mulai: { type: "string" },
            tgl_berakhir: { type: "string" },
            gaji_pokok: { type: "number" },
            email: { type: "string" },
            phone: { type: "string" },
          },
        },
      },
      required: ["employee_id", "updates"],
    },
  },
  {
    name: "archive_employee",
    description: "Arsipkan (soft-delete) karyawan. WAJIB minta konfirmasi user.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_id: { type: "string", description: "UUID karyawan" },
      },
      required: ["employee_id"],
    },
  },

  // ── Compliance Tools ──────────────────────────────
  {
    name: "get_compliance_items",
    description: "Ambil daftar compliance items (BPJS, PPh21, THR, dll). Bisa filter berdasarkan status atau bulan.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["upcoming", "due_soon", "overdue", "completed"],
          description: "Filter status",
        },
        month: {
          type: "string",
          description: "Filter bulan (YYYY-MM)",
        },
      },
      required: [],
    },
  },
  {
    name: "mark_compliance_complete",
    description: "Tandai compliance item sebagai selesai. WAJIB minta konfirmasi user.",
    input_schema: {
      type: "object" as const,
      properties: {
        compliance_id: { type: "string", description: "UUID compliance item" },
        notes: { type: "string", description: "Catatan penyelesaian (opsional)" },
      },
      required: ["compliance_id"],
    },
  },
  {
    name: "generate_compliance",
    description: "Generate compliance items untuk bulan tertentu (BPJS, PPh21, THR, dll).",
    input_schema: {
      type: "object" as const,
      properties: {
        month: { type: "string", description: "Bulan target (YYYY-MM)" },
      },
      required: ["month"],
    },
  },

  // ── Document Tools ────────────────────────────────
  {
    name: "create_document_request",
    description:
      "Buat permintaan dokumen baru (kontrak PKWT, surat peringatan, dll). Dokumen akan di-generate oleh sistem.",
    input_schema: {
      type: "object" as const,
      properties: {
        doc_type: {
          type: "string",
          enum: ["pkwt", "pkwtt", "sp1", "sp2", "sp3", "phk", "offer_letter", "surat_keterangan", "surat_mutasi", "other"],
          description: "Jenis dokumen",
        },
        employee_id: { type: "string", description: "UUID karyawan terkait (opsional)" },
        title: { type: "string", description: "Judul dokumen" },
        notes: { type: "string", description: "Catatan/instruksi tambahan" },
      },
      required: ["doc_type", "title"],
    },
  },
  {
    name: "get_documents",
    description: "Ambil daftar dokumen yang sudah dibuat.",
    input_schema: {
      type: "object" as const,
      properties: {
        doc_type: {
          type: "string",
          enum: ["pkwt", "pkwtt", "sp1", "sp2", "sp3", "phk", "offer_letter", "surat_keterangan", "surat_mutasi", "other"],
        },
        status: {
          type: "string",
          enum: ["draft", "generating", "ready", "signed", "archived"],
        },
      },
      required: [],
    },
  },

  // ── Assessment Tools ──────────────────────────────
  {
    name: "create_assessment_cycle",
    description: "Buat siklus assessment 360° baru.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nama siklus (e.g., 'Review Q2 2026')" },
        period: { type: "string", description: "Periode (e.g., 'Q2 2026')" },
        deadline: { type: "string", description: "Deadline (YYYY-MM-DD)" },
      },
      required: ["name", "period"],
    },
  },
  {
    name: "get_assessment_cycles",
    description: "Ambil daftar siklus assessment.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["draft", "active", "completed"],
        },
      },
      required: [],
    },
  },

  // ── Dashboard Stats ───────────────────────────────
  {
    name: "get_dashboard_stats",
    description: "Ambil statistik dashboard: total karyawan, kontrak expiring, compliance pending, dll.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // ── Escalation ────────────────────────────────────
  {
    name: "escalate_to_background",
    description:
      "HANYA gunakan untuk tugas yang BENAR-BENAR tidak bisa dilakukan secara langsung, seperti generate PDF file, kirim email/WhatsApp, atau proses yang butuh lebih dari 5 menit. JANGAN gunakan untuk CRUD karyawan, compliance, atau dokumen — gunakan tool spesifik lainnya.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_type: {
          type: "string",
          enum: ["generate_document", "compliance_check", "send_reminder", "assessment_action", "custom"],
          description: "Jenis task",
        },
        description: { type: "string", description: "Deskripsi task untuk user" },
        payload: {
          type: "object",
          description: "Data yang diperlukan untuk menjalankan task",
        },
      },
      required: ["task_type", "description"],
    },
  },
];

// ══════════════════════════════════════════════════════
// Tool Executor — runs tools against Supabase
// ══════════════════════════════════════════════════════

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusMessage: string; // Human-readable status for contextual loading
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  tenantId: string
): Promise<ToolResult> {
  const supabase = await createClient();

  try {
    switch (toolName) {
      // ── Employees ─────────────────────────────────
      case "search_employees": {
        let query = supabase
          .from("employees")
          .select("id, name, employee_id, jabatan, divisi, status_kontrak, tgl_mulai, tgl_berakhir, email, gaji_pokok")
          .eq("tenant_id", tenantId)
          .eq("is_archived", false)
          .order("name");

        if (input.search) {
          query = query.or(
            `name.ilike.%${input.search}%,jabatan.ilike.%${input.search}%,divisi.ilike.%${input.search}%`
          );
        }
        if (input.status_kontrak) {
          query = query.eq("status_kontrak", input.status_kontrak);
        }

        const { data, error } = await query.limit((input.limit as number) || 20);
        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Ditemukan ${data?.length ?? 0} karyawan`,
        };
      }

      case "add_employee": {
        const { data, error } = await supabase
          .from("employees")
          .insert({
            tenant_id: tenantId,
            name: input.name,
            jabatan: input.jabatan,
            divisi: input.divisi || "",
            status_kontrak: input.status_kontrak,
            tgl_mulai: input.tgl_mulai,
            tgl_berakhir: input.tgl_berakhir || null,
            employee_id: input.employee_id || null,
            email: input.email || null,
            phone: input.phone || null,
            gaji_pokok: (input.gaji_pokok as number) || 0,
            no_bpjs_kes: (input.no_bpjs_kes as string) || "",
            no_bpjs_tk: (input.no_bpjs_tk as string) || "",
            npwp: (input.npwp as string) || "",
          })
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabase.from("agent_activity").insert({
          tenant_id: tenantId,
          agent_type: "hr_agent",
          action: "add_employee",
          summary: `Menambahkan karyawan: ${input.name} — ${input.jabatan}`,
        });

        return {
          success: true,
          data,
          statusMessage: `✅ Karyawan ${input.name} berhasil ditambahkan`,
        };
      }

      case "add_employees_bulk": {
        const employees = input.employees as Array<Record<string, unknown>>;
        const results: Array<{ name: string; success: boolean; error?: string }> = [];

        for (const emp of employees) {
          const { error } = await supabase.from("employees").insert({
            tenant_id: tenantId,
            name: emp.name,
            jabatan: emp.jabatan,
            divisi: emp.divisi || "",
            status_kontrak: emp.status_kontrak || "PKWT",
            tgl_mulai: emp.tgl_mulai || new Date().toISOString().split("T")[0],
            tgl_berakhir: emp.tgl_berakhir || null,
            email: emp.email || null,
            gaji_pokok: (emp.gaji_pokok as number) || 0,
            no_bpjs_kes: "",
            no_bpjs_tk: "",
            npwp: "",
          });

          results.push({
            name: emp.name as string,
            success: !error,
            error: error?.message,
          });
        }

        const successCount = results.filter((r) => r.success).length;

        await supabase.from("agent_activity").insert({
          tenant_id: tenantId,
          agent_type: "hr_agent",
          action: "bulk_add_employees",
          summary: `Bulk import: ${successCount}/${employees.length} karyawan berhasil`,
        });

        return {
          success: successCount > 0,
          data: { results, successCount, totalCount: employees.length },
          statusMessage: `✅ ${successCount}/${employees.length} karyawan berhasil ditambahkan`,
        };
      }

      case "update_employee": {
        const { data, error } = await supabase
          .from("employees")
          .update(input.updates as Record<string, unknown>)
          .eq("id", input.employee_id)
          .eq("tenant_id", tenantId)
          .select()
          .single();

        if (error) throw error;

        await supabase.from("agent_activity").insert({
          tenant_id: tenantId,
          agent_type: "hr_agent",
          action: "update_employee",
          summary: `Update karyawan: ${(data as Record<string, unknown>)?.name}`,
        });

        return {
          success: true,
          data,
          statusMessage: `✅ Data karyawan berhasil diperbarui`,
        };
      }

      case "archive_employee": {
        const { data, error } = await supabase
          .from("employees")
          .update({ is_archived: true })
          .eq("id", input.employee_id)
          .eq("tenant_id", tenantId)
          .select("name")
          .single();

        if (error) throw error;

        await supabase.from("agent_activity").insert({
          tenant_id: tenantId,
          agent_type: "hr_agent",
          action: "archive_employee",
          summary: `Arsipkan karyawan: ${(data as Record<string, unknown>)?.name}`,
        });

        return {
          success: true,
          data,
          statusMessage: `✅ Karyawan berhasil diarsipkan`,
        };
      }

      // ── Compliance ────────────────────────────────
      case "get_compliance_items": {
        let query = supabase
          .from("compliance_calendar")
          .select("id, type, title, description, deadline, status, amount, notes")
          .eq("tenant_id", tenantId)
          .order("deadline");

        if (input.status) query = query.eq("status", input.status);
        if (input.month) {
          const start = `${input.month}-01`;
          const [y, m] = (input.month as string).split("-").map(Number);
          const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
          query = query.gte("deadline", start).lt("deadline", nextMonth);
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Ditemukan ${data?.length ?? 0} compliance items`,
        };
      }

      case "mark_compliance_complete": {
        const { data, error } = await supabase
          .from("compliance_calendar")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            notes: input.notes || null,
          })
          .eq("id", input.compliance_id)
          .eq("tenant_id", tenantId)
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Compliance item ditandai selesai`,
        };
      }

      case "generate_compliance": {
        const month = (input.month as string) || new Date().toISOString().slice(0, 7);

        const { error } = await supabase.rpc("generate_monthly_compliance", {
          p_tenant_id: tenantId,
          p_month: month,
        });

        if (error) throw error;

        return {
          success: true,
          data: { month },
          statusMessage: `✅ Compliance items untuk ${month} berhasil di-generate`,
        };
      }

      // ── Documents ─────────────────────────────────
      case "create_document_request": {
        const { data, error } = await supabase
          .from("document_requests")
          .insert({
            tenant_id: tenantId,
            doc_type: input.doc_type,
            employee_id: input.employee_id || null,
            title: input.title,
            status: "draft",
            variables: { notes: input.notes || "" },
            output_format: "pdf",
          })
          .select()
          .single();

        if (error) throw error;

        await supabase.from("agent_activity").insert({
          tenant_id: tenantId,
          agent_type: "hr_agent",
          action: "create_document",
          summary: `Buat dokumen: ${input.title}`,
        });

        return {
          success: true,
          data,
          statusMessage: `✅ Permintaan dokumen "${input.title}" berhasil dibuat`,
        };
      }

      case "get_documents": {
        let query = supabase
          .from("document_requests")
          .select("id, doc_type, title, status, output_url, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (input.doc_type) query = query.eq("doc_type", input.doc_type);
        if (input.status) query = query.eq("status", input.status);

        const { data, error } = await query.limit(20);
        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Ditemukan ${data?.length ?? 0} dokumen`,
        };
      }

      // ── Assessment ────────────────────────────────
      case "create_assessment_cycle": {
        const { data, error } = await supabase
          .from("assessment_cycles")
          .insert({
            tenant_id: tenantId,
            name: input.name,
            period: input.period,
            deadline: input.deadline || null,
            status: "draft",
            participants: [],
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Siklus assessment "${input.name}" berhasil dibuat`,
        };
      }

      case "get_assessment_cycles": {
        let query = supabase
          .from("assessment_cycles")
          .select("id, name, period, deadline, status, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (input.status) query = query.eq("status", input.status);

        const { data, error } = await query;
        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `✅ Ditemukan ${data?.length ?? 0} siklus assessment`,
        };
      }

      // ── Dashboard ─────────────────────────────────
      case "get_dashboard_stats": {
        const [employees, expiring, compliance, docs] = await Promise.all([
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("is_archived", false),
          supabase
            .from("employees")
            .select("name, tgl_berakhir, status_kontrak")
            .eq("tenant_id", tenantId)
            .eq("is_archived", false)
            .not("tgl_berakhir", "is", null)
            .lte("tgl_berakhir", new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]),
          supabase
            .from("compliance_calendar")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .in("status", ["overdue", "due_soon"]),
          supabase
            .from("document_requests")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId),
        ]);

        return {
          success: true,
          data: {
            totalEmployees: employees.count ?? 0,
            expiringContracts: expiring.data ?? [],
            compliancePending: compliance.count ?? 0,
            totalDocuments: docs.count ?? 0,
          },
          statusMessage: `✅ Dashboard stats loaded`,
        };
      }

      // ── Escalation ────────────────────────────────
      case "escalate_to_background": {
        const { data, error } = await supabase
          .from("pending_tasks")
          .insert({
            tenant_id: tenantId,
            task_type: input.task_type,
            priority: 1,
            payload: {
              description: input.description,
              ...(input.payload as Record<string, unknown> ?? {}),
            },
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data,
          statusMessage: `📋 Task "${input.description}" dibuat — bisa dilacak di Task Board`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          statusMessage: `❌ Tool tidak dikenal: ${toolName}`,
        };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: message,
      statusMessage: `❌ Error: ${message}`,
    };
  }
}

// ══════════════════════════════════════════════════════
// Get tools relevant to a route
// ══════════════════════════════════════════════════════

export function getToolsForRoute(route: string): Anthropic.Tool[] {
  const readTools = ["search_employees", "get_dashboard_stats"];
  const escalation = ["escalate_to_background"];

  switch (route) {
    case "general":
      return ALL_TOOLS.filter((t) =>
        [...readTools, ...escalation].includes(t.name)
      );
    case "compliance":
      return ALL_TOOLS.filter((t) =>
        [...readTools, "get_compliance_items", "mark_compliance_complete", "generate_compliance", ...escalation].includes(t.name)
      );
    case "document":
      return ALL_TOOLS.filter((t) =>
        [...readTools, "create_document_request", "get_documents", ...escalation].includes(t.name)
      );
    case "helpdesk":
      return ALL_TOOLS.filter((t) =>
        [...readTools, "get_compliance_items", ...escalation].includes(t.name)
      );
    case "assessment":
      return ALL_TOOLS.filter((t) =>
        [...readTools, "create_assessment_cycle", "get_assessment_cycles", ...escalation].includes(t.name)
      );
    case "action":
      // Action route gets all tools
      return ALL_TOOLS;
    case "image":
      // Image analysis + all CRUD tools (user might want to import from image)
      return ALL_TOOLS;
    default:
      return ALL_TOOLS.filter((t) => readTools.includes(t.name));
  }
}
