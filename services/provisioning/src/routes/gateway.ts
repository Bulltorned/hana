import { Router } from "express";
import { z } from "zod";
import {
  claimNextTask,
  completeTask,
  failTask,
} from "../services/task-manager.js";
import { recordHeartbeat } from "../services/heartbeat.js";
import {
  getContainerStatus,
  openclawGatewayCall,
} from "../lib/docker.js";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { randomUUID } from "crypto";

export const gatewayRouter = Router();

// ══════════════════════════════════════════════════════
// Dashboard → OpenClaw (main chat flow)
// ══════════════════════════════════════════════════════

// ── Send message to OpenClaw agent ──────────────────
const sendMessageSchema = z.object({
  tenant_id: z.string().uuid(),
  message: z.string().min(1),
  session_id: z.string(),
});

gatewayRouter.post("/send", async (req, res) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { tenant_id, message, session_id } = parsed.data;

  // Check if container is running
  const { status } = await getContainerStatus(tenant_id);
  if (status !== "running") {
    res.status(503).json({ error: "Agent is not running", status });
    return;
  }

  try {
    // 1. Send message via chat.send
    const sessionKey = `agent:main:${session_id}`;
    const idempotencyKey = randomUUID();

    const sendResult = await openclawGatewayCall(tenant_id, "chat.send", {
      sessionKey,
      idempotencyKey,
      message,
    }, { timeout: 10000 });

    logger.info({ tenant_id, sendResult }, "chat.send result");

    // 2. Wait for agent to process, then fetch history
    // Poll chat.history until we get the assistant response
    let assistantContent = "";
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max wait

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 2000)); // Wait 2s
      attempts++;

      const history = await openclawGatewayCall(tenant_id, "chat.history", {
        sessionKey,
      }, { timeout: 10000 }) as Record<string, unknown>;

      const messages = (history.messages ?? []) as Array<Record<string, unknown>>;

      // Find the last assistant message with text content (not tool calls)
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === "assistant") {
          const content = msg.content as Array<Record<string, unknown>>;
          const textBlock = content?.find((c) => c.type === "text");
          if (textBlock?.text) {
            assistantContent = textBlock.text as string;
            break;
          }
        }
      }

      if (assistantContent) break;

      logger.info({ tenant_id, attempts }, "Waiting for agent response...");
    }

    if (!assistantContent) {
      res.status(504).json({ error: "Agent did not respond in time" });
      return;
    }

    // 3. Save assistant message to Supabase chat_messages
    const { data: assistantMsg } = await supabase
      .from("chat_messages")
      .insert({
        tenant_id,
        session_id,
        role: "assistant",
        content: assistantContent,
        metadata: { source: "openclaw" },
      })
      .select()
      .single();

    res.json({ response: assistantMsg });
  } catch (err: any) {
    logger.error({ tenant_id, error: err.message }, "Failed to communicate with OpenClaw");
    res.status(502).json({ error: "Failed to reach agent", detail: err.message });
  }
});

// ── Get agent status ────────────────────────────────
gatewayRouter.get("/status/:tenantId", async (req, res) => {
  const { tenantId } = req.params;

  try {
    const { status } = await getContainerStatus(tenantId);
    if (status !== "running") {
      res.json({ online: false, containerStatus: status });
      return;
    }

    const health = await openclawGatewayCall(tenantId, "health", {}, { timeout: 5000 });
    res.json({ online: true, ...health as object });
  } catch {
    res.json({ online: false });
  }
});

// ══════════════════════════════════════════════════════
// Agent callback routes (backward compat for pending_tasks)
// ══════════════════════════════════════════════════════

const pollSchema = z.object({
  tenant_id: z.string().uuid(),
  agent_type: z.enum(["hr_agent", "staff_agent"]).default("hr_agent"),
});

gatewayRouter.post("/tasks/poll", async (req, res) => {
  const parsed = pollSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const task = await claimNextTask(parsed.data.tenant_id);
  res.json({ task });
});

gatewayRouter.post("/tasks/:taskId/complete", async (req, res) => {
  const { taskId } = req.params;
  const result = req.body?.result ?? {};

  try {
    await completeTask(taskId, result);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to complete task" });
  }
});

gatewayRouter.post("/tasks/:taskId/fail", async (req, res) => {
  const { taskId } = req.params;
  const error = req.body?.error ?? "Unknown error";

  try {
    await failTask(taskId, error);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to fail task" });
  }
});

// ── Heartbeat ───────────────────────────────────────
const heartbeatSchema = z.object({
  tenant_id: z.string().uuid(),
  agent_type: z.enum(["hr_agent", "staff_agent"]),
  status: z.enum(["online", "offline", "error"]),
  message_count: z.number().optional(),
  model: z.string().optional(),
  uptime_seconds: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

gatewayRouter.post("/heartbeat", async (req, res) => {
  const parsed = heartbeatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    await recordHeartbeat(parsed.data);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
});
