-- ============================================
-- HRD Agent OS — Phase 1 Schema
-- ============================================

-- Enums
CREATE TYPE user_role AS ENUM ('operator', 'client_hrd');
CREATE TYPE plan_tier AS ENUM ('trial', 'starter', 'growth', 'pro');
CREATE TYPE tenant_status AS ENUM ('provisioning', 'active', 'suspended');
CREATE TYPE contract_status AS ENUM ('PKWTT', 'PKWT', 'Probation');
CREATE TYPE agent_type AS ENUM ('hr_agent', 'staff_agent');

-- ============================================
-- Tenants
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan plan_tier NOT NULL DEFAULT 'trial',
  status tenant_status NOT NULL DEFAULT 'provisioning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tenant Settings
-- ============================================
CREATE TABLE tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#4F7BF7',
  kop_surat JSONB DEFAULT '{"nama": "", "alamat": "", "telepon": "", "email": ""}'::jsonb,
  signer_name TEXT DEFAULT '',
  signer_jabatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client_hrd',
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Employees
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_id TEXT,
  avatar_url TEXT,
  jabatan TEXT NOT NULL DEFAULT '',
  divisi TEXT NOT NULL DEFAULT '',
  status_kontrak contract_status NOT NULL DEFAULT 'PKWT',
  tgl_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
  tgl_berakhir DATE,
  no_bpjs_kes TEXT DEFAULT '',
  no_bpjs_tk TEXT DEFAULT '',
  npwp TEXT DEFAULT '',
  gaji_pokok NUMERIC(15, 2) DEFAULT 0,
  email TEXT,
  phone TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for tenant-scoped queries
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_status_kontrak ON employees(tenant_id, status_kontrak);
CREATE INDEX idx_employees_tgl_berakhir ON employees(tenant_id, tgl_berakhir)
  WHERE tgl_berakhir IS NOT NULL AND is_archived = false;

-- ============================================
-- Compliance Items
-- ============================================
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  output_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Documents
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by agent_type NOT NULL DEFAULT 'hr_agent'
);

-- ============================================
-- Assessment Cycles
-- ============================================
CREATE TABLE assessment_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  deadline DATE NOT NULL,
  participants UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Assessment Responses
-- ============================================
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Agent Activity Log
-- ============================================
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_type agent_type NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Token Usage
-- ============================================
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- format: 'YYYY-MM'
  tokens_used BIGINT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 4) DEFAULT 0,
  UNIQUE(tenant_id, month)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's tenant_id
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- Profiles ----
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Operators can view all profiles"
  ON profiles FOR SELECT
  USING (auth.user_role() = 'operator');

CREATE POLICY "Operators can manage all profiles"
  ON profiles FOR ALL
  USING (auth.user_role() = 'operator');

-- ---- Tenants ----
CREATE POLICY "Operators can manage all tenants"
  ON tenants FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant"
  ON tenants FOR SELECT
  USING (id = auth.user_tenant_id());

-- ---- Tenant Settings ----
CREATE POLICY "Operators can manage all tenant settings"
  ON tenant_settings FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant settings"
  ON tenant_settings FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Client HRD can update own tenant settings"
  ON tenant_settings FOR UPDATE
  USING (tenant_id = auth.user_tenant_id());

-- ---- Employees ----
CREATE POLICY "Operators can manage all employees"
  ON employees FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can manage own tenant employees"
  ON employees FOR ALL
  USING (tenant_id = auth.user_tenant_id());

-- ---- Compliance Items ----
CREATE POLICY "Operators can manage all compliance items"
  ON compliance_items FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant compliance"
  ON compliance_items FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

-- ---- Documents ----
CREATE POLICY "Operators can manage all documents"
  ON documents FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant documents"
  ON documents FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

-- ---- Assessment Cycles ----
CREATE POLICY "Operators can manage all assessment cycles"
  ON assessment_cycles FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can manage own tenant assessments"
  ON assessment_cycles FOR ALL
  USING (tenant_id = auth.user_tenant_id());

-- ---- Assessment Responses ----
CREATE POLICY "Operators can manage all responses"
  ON assessment_responses FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can manage own tenant responses"
  ON assessment_responses FOR ALL
  USING (
    cycle_id IN (
      SELECT id FROM assessment_cycles
      WHERE tenant_id = auth.user_tenant_id()
    )
  );

-- ---- Agent Activity ----
CREATE POLICY "Operators can view all activity"
  ON agent_activity FOR SELECT
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant activity"
  ON agent_activity FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

-- ---- Token Usage ----
CREATE POLICY "Operators can manage all token usage"
  ON token_usage FOR ALL
  USING (auth.user_role() = 'operator');

CREATE POLICY "Client HRD can view own tenant usage"
  ON token_usage FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at on employees
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create tenant_settings when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_settings (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_tenant_settings();

-- Auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client_hrd')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
