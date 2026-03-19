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

// Compliance
export interface ComplianceItem {
  id: string;
  tenant_id: string;
  type: string;
  deadline: string;
  status: "pending" | "in_progress" | "done";
  completed_at: string | null;
  output_file_url: string | null;
  created_at: string;
}

// Documents
export interface Document {
  id: string;
  tenant_id: string;
  employee_id: string | null;
  doc_type: string;
  file_url: string;
  generated_at: string;
  generated_by: AgentType;
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
