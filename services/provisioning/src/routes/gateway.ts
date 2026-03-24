import { Router } from "express";
import { z } from "zod";
import { claimNextTask, completeTask, failTask } from "../services/task-manager.js";
import { recordHeartbeat } from "../services/heartbeat.js";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";

export const gatewayRouter = Router();

// ── Poll for next task ──────────────────────────────
const pollSchema = z.object({
  tenant_id: z.string().uuid(),
  agent_type: z.enum(["hr_agent", "staff_agent"]).default("hr_agent"),
});

gatewayRouter.post("/tasks/poll", async (req, res) => {
  const parsed = pollSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
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
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
});

// ── Chat respond ────────────────────────────────────
const chatRespondSchema = z.object({
  tenant_id: z.string().uuid(),
  session_id: z.string(),
  task_id: z.string().uuid().optional(),
  content: z.string().min(1),
});

gatewayRouter.post("/chat/respond", async (req, res) => {
  const parsed = chatRespondSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { tenant_id, session_id, task_id, content } = parsed.data;

  // Insert assistant message into chat_messages
  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      tenant_id,
      session_id,
      role: "assistant",
      content,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    logger.error({ error: error.message }, "Failed to insert chat response");
    res.status(500).json({ error: "Failed to save response" });
    return;
  }

  // Complete the associated task if provided
  if (task_id) {
    await completeTask(task_id, { message_id: message.id, content });
  }

  res.json({ message });
});
