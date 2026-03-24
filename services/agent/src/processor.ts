import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { completeTask, failTask, postChatResponse } from "./gateway.js";
import { getRelevantSkills, buildSystemPrompt } from "./skills.js";
import type { Skill } from "./skills.js";

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

interface Task {
  id: string;
  tenant_id: string;
  task_type: string;
  payload: Record<string, unknown>;
}

/**
 * Process a single task based on its type.
 */
export async function processTask(
  task: Task,
  skills: Skill[]
): Promise<void> {
  console.log(`Processing task ${task.id} (${task.task_type})`);

  try {
    switch (task.task_type) {
      case "chat_message":
        await processChatMessage(task, skills);
        break;

      case "generate_document":
        await processDocumentGeneration(task, skills);
        break;

      case "compliance_check":
        await processComplianceCheck(task, skills);
        break;

      default:
        await processGeneric(task, skills);
        break;
    }
  } catch (err: any) {
    console.error(`Task ${task.id} failed:`, err.message);
    await failTask(task.id, err.message);
  }
}

/**
 * Handle chat_message tasks — call Claude and post response.
 */
async function processChatMessage(
  task: Task,
  skills: Skill[]
): Promise<void> {
  const { content, session_id } = task.payload as {
    content: string;
    session_id: string;
  };

  if (!content) {
    await failTask(task.id, "No content in chat message");
    return;
  }

  // Get relevant skills based on message
  const relevantSkills = getRelevantSkills(skills, content);
  const systemPrompt = buildSystemPrompt(relevantSkills, config.tenantName);

  // Call Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      { role: "user", content },
    ],
  });

  const assistantContent =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Maaf, saya tidak bisa memproses permintaan ini.";

  // Post response back via gateway
  await postChatResponse({
    sessionId: session_id,
    taskId: task.id,
    content: assistantContent,
  });

  console.log(`Chat response sent for task ${task.id}`);
}

/**
 * Handle document generation tasks.
 */
async function processDocumentGeneration(
  task: Task,
  skills: Skill[]
): Promise<void> {
  const { doc_type, title, variables, employee } = task.payload as {
    doc_type: string;
    title: string;
    variables: Record<string, unknown>;
    employee?: { name: string; jabatan: string };
  };

  // Get document-drafter skill
  const relevantSkills = getRelevantSkills(skills, `document ${doc_type}`);
  const systemPrompt = buildSystemPrompt(relevantSkills, config.tenantName);

  const userPrompt = [
    `Buatkan dokumen ${title}.`,
    `Jenis: ${doc_type}`,
    employee ? `Karyawan: ${employee.name} — ${employee.jabatan}` : "",
    variables?.notes ? `Catatan: ${variables.notes}` : "",
    "",
    "Format output dalam markdown yang rapi dan profesional.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Gagal generate dokumen.";

  await completeTask(task.id, {
    generated_content: content,
    doc_type,
    title,
  });

  console.log(`Document generated for task ${task.id}`);
}

/**
 * Handle compliance check tasks.
 */
async function processComplianceCheck(
  task: Task,
  skills: Skill[]
): Promise<void> {
  const { month, action } = task.payload as {
    month: string;
    action: string;
  };

  const relevantSkills = getRelevantSkills(skills, "compliance bpjs pph21");
  const systemPrompt = buildSystemPrompt(relevantSkills, config.tenantName);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Review compliance items untuk bulan ${month}. Action: ${action}. Berikan ringkasan apa yang perlu dilakukan HRD bulan ini.`,
      },
    ],
  });

  const content =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Gagal memproses compliance check.";

  await completeTask(task.id, {
    summary: content,
    month,
  });

  console.log(`Compliance check completed for task ${task.id}`);
}

/**
 * Handle any other task type generically.
 */
async function processGeneric(
  task: Task,
  skills: Skill[]
): Promise<void> {
  const relevantSkills = getRelevantSkills(
    skills,
    JSON.stringify(task.payload).slice(0, 200)
  );
  const systemPrompt = buildSystemPrompt(relevantSkills, config.tenantName);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Process this task: ${JSON.stringify(task.payload)}`,
      },
    ],
  });

  const content =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Task processed.";

  await completeTask(task.id, { result: content });
}
