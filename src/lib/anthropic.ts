import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Message Classification ──────────────────────────

const CLASSIFY_SYSTEM = `You classify HR messages. Reply ONLY with "qa" or "action". Nothing else.

qa = question, explanation, advice, calculation, information request, greeting, general chat
action = generate document, create file, send message/email/whatsapp, execute a task, modify data, anything requiring tools or file I/O

Examples:
- "Apa deadline BPJS bulan ini?" → qa
- "Berapa iuran BPJS Kesehatan?" → qa
- "Jelaskan aturan THR" → qa
- "Halo" → qa
- "Siapa kamu?" → qa
- "Buatkan kontrak PKWT untuk Budi" → action
- "Generate surat peringatan untuk Andi" → action
- "Kirim reminder ke karyawan" → action
- "Buat laporan assessment" → action
- "Update data karyawan Ahmad" → action`;

export async function classifyMessage(
  content: string
): Promise<"qa" | "action"> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      system: CLASSIFY_SYSTEM,
      messages: [{ role: "user", content }],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text.trim().toLowerCase()
        : "qa";

    return text === "action" ? "action" : "qa";
  } catch {
    // Default to qa on classification failure
    return "qa";
  }
}

// ── Skill Loading ───────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills", "hrd-agent-skills");

function loadSkill(skillName: string): string {
  const path = join(SKILLS_DIR, skillName, "SKILL.md");
  if (existsSync(path)) {
    // Strip YAML frontmatter
    const content = readFileSync(path, "utf-8");
    const stripped = content.replace(/^---[\s\S]*?---\n*/m, "");
    return stripped;
  }
  return "";
}

function buildSystemPrompt(
  tenantName: string,
  tenantContext: string
): string {
  const identity = loadSkill("agent-identity")
    .replace(/\{\{COMPANY_NAME\}\}/g, tenantName)
    .replace(/\{\{AGENT_NAME\}\}/g, "Hana")
    .replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString("id-ID"));

  const compliance = loadSkill("compliance");
  const helpdesk = loadSkill("hr-helpdesk");

  return [
    identity,
    tenantContext ? `\n---\n# KONTEKS PERUSAHAAN\n${tenantContext}` : "",
    compliance ? `\n---\n${compliance}` : "",
    helpdesk ? `\n---\n${helpdesk}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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
  history: ChatHistoryMessage[] = []
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = buildSystemPrompt(tenantName, tenantContext);

  // Build conversation messages (last 10 for context)
  const recentHistory = history.slice(-10);
  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content },
  ];

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  // Convert Anthropic stream to Web ReadableStream
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullText += text;

            // Send as SSE event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`)
            );
          }
        }

        // Send final event with full text
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
          )
        );

        controller.close();
      } catch (err: unknown) {
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
