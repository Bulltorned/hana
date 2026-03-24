// Re-define key types that align with dashboard types
// Keep in sync with F:/Claudecode/hana/src/lib/types/index.ts

export type AgentType = "hr_agent" | "staff_agent";

export type TaskStatus = "pending" | "processing" | "completed" | "failed";
export type TaskType =
  | "generate_document"
  | "compliance_check"
  | "send_reminder"
  | "assessment_action"
  | "chat_message"
  | "custom";

export interface PendingTask {
  id: string;
  tenant_id: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentHeartbeat {
  id: string;
  tenant_id: string;
  agent_type: AgentType;
  status: "online" | "offline" | "error";
  last_seen: string;
  message_count: number;
  model: string | null;
  uptime_seconds: number;
  metadata: Record<string, unknown>;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  tenant_id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  brand_color: string;
  kop_surat: {
    nama: string;
    alamat: string;
    telepon: string;
    email: string;
  };
  signer_name: string;
  signer_jabatan: string;
}
