-- ============================================
-- HRD Agent OS — Phase 2 Schema
-- Agent infrastructure + compliance engine
-- ============================================

-- ============================================
-- Agent Heartbeats (realtime status monitoring)
-- ============================================
CREATE TABLE agent_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_type agent_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline', -- online, offline, error
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INT NOT NULL DEFAULT 0,
  model TEXT, -- e.g. claude-sonnet-4-5
  uptime_seconds INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, agent_type)
);

-- ============================================
-- Pending Tasks (dashboard → agent communication)
-- ============================================
CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE task_type AS ENUM (
  'generate_document',
  'compliance_check',
  'send_reminder',
  'assessment_action',
  'chat_message',
  'custom'
);

CREATE TABLE pending_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 0, -- higher = more urgent
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB, -- agent writes result here
  error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Compliance Calendar (auto-generated deadlines)
-- ============================================
CREATE TYPE compliance_status AS ENUM ('upcoming', 'due_soon', 'overdue', 'completed', 'skipped');
CREATE TYPE compliance_type AS ENUM (
  'bpjs_kesehatan',
  'bpjs_ketenagakerjaan',
  'pph21_setor',
  'pph21_lapor',
  'thr',
  'pkwt_expiry',
  'bpjs_registration',
  'other'
);

CREATE TABLE compliance_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type compliance_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  status compliance_status NOT NULL DEFAULT 'upcoming',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- for employee-specific items
  amount DECIMAL(15,2), -- estimated amount (e.g. BPJS total)
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Document Requests (track generated documents)
-- ============================================
CREATE TYPE doc_status AS ENUM ('draft', 'generating', 'ready', 'signed', 'archived');
CREATE TYPE doc_type AS ENUM (
  'pkwt',
  'pkwtt',
  'sp1',
  'sp2',
  'sp3',
  'phk',
  'offer_letter',
  'surat_keterangan',
  'surat_mutasi',
  'other'
);

CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  doc_type doc_type NOT NULL,
  status doc_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb, -- template variables filled
  output_url TEXT, -- generated file URL
  output_format TEXT DEFAULT 'pdf', -- pdf or docx
  requested_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ,
  task_id UUID REFERENCES pending_tasks(id), -- link to agent task
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Chat Messages (HR Agent conversation log)
-- ============================================
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- group messages into sessions
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_heartbeats_tenant ON agent_heartbeats(tenant_id);
CREATE INDEX idx_pending_tasks_tenant_status ON pending_tasks(tenant_id, status);
CREATE INDEX idx_pending_tasks_created ON pending_tasks(created_at DESC);
CREATE INDEX idx_compliance_tenant_deadline ON compliance_calendar(tenant_id, deadline);
CREATE INDEX idx_compliance_status ON compliance_calendar(status);
CREATE INDEX idx_doc_requests_tenant ON document_requests(tenant_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(tenant_id, session_id, created_at);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE agent_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Operator can see all
CREATE POLICY "Operators see all heartbeats" ON agent_heartbeats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  );

CREATE POLICY "Operators see all tasks" ON pending_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  );

CREATE POLICY "Operators see all compliance" ON compliance_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  );

CREATE POLICY "Operators see all doc requests" ON document_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  );

CREATE POLICY "Operators see all chat" ON chat_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  );

-- Client HRD sees own tenant
CREATE POLICY "Client sees own heartbeats" ON agent_heartbeats
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client sees own tasks" ON pending_tasks
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client sees own compliance" ON compliance_calendar
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client sees own doc requests" ON document_requests
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client sees own chat" ON chat_messages
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- Enable Realtime for agent_heartbeats
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE agent_heartbeats;

-- ============================================
-- Function: Auto-generate monthly compliance items
-- ============================================
CREATE OR REPLACE FUNCTION generate_monthly_compliance(p_tenant_id UUID, p_month DATE)
RETURNS void AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM p_month);
  v_month INT := EXTRACT(MONTH FROM p_month);
  v_deadline_10 DATE := make_date(v_year, v_month, 10);
  v_deadline_15 DATE := make_date(v_year, v_month, 15);
  v_deadline_20 DATE := make_date(v_year, v_month, 20);
BEGIN
  -- BPJS Kesehatan — tanggal 10
  INSERT INTO compliance_calendar (tenant_id, type, title, description, deadline)
  VALUES (
    p_tenant_id,
    'bpjs_kesehatan',
    'Bayar BPJS Kesehatan ' || to_char(p_month, 'Mon YYYY'),
    'Pembayaran iuran BPJS Kesehatan bulan berjalan. Denda keterlambatan 5%.',
    v_deadline_10
  ) ON CONFLICT DO NOTHING;

  -- BPJS Ketenagakerjaan — tanggal 15
  INSERT INTO compliance_calendar (tenant_id, type, title, description, deadline)
  VALUES (
    p_tenant_id,
    'bpjs_ketenagakerjaan',
    'Bayar BPJS Ketenagakerjaan ' || to_char(p_month, 'Mon YYYY'),
    'Pembayaran JHT + JKK + JKM + JP + JKP bulan berjalan. Denda bunga 2%/bulan.',
    v_deadline_15
  ) ON CONFLICT DO NOTHING;

  -- PPh 21 Setor — tanggal 15
  INSERT INTO compliance_calendar (tenant_id, type, title, description, deadline)
  VALUES (
    p_tenant_id,
    'pph21_setor',
    'Setor PPh 21 ' || to_char(p_month - interval '1 month', 'Mon YYYY'),
    'Penyetoran pajak penghasilan karyawan bulan sebelumnya via e-Billing.',
    v_deadline_15
  ) ON CONFLICT DO NOTHING;

  -- PPh 21 Lapor — tanggal 20
  INSERT INTO compliance_calendar (tenant_id, type, title, description, deadline)
  VALUES (
    p_tenant_id,
    'pph21_lapor',
    'Lapor SPT Masa PPh 21 ' || to_char(p_month - interval '1 month', 'Mon YYYY'),
    'Pelaporan SPT Masa PPh 21 via e-Filing. Denda Rp100.000 per SPT terlambat.',
    v_deadline_20
  ) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Detect PKWT expiries for a tenant
-- ============================================
CREATE OR REPLACE FUNCTION detect_pkwt_expiries(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert compliance items for PKWTs expiring within 30 days
  INSERT INTO compliance_calendar (tenant_id, type, title, description, deadline, employee_id, status)
  SELECT
    e.tenant_id,
    'pkwt_expiry',
    'PKWT ' || e.name || ' akan berakhir',
    'Kontrak PKWT ' || e.name || ' (' || e.jabatan || ') berakhir ' ||
    to_char(e.tgl_berakhir, 'DD Mon YYYY') || '. Perlu keputusan: perpanjang, angkat PKWTT, atau akhiri.',
    e.tgl_berakhir - interval '7 days', -- alert H-7
    e.id,
    CASE
      WHEN e.tgl_berakhir <= CURRENT_DATE THEN 'overdue'
      WHEN e.tgl_berakhir <= CURRENT_DATE + interval '7 days' THEN 'due_soon'
      ELSE 'upcoming'
    END
  FROM employees e
  WHERE e.tenant_id = p_tenant_id
    AND e.status_kontrak = 'PKWT'
    AND e.tgl_berakhir IS NOT NULL
    AND e.tgl_berakhir <= CURRENT_DATE + interval '30 days'
    AND e.is_archived = false
    AND NOT EXISTS (
      SELECT 1 FROM compliance_calendar cc
      WHERE cc.tenant_id = p_tenant_id
        AND cc.employee_id = e.id
        AND cc.type = 'pkwt_expiry'
        AND cc.deadline >= CURRENT_DATE - interval '30 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
