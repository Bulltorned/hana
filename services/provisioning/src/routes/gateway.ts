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
  getOpenClawGatewayUrl,
} from "../lib/docker.js";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";

export const gatewayRouter = Router();

// ══════════════════════════════════════════════════════
// Routes called BY the dashboard (forwarded to OpenClaw)
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

  // Forward message to OpenClaw gateway
  const openclawUrl = getOpenClawGatewayUrl(tenant_id);

  try {
    const openclawRes = await fetch(`${openclawUrl}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        channel: "internal",
        sessionId: session_id,
      }),
      signal: AbortSignal.timeout(60_000), // 60s timeout for agent response
    });

    if (!openclawRes.ok) {
      const errText = await openclawRes.text();
      logger.error({ tenant_id, error: errText }, "OpenClaw returned error");
      res.status(502).json({ error: "Agent failed to process message" });
      return;
    }

    const result = await openclawRes.json();

    // Save assistant message to chat_messages
    const { data: assistantMsg } = await supabase
      .from("chat_messages")
      .insert({
        tenant_id,
        session_id,
        role: "assistant",
        content: result.response ?? result.message ?? JSON.stringify(result),
        metadata: { source: "openclaw", raw: result },
      })
      .select()
      .single();

    res.json({ response: assistantMsg });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      logger.error({ tenant_id }, "OpenClaw request timed out (60s)");
      res.status(504).json({ error: "Agent response timed out" });
    } else {
      logger.error({ tenant_id, error: err.message }, "Failed to reach OpenClaw");
      res.status(502).json({ error: "Cannot reach agent" });
    }
  }
});

// ── Get agent status ────────────────────────────────
gatewayRouter.get("/status/:tenantId", async (req, res) => {
  const { tenantId } = req.params;
  const openclawUrl = getOpenClawGatewayUrl(tenantId);

  try {
    const openclawRes = await fetch(`${openclawUrl}/status`, {
      signal: AbortSignal.timeout(5000),
    });

    if (openclawRes.ok) {
      const status = await openclawRes.json();
      res.json({ online: true, ...status });
    } else {
      res.json({ online: false });
    }
  } catch {
    res.json({ online: false });
  }
});

// ══════════════════════════════════════════════════════
// Routes called BY OpenClaw agent (callback pattern)
// These are still useful for agents writing back results
// ══════════════════════════════════════════════════════

// ── Poll for next task (backward compat) ────────────
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

// ── Complete a task ─────────────────────────────────
const completeSchema = z.object({
  result: z.record(z.unknown()),
});

gatewayRouter.post("/tasks/:taskId/complete", async (req, res) => {
  const { taskId } = req.params;
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    await completeTask(taskId, parsed.data.result);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// ── Fail a task ─────────────────────────────────────
const failSchema = z.object({
  error: z.string(),
});

gatewayRouter.post("/tasks/:taskId/fail", async (req, res) => {
  const { taskId } = req.params;
  const parsed = failSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    await failTask(taskId, parsed.data.error);
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
