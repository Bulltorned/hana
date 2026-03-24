import { config } from "./config.js";

interface PendingTask {
  id: string;
  tenant_id: string;
  task_type: string;
  status: string;
  priority: number;
  payload: Record<string, unknown>;
}

/**
 * Poll the gateway for the next pending task.
 */
export async function pollTask(): Promise<PendingTask | null> {
  const res = await fetch(`${config.gatewayUrl}/tasks/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: config.tenantId,
      agent_type: "hr_agent",
    }),
  });

  if (!res.ok) return null;
  const { task } = await res.json();
  return task ?? null;
}

/**
 * Mark a task as completed with result.
 */
export async function completeTask(
  taskId: string,
  result: Record<string, unknown>
): Promise<void> {
  await fetch(`${config.gatewayUrl}/tasks/${taskId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });
}

/**
 * Mark a task as failed.
 */
export async function failTask(taskId: string, error: string): Promise<void> {
  await fetch(`${config.gatewayUrl}/tasks/${taskId}/fail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error }),
  });
}

/**
 * Send heartbeat to gateway.
 */
export async function sendHeartbeat(data: {
  messageCount: number;
  uptimeSeconds: number;
}): Promise<void> {
  await fetch(`${config.gatewayUrl}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: config.tenantId,
      agent_type: "hr_agent",
      status: "online",
      message_count: data.messageCount,
      uptime_seconds: data.uptimeSeconds,
      model: "claude-sonnet-4-20250514",
    }),
  });
}

/**
 * Post a chat response back to the gateway.
 */
export async function postChatResponse(data: {
  sessionId: string;
  taskId?: string;
  content: string;
}): Promise<void> {
  await fetch(`${config.gatewayUrl}/chat/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: config.tenantId,
      session_id: data.sessionId,
      task_id: data.taskId,
      content: data.content,
    }),
  });
}
