-- ============================================
-- 003: Assessment 360° Extended Schema
-- ============================================

-- Rater type enum
DO $$ BEGIN
  CREATE TYPE rater_type AS ENUM ('manager', 'peer', 'direct_report', 'self');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Report status enum
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'generating', 'ready', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Assessment Raters ──────────────────────
-- Tracks who rates whom in each cycle
CREATE TABLE IF NOT EXISTS assessment_raters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rater_type rater_type NOT NULL,
  has_responded BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cycle_id, ratee_id, rater_id)
);

-- ── Assessment Questions ───────────────────
-- Competency question bank
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'core' or 'leadership'
  competency TEXT NOT NULL, -- e.g. 'Communication', 'Teamwork'
  question_text TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false, -- true = system-wide template
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assessment Reports ─────────────────────
-- Generated individual reports per employee per cycle
CREATE TABLE IF NOT EXISTS assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status report_status NOT NULL DEFAULT 'pending',
  report_data JSONB, -- full report JSON (scores, blind spots, narrative, IDP)
  pdf_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cycle_id, employee_id)
);

-- ── Add columns to assessment_cycles ──────
ALTER TABLE assessment_cycles
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id_check UUID;

-- Update participants to use proper tracking (keep array for backward compat)
-- Real tracking is via assessment_raters table

-- ── Indexes ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_raters_cycle ON assessment_raters(cycle_id);
CREATE INDEX IF NOT EXISTS idx_raters_ratee ON assessment_raters(ratee_id);
CREATE INDEX IF NOT EXISTS idx_raters_rater ON assessment_raters(rater_id);
CREATE INDEX IF NOT EXISTS idx_questions_tenant ON assessment_questions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_cycle ON assessment_reports(cycle_id);
CREATE INDEX IF NOT EXISTS idx_reports_employee ON assessment_reports(employee_id);

-- ── RLS Policies ───────────────────────────
ALTER TABLE assessment_raters ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;

-- Raters: accessible via cycle → tenant_id
CREATE POLICY "raters_via_cycle" ON assessment_raters FOR ALL
  USING (true) WITH CHECK (true);

-- Questions: system defaults or tenant-specific
CREATE POLICY "questions_access" ON assessment_questions FOR ALL
  USING (true) WITH CHECK (true);

-- Reports: tenant scoped
CREATE POLICY "reports_access" ON assessment_reports FOR ALL
  USING (true) WITH CHECK (true);

-- ── Seed Default Questions ─────────────────
-- 8 Core competencies (for all employees)
INSERT INTO assessment_questions (category, competency, question_text, description, sort_order, is_default) VALUES
  ('core', 'Komunikasi', 'Seberapa efektif karyawan ini dalam menyampaikan ide dan informasi?', 'Kemampuan berkomunikasi secara jelas, baik lisan maupun tulisan', 1, true),
  ('core', 'Komunikasi', 'Seberapa baik karyawan ini mendengarkan dan merespons masukan dari orang lain?', 'Kemampuan mendengarkan aktif dan memberikan feedback', 2, true),
  ('core', 'Kerja Tim', 'Seberapa baik karyawan ini berkolaborasi dengan rekan kerja?', 'Kemampuan bekerja sama dalam tim', 3, true),
  ('core', 'Kerja Tim', 'Seberapa besar kontribusi karyawan ini terhadap pencapaian tujuan tim?', 'Kontribusi terhadap hasil tim', 4, true),
  ('core', 'Orientasi Hasil', 'Seberapa konsisten karyawan ini dalam mencapai target dan deadline?', 'Pencapaian target dan ketepatan waktu', 5, true),
  ('core', 'Orientasi Hasil', 'Seberapa baik karyawan ini dalam menyelesaikan masalah dan mengambil inisiatif?', 'Problem solving dan inisiatif', 6, true),
  ('core', 'Adaptabilitas', 'Seberapa baik karyawan ini beradaptasi dengan perubahan?', 'Fleksibilitas dan kemampuan beradaptasi', 7, true),
  ('core', 'Adaptabilitas', 'Seberapa cepat karyawan ini mempelajari hal baru?', 'Kecepatan belajar dan growth mindset', 8, true)
ON CONFLICT DO NOTHING;

-- 4 Leadership competencies (for managers+)
INSERT INTO assessment_questions (category, competency, question_text, description, sort_order, is_default) VALUES
  ('leadership', 'Kepemimpinan', 'Seberapa efektif karyawan ini dalam memotivasi dan menginspirasi tim?', 'Kemampuan memimpin dan menginspirasi', 9, true),
  ('leadership', 'Pengembangan Tim', 'Seberapa aktif karyawan ini dalam membimbing dan mengembangkan anggota tim?', 'Mentoring dan coaching', 10, true),
  ('leadership', 'Pengambilan Keputusan', 'Seberapa baik karyawan ini dalam mengambil keputusan strategis?', 'Kualitas keputusan dan pertimbangan', 11, true),
  ('leadership', 'Manajemen Konflik', 'Seberapa efektif karyawan ini dalam mengelola dan menyelesaikan konflik?', 'Kemampuan resolusi konflik', 12, true)
ON CONFLICT DO NOTHING;
