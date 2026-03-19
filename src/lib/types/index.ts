// Auth & Roles
export type UserRole = "operator" | "client_hrd";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  tenant_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Tenant
export type TenantStatus = "provisioning" | "active" | "suspended";
export type PlanTier = "trial" | "starter" | "growth" | "pro";

export interface Tenant {
  id: string;
  name: string;
  plan: PlanTier;
  status: TenantStatus;
  created_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  logo_url: string | null;
  brand_color: string;
  kop_surat: {
    nama: string;
    alamat: string;
    telepon: string;
    email: string;
  };
  signer_name: string;
  signer_jabatan: string;
  created_at: string;
  updated_at: string;
}

// Employee
export type ContractStatus = "PKWTT" | "PKWT" | "Probation";

export interface Employee {
  id: string;
  tenant_id: string;
  name: string;
  employee_id: string | null;
  avatar_url: string | null;
  jabatan: string;
  divisi: string;
  status_kontrak: ContractStatus;
  tgl_mulai: string;
  tgl_berakhir: string | null;
  no_bpjs_kes: string;
  no_bpjs_tk: string;
  npwp: string;
  gaji_pokok: number;
  email: string | null;
  phone: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// Agent
export type AgentType = "hr_agent" | "staff_agent";

export interface AgentActivity {
  id: string;
  tenant_id: string;
  agent_type: AgentType;
  action: string;
  summary: string;
  created_at: string;
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

// Pending Tasks
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

// Compliance
export type ComplianceStatus = "upcoming" | "due_soon" | "overdue" | "completed" | "skipped";
export type ComplianceType =
  | "bpjs_kesehatan"
  | "bpjs_ketenagakerjaan"
  | "pph21_setor"
  | "pph21_lapor"
  | "thr"
  | "pkwt_expiry"
  | "bpjs_registration"
  | "other";

export interface ComplianceItem {
  id: string;
  tenant_id: string;
  type: ComplianceType;
  title: string;
  description: string | null;
  deadline: string;
  status: ComplianceStatus;
  employee_id: string | null;
  amount: number | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // joined
  employee?: Employee;
}

// Documents
export type DocStatus = "draft" | "generating" | "ready" | "signed" | "archived";
export type DocType =
  | "pkwt"
  | "pkwtt"
  | "sp1"
  | "sp2"
  | "sp3"
  | "phk"
  | "offer_letter"
  | "surat_keterangan"
  | "surat_mutasi"
  | "other";

export interface DocumentRequest {
  id: string;
  tenant_id: string;
  employee_id: string | null;
  doc_type: DocType;
  status: DocStatus;
  title: string;
  variables: Record<string, unknown>;
  output_url: string | null;
  output_format: string;
  requested_by: string | null;
  generated_at: string | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  employee?: Employee;
}

// Chat
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

// Assessment
export interface AssessmentCycle {
  id: string;
  tenant_id: string;
  name: string;
  period: string;
  deadline: string;
  participants: string[];
  status: "draft" | "active" | "completed";
  created_at: string;
}

export interface AssessmentResponse {
  id: string;
  cycle_id: string;
  employee_id: string;
  responses: Record<string, unknown>;
  completed_at: string | null;
}

// Token Usage
export interface TokenUsage {
  id: string;
  tenant_id: string;
  month: string;
  tokens_used: number;
  cost_usd: number;
}
