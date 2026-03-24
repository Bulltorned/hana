import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import type { PendingTask } from "../types.js";

/**
 * Atomically claim the next pending task for a tenant.
 * Sets status to 'processing' and started_at to now.
 */
export async function claimNextTask(
  tenantId: string
): Promise<PendingTask | null> {
  // Find oldest pending task with highest priority
  const { data: tasks, error: findError } = await supabase
    .from("pending_tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (findError || !tasks || tasks.length === 0) {
    return null;
  }

  const task = tasks[0];

  // Atomically claim it (only if still pending)
  const { data: claimed, error: claimError } = await supabase
    .from("pending_tasks")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .eq("status", "pending") // Prevent race conditions
    .select()
    .single();

  if (claimError || !claimed) {
    // Another worker claimed it — try again or return null
    logger.warn({ taskId: task.id }, "Task was claimed by another worker");
    return null;
  }

  logger.info(
    { taskId: claimed.id, type: claimed.task_type, tenantId },
    "Task claimed"
  );

  return claimed as PendingTask;
}

/**
 * Mark a task as completed with a result payload.
 */
export async function completeTask(
  taskId: string,
  result: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("pending_tasks")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    logger.error({ taskId, error: error.message }, "Failed to complete task");
    throw error;
  }

  logger.info({ taskId }, "Task completed");
}

/**
 * Mark a task as failed with an error message.
 */
export async function failTask(
  taskId: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from("pending_tasks")
    .update({
      status: "failed",
      error: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    logger.error({ taskId, error: error.message }, "Failed to fail task");
    throw error;
  }

  logger.info({ taskId, errorMessage }, "Task failed");
}

/**
 * Get count of pending tasks for a tenant.
 */
export async function getPendingCount(tenantId: string): Promise<number> {
  const { count } = await supabase
    .from("pending_tasks")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  return count ?? 0;
}
