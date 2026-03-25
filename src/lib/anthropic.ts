import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Message Classification ──────────────────────────

const CLASSIFY_SYSTEM = `You classify HR messages. Reply ONLY with "qa" or "action". Nothing else.

qa = question, explanation, advice, calculation, information request, greeting, general chat, reviewing/analyzing a document, asking about file content, summarizing
action = create/add/insert data, update/edit existing data, delete/archive data, generate document/file, send message/email/whatsapp, import/bulk upload data, execute a database operation

Key rule: READ/ANALYZE/REVIEW/CHECK/EXPLAIN → qa. WRITE/CREATE/UPDATE/DELETE/IMPORT/SEND → action.

Examples (qa):
- "Apa deadline BPJS bulan ini?" → qa
- "Berapa iuran BPJS Kesehatan?" → qa
- "Jelaskan aturan THR" → qa
- "Halo" → qa
- "Siapa kamu?" → qa
- "Cek dokumen ini ada info berguna?" → qa
- "Apa isi file ini?" → qa
- "Review dokumen ini" → qa
- "Analisis data karyawan" → qa
- "Siapa saja karyawan yang kontraknya mau habis?" → qa
- "Berapa total karyawan aktif?" → qa
- "Rangkum isi dokumen ini" → qa

Examples (action):
- "Buatkan kontrak PKWT untuk Budi" → action
- "Generate surat peringatan untuk Andi" → action
- "Kirim reminder ke karyawan" → action
- "Buat laporan assessment" → action
- "Update data karyawan Ahmad" → action
- "Tambahkan karyawan baru: Andi, Backend Dev" → action
- "Import semua karyawan dari file ini" → action
- "Hapus data karyawan Budi" → action
- "Mark compliance BPJS sebagai selesai" → action
- "Buat siklus assessment Q2" → action
- "Update gaji karyawan dari file ini" → action
- "Arsipkan karyawan yang sudah resign" → action`;

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

  const actionInstructions = `
---
# FORMAT AKSI

Jika dalam jawabanmu ada rekomendasi yang bisa ditindaklanjuti (generate dokumen, cek data, kirim reminder, dll), tambahkan di akhir pesan dengan format berikut:

:::actions
- [Label tombol yang singkat](prompt yang akan dikirim sebagai pesan baru)
- [Label kedua](prompt kedua)
:::

Contoh:
:::actions
- [Generate Kontrak PKWT](Buatkan kontrak PKWT untuk karyawan ini)
- [Cek Deadline Compliance](Cek semua deadline compliance bulan ini)
- [Hitung Iuran BPJS](Hitung detail iuran BPJS Kesehatan untuk semua karyawan)
:::

ATURAN:
- Maksimal 3 aksi per pesan
- Label singkat (2-4 kata)
- Prompt harus jelas dan actionable
- Hanya tambahkan jika memang relevan — tidak setiap pesan butuh aksi
- JANGAN tambahkan aksi untuk pertanyaan sederhana yang sudah dijawab tuntas
`;

  return [
    identity,
    tenantContext ? `\n---\n# KONTEKS PERUSAHAAN\n${tenantContext}` : "",
    compliance ? `\n---\n${compliance}` : "",
    helpdesk ? `\n---\n${helpdesk}` : "",
    actionInstructions,
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
  history: ChatHistoryMessage[] = [],
  imageData?: { base64: string; mediaType: string }
): Promise<ReadableStream<Uint8Array>> {
  // Use shorter system prompt for image requests to save context window
  const systemPrompt = imageData
    ? `Kamu adalah Hana, HR Agent untuk ${tenantName}. Jawab dalam Bahasa Indonesia. Analisis gambar yang diberikan user dan berikan insight yang berguna untuk HR/perusahaan.`
    : buildSystemPrompt(tenantName, tenantContext);

  // Truncate content if too long (file extractions can be huge)
  const maxContentLength = 12000;
  const truncatedContent = content.length > maxContentLength
    ? content.slice(0, maxContentLength) + "\n\n[... konten terpotong karena terlalu panjang ...]"
    : content;

  // Build conversation messages (last 10 for context)
  const recentHistory = history.slice(-10);

  // Build the user message content (text + optional image)
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

  console.log(`[streamQA] content length: ${truncatedContent.length}, history: ${recentHistory.length}, system: ${systemPrompt.length}, hasImage: ${!!imageData}`);

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

        let eventCount = 0;
        for await (const event of stream) {
          eventCount++;
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

        console.log(`[streamQA] stream complete: ${eventCount} events, fullText length: ${fullText.length}`);

        // Send final event with full text
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
          )
        );

        controller.close();
      } catch (err: unknown) {
        console.error("[streamQA] stream error:", err);
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
