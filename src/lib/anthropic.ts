import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Skill Registry ──────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills", "hrd-agent-skills");

type SkillRoute =
  | "general"       // No skill needed — greetings, simple Q&A
  | "compliance"    // BPJS, PPh21, THR, compliance deadlines
  | "document"      // Kontrak, surat, document generation
  | "helpdesk"      // Employee FAQ, leave, payslip, policies
  | "assessment"    // 360 assessment, performance review
  | "image"         // Image analysis
  | "action";       // CRUD operations → route to OpenClaw

const SKILL_MAP: Record<string, string> = {
  compliance: "compliance",
  document: "document-drafter",
  helpdesk: "hr-helpdesk",
  assessment: "360-assessment",
};

function loadSkill(skillName: string): string {
  const path = join(SKILLS_DIR, skillName, "SKILL.md");
  if (existsSync(path)) {
    const content = readFileSync(path, "utf-8");
    // Strip YAML frontmatter
    return content.replace(/^---[\s\S]*?---\n*/m, "");
  }
  return "";
}

// ── Router Agent ────────────────────────────────────

const ROUTER_SYSTEM = `You are a message router for an HR Agent. Classify the user's message into ONE category.

Reply with ONLY the category name. Nothing else.

Categories:
- general → greetings, chitchat, "siapa kamu", simple questions not related to specific HR topics
- compliance → BPJS, PPh21, pajak, THR, UMP, deadline compliance, regulasi ketenagakerjaan, iuran
- document → kontrak PKWT/PKWTT, surat peringatan, surat keterangan, offer letter, PHK, draft dokumen
- helpdesk → cuti, slip gaji, kebijakan perusahaan, SOP, hak karyawan, pertanyaan karyawan
- assessment → penilaian kinerja, review 360, KPI, assessment cycle, evaluasi
- image → user sent an image/screenshot to analyze
- action → user wants to CREATE/ADD/UPDATE/DELETE/IMPORT/GENERATE/SEND data (write operations)

Key rules:
- READ/CHECK/EXPLAIN/ANALYZE → pick the topic (compliance/document/helpdesk/assessment/general)
- WRITE/CREATE/UPDATE/DELETE/IMPORT → action
- If message includes a file/document to REVIEW → pick the topic, NOT action
- If message includes a file/document to IMPORT/BULK UPDATE → action
- Image attached → image (unless it's clearly an action request with image)

Examples:
"Halo" → general
"Apa deadline BPJS bulan ini?" → compliance
"Berapa iuran BPJS Kesehatan?" → compliance
"Jelaskan aturan THR" → compliance
"Buatkan kontrak PKWT untuk Budi" → action
"Apa saja yang harus ada di kontrak PKWT?" → document
"Berapa sisa cuti saya?" → helpdesk
"Buat assessment Q2" → action
"Jelaskan proses assessment 360" → assessment
"Tambah karyawan baru Andi" → action
"Check gambar ini" → image
"Import data dari file ini" → action
"Cek dokumen ini ada info berguna?" → general`;

export type MessageRoute = SkillRoute;

export async function routeMessage(
  content: string,
  hasImage: boolean = false
): Promise<MessageRoute> {
  // Fast path: if image attached and no clear action intent
  if (hasImage) {
    const actionWords = /\b(tambah|create|import|update|delete|hapus|buat|generate|kirim|send)\b/i;
    if (!actionWords.test(content)) return "image";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 15,
      system: ROUTER_SYSTEM,
      messages: [{ role: "user", content }],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text.trim().toLowerCase()
        : "general";

    // Validate it's a known route
    const validRoutes: SkillRoute[] = [
      "general", "compliance", "document", "helpdesk",
      "assessment", "image", "action",
    ];

    if (validRoutes.includes(text as SkillRoute)) {
      return text as SkillRoute;
    }

    return "general";
  } catch {
    return "general";
  }
}

// Keep old classifier as alias for backward compat
export async function classifyMessage(
  content: string
): Promise<"qa" | "action"> {
  const route = await routeMessage(content);
  return route === "action" ? "action" : "qa";
}

// ── Build System Prompt (per route) ─────────────────

const BASE_IDENTITY = `Kamu adalah **Hana**, HR Agent AI untuk perusahaan Indonesia. Kamu membantu tim HRD dengan pertanyaan seputar ketenagakerjaan, compliance, dokumen, dan assessment.

Aturan:
- Jawab dalam Bahasa Indonesia (kecuali user berbicara Inggris)
- Berikan jawaban yang praktis dan actionable
- Referensikan regulasi Indonesia yang relevan (UU Cipta Kerja, PP 35/2021, dll)
- Tanggal hari ini: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

const ACTION_FORMAT = `
---
# FORMAT AKSI

Jika ada rekomendasi yang bisa ditindaklanjuti, tambahkan di akhir:

:::actions
- [Label singkat](prompt yang akan dikirim)
:::

Maksimal 3 aksi. Hanya jika relevan.`;

function buildRoutedSystemPrompt(
  route: MessageRoute,
  tenantName: string,
  tenantContext: string
): string {
  const parts: string[] = [];

  // 1. Base identity (always, ~300 tokens)
  parts.push(BASE_IDENTITY.replace("perusahaan Indonesia", tenantName));

  // 2. Tenant context (always, ~200 tokens)
  if (tenantContext) {
    parts.push(`\n---\n# KONTEKS PERUSAHAAN\n${tenantContext}`);
  }

  // 3. Route-specific skill (only the relevant one, ~2-8K tokens)
  const skillName = SKILL_MAP[route];
  if (skillName) {
    const skill = loadSkill(skillName);
    if (skill) {
      // Truncate skill to max 8000 chars to stay within limits
      const truncatedSkill = skill.length > 8000
        ? skill.slice(0, 8000) + "\n\n[... skill content truncated ...]"
        : skill;
      parts.push(`\n---\n${truncatedSkill}`);
    }
  }

  // 4. Image-specific instruction
  if (route === "image") {
    parts.push("\n---\nAnalisis gambar yang diberikan user. Berikan insight yang berguna untuk HR/perusahaan.");
  }

  // 5. Action format (always, ~300 tokens)
  parts.push(ACTION_FORMAT);

  return parts.join("\n");
}

// ── Streaming Q&A Response ──────────────────────────

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamQAResponse(
  content: string,
  tenantName: string,
  tenantContext: string,
  history: ChatHistoryMessage[] = [],
  imageData?: { base64: string; mediaType: string },
  tenantId?: string
): Promise<ReadableStream<Uint8Array>> {
  const { getToolsForRoute, executeTool } = await import("@/lib/agent-tools");

  // 1. Route the message
  const route = await routeMessage(content, !!imageData);
  console.log(`[router] message routed to: ${route}`);

  // 2. Build system prompt with only the relevant skill
  const systemPrompt = buildRoutedSystemPrompt(
    imageData ? "image" : route,
    tenantName,
    tenantContext
  );

  // 3. Get tools for this route
  const tools = tenantId ? getToolsForRoute(imageData ? "image" : route) : [];

  // 4. Truncate content if too long
  const maxContentLength = 12000;
  const truncatedContent = content.length > maxContentLength
    ? content.slice(0, maxContentLength) + "\n\n[... konten terpotong ...]"
    : content;

  // 5. Build conversation messages (last 10 for context)
  const recentHistory = history.slice(-10);

  // 6. Build user message content (text + optional image)
  let userContent: Anthropic.MessageParam["content"];
  if (imageData) {
    userContent = [
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: imageData.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: imageData.base64,
        },
      },
      { type: "text" as const, text: truncatedContent || "Apa yang kamu lihat di gambar ini?" },
    ];
  } else {
    userContent = truncatedContent;
  }

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userContent },
  ];

  console.log(`[streamQA] route: ${route}, tools: ${tools.length}, content: ${truncatedContent.length} chars, system: ${systemPrompt.length} chars, hasImage: ${!!imageData}`);

  const encoder = new TextEncoder();
  const MAX_TOOL_ROUNDS = 5;

  return new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";
        let currentMessages = [...messages];
        let toolRound = 0;

        // Send route info
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "route", route })}\n\n`)
        );

        // Tool call loop — keeps going until Claude stops requesting tools
        while (toolRound <= MAX_TOOL_ROUNDS) {
          const stream = await anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            ...(tools.length > 0 ? { tools } : {}),
          });

          let hasToolUse = false;
          const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
          const contentBlocks: Anthropic.ContentBlock[] = [];

          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const text = event.delta.text;
                fullText += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`)
                );
              } else if (event.delta.type === "input_json_delta") {
                // Tool input streaming — we'll collect it in content_block_stop
              }
            } else if (event.type === "content_block_stop") {
              // Collect completed content blocks from the final message
            } else if (event.type === "message_stop") {
              // Get the final message to check for tool_use blocks
              const finalMessage = await stream.finalMessage();
              for (const block of finalMessage.content) {
                contentBlocks.push(block);
                if (block.type === "tool_use") {
                  hasToolUse = true;
                  toolCalls.push({
                    id: block.id,
                    name: block.name,
                    input: block.input as Record<string, unknown>,
                  });
                }
              }
            }
          }

          // If no tool calls, we're done
          if (!hasToolUse) break;

          // Execute tool calls and send status updates
          toolRound++;
          console.log(`[streamQA] tool round ${toolRound}: ${toolCalls.map((t) => t.name).join(", ")}`);

          // Add assistant message with tool calls to conversation
          currentMessages.push({
            role: "assistant" as const,
            content: contentBlocks,
          });

          // Execute each tool and collect results
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const tool of toolCalls) {
            // Send contextual status to frontend
            const statusMessages: Record<string, string> = {
              search_employees: "🔍 Mencari data karyawan...",
              add_employee: "✏️ Menambahkan karyawan baru...",
              add_employees_bulk: "📊 Mengimpor data karyawan...",
              update_employee: "✏️ Memperbarui data karyawan...",
              archive_employee: "🗃️ Mengarsipkan karyawan...",
              get_compliance_items: "📋 Memeriksa compliance...",
              mark_compliance_complete: "✅ Menandai compliance selesai...",
              generate_compliance: "⚙️ Generating compliance items...",
              create_document_request: "📄 Membuat dokumen...",
              get_documents: "📂 Mengambil daftar dokumen...",
              create_assessment_cycle: "📊 Membuat siklus assessment...",
              get_assessment_cycles: "📊 Mengambil data assessment...",
              get_dashboard_stats: "📈 Mengambil statistik...",
              escalate_to_background: "📋 Membuat background task...",
            };

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "status",
                  status: statusMessages[tool.name] ?? `⚙️ Menjalankan ${tool.name}...`,
                  tool: tool.name,
                })}\n\n`
              )
            );

            // Execute the tool
            const result = tenantId
              ? await executeTool(tool.name, tool.input, tenantId)
              : { success: false, error: "No tenant context", statusMessage: "❌ No tenant" };

            // Send result status
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "status",
                  status: result.statusMessage,
                  tool: tool.name,
                  success: result.success,
                })}\n\n`
              )
            );

            toolResults.push({
              type: "tool_result" as const,
              tool_use_id: tool.id,
              content: JSON.stringify(result.success ? result.data : { error: result.error }),
            });
          }

          // Add tool results to conversation
          currentMessages.push({
            role: "user" as const,
            content: toolResults,
          });

          // Loop continues — Claude will process tool results and either respond or call more tools
        }

        if (toolRound > MAX_TOOL_ROUNDS) {
          fullText += "\n\n⚠️ Proses dihentikan setelah 5 langkah. Silakan ulangi permintaan jika belum selesai.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: "\n\n⚠️ Proses dihentikan setelah 5 langkah." })}\n\n`
            )
          );
        }

        console.log(`[streamQA] complete: ${fullText.length} chars, ${toolRound} tool rounds`);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
          )
        );

        controller.close();
      } catch (err: unknown) {
        console.error("[streamQA] error:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

// ── Build Tenant Context ────────────────────────────

export interface TenantContextInput {
  tenantName: string;
  employeeCount: number;
  alamat?: string;
  signerName?: string;
  signerJabatan?: string;
}

export function buildTenantContext(input: TenantContextInput): {
  tenantName: string;
  context: string;
} {
  const context = [
    `- Nama Perusahaan: ${input.tenantName}`,
    `- Total Karyawan Aktif: ${input.employeeCount}`,
    input.alamat ? `- Alamat: ${input.alamat}` : "",
    input.signerName
      ? `- Penandatangan: ${input.signerName} (${input.signerJabatan ?? ""})`
      : "",
    `- Tanggal Hari Ini: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { tenantName: input.tenantName, context };
}
