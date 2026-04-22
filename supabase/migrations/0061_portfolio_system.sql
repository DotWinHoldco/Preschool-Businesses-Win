-- 0061_portfolio_system.sql
-- Portfolio observations, developmental assessments, and learning domain tracking.

-- ============================================================
-- 1. learning_domains
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  framework text NOT NULL CHECK (framework IN ('texas_prek_guidelines', 'naeyc', 'head_start_elof', 'cca_faith', 'custom')),
  domain_name text NOT NULL,
  subdomain_name text,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, framework, domain_name, subdomain_name)
);

ALTER TABLE learning_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON learning_domains
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON learning_domains
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 2. portfolio_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  entry_type text NOT NULL CHECK (entry_type IN ('observation', 'work_sample', 'photo', 'video', 'learning_story', 'milestone')),
  title text NOT NULL,
  narrative text,
  learning_domains uuid[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'parent' CHECK (visibility IN ('parent', 'staff_only')),
  linked_daily_report_entry_id uuid,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON portfolio_entries
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON portfolio_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_portfolio_entries_student ON portfolio_entries(tenant_id, student_id, created_at DESC);
CREATE INDEX idx_portfolio_entries_type ON portfolio_entries(tenant_id, entry_type);

-- ============================================================
-- 3. portfolio_media
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  entry_id uuid NOT NULL REFERENCES portfolio_entries(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video', 'document')),
  caption text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON portfolio_media
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON portfolio_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 4. developmental_assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS developmental_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  assessor_id uuid NOT NULL REFERENCES auth.users(id),
  assessment_period_start date NOT NULL,
  assessment_period_end date NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'shared_with_parent')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE developmental_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON developmental_assessments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON developmental_assessments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_assessments_student ON developmental_assessments(tenant_id, student_id, assessment_period_start DESC);

-- ============================================================
-- 5. assessment_ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  assessment_id uuid NOT NULL REFERENCES developmental_assessments(id) ON DELETE CASCADE,
  learning_domain_id uuid NOT NULL REFERENCES learning_domains(id),
  rating text NOT NULL CHECK (rating IN ('not_yet', 'emerging', 'developing', 'proficient', 'exceeding')),
  evidence_notes text,
  linked_portfolio_entry_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (assessment_id, learning_domain_id)
);

ALTER TABLE assessment_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON assessment_ratings
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON assessment_ratings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: Learning Domains for CCA tenant
-- ============================================================
DO $$
DECLARE
  cca_id uuid := 'a0a0a0a0-cca0-4000-8000-000000000001';
BEGIN

  -- Texas Pre-K Guidelines — Math & Logic
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Math & Logic', 'Number Concepts',          1),
    (cca_id, 'texas_prek_guidelines', 'Math & Logic', 'Patterns & Classification', 2),
    (cca_id, 'texas_prek_guidelines', 'Math & Logic', 'Geometry & Spatial',        3),
    (cca_id, 'texas_prek_guidelines', 'Math & Logic', 'Measurement',               4);

  -- Texas Pre-K Guidelines — Social-Emotional
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Social-Emotional', 'Self-Awareness',        1),
    (cca_id, 'texas_prek_guidelines', 'Social-Emotional', 'Social Relationships',  2),
    (cca_id, 'texas_prek_guidelines', 'Social-Emotional', 'Self-Regulation',       3);

  -- Texas Pre-K Guidelines — Literacy
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Literacy', 'Letter Knowledge',         1),
    (cca_id, 'texas_prek_guidelines', 'Literacy', 'Print Awareness',          2),
    (cca_id, 'texas_prek_guidelines', 'Literacy', 'Phonological Awareness',   3),
    (cca_id, 'texas_prek_guidelines', 'Literacy', 'Comprehension',            4);

  -- Texas Pre-K Guidelines — Physical Development
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Physical Development', 'Gross Motor',       1),
    (cca_id, 'texas_prek_guidelines', 'Physical Development', 'Fine Motor',        2),
    (cca_id, 'texas_prek_guidelines', 'Physical Development', 'Health & Safety',   3);

  -- Texas Pre-K Guidelines — Creative Arts
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Creative Arts', 'Visual Arts',        1),
    (cca_id, 'texas_prek_guidelines', 'Creative Arts', 'Music & Movement',   2),
    (cca_id, 'texas_prek_guidelines', 'Creative Arts', 'Dramatic Play',      3);

  -- Texas Pre-K Guidelines — Science & Nature
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'texas_prek_guidelines', 'Science & Nature', 'Scientific Inquiry',    1),
    (cca_id, 'texas_prek_guidelines', 'Science & Nature', 'Earth & Environment',   2),
    (cca_id, 'texas_prek_guidelines', 'Science & Nature', 'Living Things',         3);

  -- CCA Faith framework
  INSERT INTO learning_domains (tenant_id, framework, domain_name, subdomain_name, sort_order) VALUES
    (cca_id, 'cca_faith', 'Faith Development', 'Bible Stories',       1),
    (cca_id, 'cca_faith', 'Faith Development', 'Prayer & Worship',    2),
    (cca_id, 'cca_faith', 'Faith Development', 'Christian Values',    3);

END $$;
