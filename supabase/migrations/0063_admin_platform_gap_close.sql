-- 0063_admin_platform_gap_close.sql
-- Closes the gap between admin UI promises and backing tables across
-- curriculum, checklists, compliance, emergency, cameras, doors, drop-in,
-- enrollment, expenses, forms, newsfeed, and audit workflows.
--
-- All tables use RLS with tenant_isolation + service_all policies (matching
-- the pattern established in 0061_portfolio_system.sql).

-- ============================================================
-- 1. CURRICULUM — activity library + standards
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  title text NOT NULL,
  description text,
  subject_area text,
  age_range_min_months integer,
  age_range_max_months integer,
  duration_minutes integer,
  materials text,
  instructions text,
  domain_ids uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE curriculum_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON curriculum_activities
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON curriculum_activities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_curriculum_activities_tenant ON curriculum_activities(tenant_id, is_archived, title);


CREATE TABLE IF NOT EXISTS learning_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  framework text NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  domain_id uuid REFERENCES learning_domains(id),
  age_range_min_months integer,
  age_range_max_months integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, framework, code)
);

ALTER TABLE learning_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON learning_standards
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON learning_standards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_learning_standards_tenant ON learning_standards(tenant_id, framework, code);


CREATE TABLE IF NOT EXISTS lesson_plan_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  lesson_plan_id uuid NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  standard_id uuid NOT NULL REFERENCES learning_standards(id) ON DELETE CASCADE,
  coverage_level text NOT NULL DEFAULT 'introduced' CHECK (coverage_level IN ('introduced','practiced','assessed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_plan_id, standard_id)
);

ALTER TABLE lesson_plan_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON lesson_plan_standards
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON lesson_plan_standards
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS lesson_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  lesson_plan_id uuid NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  title text,
  body text,
  reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_plan_id, day_of_week)
);

ALTER TABLE lesson_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON lesson_plan_days
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON lesson_plan_days
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 2. CHECKLISTS — runs + run items
-- ============================================================

CREATE TABLE IF NOT EXISTS checklist_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  target_entity_type text,
  target_entity_id uuid,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue','skipped')),
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checklist_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON checklist_runs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON checklist_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_checklist_runs_tenant ON checklist_runs(tenant_id, status, due_date);
CREATE INDEX idx_checklist_runs_assignee ON checklist_runs(tenant_id, assigned_to, status);


CREATE TABLE IF NOT EXISTS checklist_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  run_id uuid NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  checked_by uuid REFERENCES auth.users(id),
  notes text,
  photo_path text,
  UNIQUE (run_id, item_id)
);

ALTER TABLE checklist_run_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON checklist_run_items
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON checklist_run_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 3. INCIDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  incident_number text,
  incident_date date NOT NULL,
  incident_time time,
  incident_type text NOT NULL CHECK (incident_type IN ('injury','accident','allegation','behavior','medical','property','other')),
  severity text NOT NULL CHECK (severity IN ('minor','moderate','serious','critical')),
  location text,
  classroom_id uuid REFERENCES classrooms(id),
  title text NOT NULL,
  description text NOT NULL,
  injury_description text,
  treatment_provided text,
  parents_notified boolean NOT NULL DEFAULT false,
  parents_notified_at timestamptz,
  medical_followup_required boolean NOT NULL DEFAULT false,
  medical_followup_notes text,
  state_report_required boolean NOT NULL DEFAULT false,
  state_reported_at timestamptz,
  state_report_reference text,
  reported_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','closed','escalated')),
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON incidents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON incidents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_incidents_tenant ON incidents(tenant_id, incident_date DESC);
CREATE INDEX idx_incidents_status ON incidents(tenant_id, status);


CREATE TABLE IF NOT EXISTS incident_involved (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  party_type text NOT NULL CHECK (party_type IN ('injured_student','injured_staff','witness_student','witness_staff','other')),
  student_id uuid REFERENCES students(id),
  staff_user_id uuid REFERENCES auth.users(id),
  other_name text,
  statement text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_involved ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON incident_involved
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON incident_involved
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS incident_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text,
  attachment_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON incident_attachments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON incident_attachments
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 4. DFPS COMPLIANCE (Texas chapter 746)
-- ============================================================

CREATE TABLE IF NOT EXISTS dfps_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  rule_code text NOT NULL,
  subchapter text,
  category text,
  rule_text text NOT NULL,
  applies_to text[] DEFAULT '{}',
  compliance_status text NOT NULL DEFAULT 'unknown' CHECK (compliance_status IN ('compliant','non_compliant','unknown','na')),
  last_checked_at timestamptz,
  last_checked_by uuid REFERENCES auth.users(id),
  evidence_path text,
  assigned_owner uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, rule_code)
);

ALTER TABLE dfps_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON dfps_standards
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON dfps_standards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_dfps_standards_status ON dfps_standards(tenant_id, compliance_status, category);


CREATE TABLE IF NOT EXISTS dfps_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  inspection_date date NOT NULL,
  inspection_type text CHECK (inspection_type IN ('annual','complaint','follow_up','self_assessment')),
  inspector_name text,
  inspector_agency text,
  result text CHECK (result IN ('pass','conditional','fail','pending')),
  deficiency_count integer DEFAULT 0,
  corrective_action_due_date date,
  follow_up_date date,
  report_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dfps_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON dfps_inspections
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON dfps_inspections
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS dfps_deficiencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  inspection_id uuid NOT NULL REFERENCES dfps_inspections(id) ON DELETE CASCADE,
  standard_id uuid REFERENCES dfps_standards(id),
  rule_code text,
  severity text CHECK (severity IN ('critical','high','medium','low')),
  findings text NOT NULL,
  remediation_due_date date,
  remediation_proof_path text,
  remediation_completed_at timestamptz,
  remediation_completed_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','remediated','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dfps_deficiencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON dfps_deficiencies
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON dfps_deficiencies
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS corrective_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  deficiency_id uuid REFERENCES dfps_deficiencies(id),
  incident_id uuid REFERENCES incidents(id),
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','overdue')),
  completed_at timestamptz,
  evidence_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE corrective_action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON corrective_action_plans
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON corrective_action_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 5. EMERGENCY — drills, muster points, contacts
-- ============================================================

CREATE TABLE IF NOT EXISTS emergency_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  drill_type text NOT NULL CHECK (drill_type IN ('fire','lockdown','shelter_in_place','evacuation','severe_weather','earthquake')),
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  duration_seconds integer,
  participants_count integer,
  students_count integer,
  staff_count integer,
  muster_point_id uuid,
  notes text,
  issues_identified text,
  led_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON emergency_drills
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON emergency_drills
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS emergency_muster_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  location_description text,
  capacity integer,
  floorplan_url text,
  evacuation_procedure text,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_muster_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON emergency_muster_points
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON emergency_muster_points
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  contact_type text NOT NULL CHECK (contact_type IN ('police','fire','ems','poison_control','hospital','cps','licensing','facility_maintenance','other')),
  name text NOT NULL,
  role text,
  phone text NOT NULL,
  phone_alt text,
  email text,
  address text,
  notes text,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON emergency_contacts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON emergency_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 6. CAMERAS & DOORS — extensions
-- ============================================================

CREATE TABLE IF NOT EXISTS camera_motion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  camera_id uuid NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  event_type text CHECK (event_type IN ('motion','person','vehicle','audio','tamper')),
  thumbnail_url text,
  clip_url text,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE camera_motion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON camera_motion_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON camera_motion_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_camera_motion_events_camera ON camera_motion_events(tenant_id, camera_id, detected_at DESC);


CREATE TABLE IF NOT EXISTS access_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  location text,
  door_type text CHECK (door_type IN ('entry','exit','classroom','emergency','playground')),
  lock_type text CHECK (lock_type IN ('magnetic','keypad','rfid','badge','manual')),
  hardware_id text,
  current_status text NOT NULL DEFAULT 'unknown' CHECK (current_status IN ('locked','unlocked','unknown','offline')),
  battery_pct integer,
  last_event_at timestamptz,
  schedule jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE access_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON access_points
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON access_points
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS access_point_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  access_point_id uuid NOT NULL REFERENCES access_points(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('unlock','lock','denied','forced','tailgate','manual_override')),
  actor_user_id uuid REFERENCES auth.users(id),
  actor_label text,
  success boolean NOT NULL DEFAULT true,
  denied_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE access_point_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON access_point_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON access_point_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 7. NEWSFEED — comments
-- ============================================================

CREATE TABLE IF NOT EXISTS newsfeed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  post_id uuid NOT NULL REFERENCES newsfeed_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  parent_comment_id uuid REFERENCES newsfeed_comments(id) ON DELETE CASCADE,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsfeed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON newsfeed_comments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON newsfeed_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_newsfeed_comments_post ON newsfeed_comments(tenant_id, post_id, created_at);


-- ============================================================
-- 8. DROP-IN — sessions + pricing + waivers
-- ============================================================

CREATE TABLE IF NOT EXISTS drop_in_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  classroom_id uuid REFERENCES classrooms(id),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  date date,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drop_in_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON drop_in_sessions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON drop_in_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS drop_in_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  classroom_id uuid REFERENCES classrooms(id),
  age_range_label text NOT NULL,
  age_range_min_months integer,
  age_range_max_months integer,
  full_day_cents integer NOT NULL DEFAULT 0,
  half_day_cents integer NOT NULL DEFAULT 0,
  hourly_cents integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drop_in_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON drop_in_pricing
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON drop_in_pricing
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 9. ENROLLMENT — waitlist offers, documents, deposits, acceptance letters
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
  offered_at timestamptz NOT NULL DEFAULT now(),
  offered_by uuid REFERENCES auth.users(id),
  offer_expires_at timestamptz,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','expired','withdrawn')),
  responded_at timestamptz,
  decline_reason text,
  classroom_id uuid REFERENCES classrooms(id),
  start_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE waitlist_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON waitlist_offers
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON waitlist_offers
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_name text,
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON application_documents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON application_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS enrollment_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invoiced','paid','waived','refunded')),
  invoice_id uuid,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enrollment_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON enrollment_deposits
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON enrollment_deposits
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS acceptance_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id),
  start_date date NOT NULL,
  tuition_summary text,
  body text NOT NULL,
  pdf_path text,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  accepted_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE acceptance_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON acceptance_letters
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON acceptance_letters
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 10. EXPENSES — vendors + approvals + receipts
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  tax_id text,
  default_category_id uuid REFERENCES expense_categories(id),
  payment_terms_days integer,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON vendors
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON vendors
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','changes_requested')),
  approver_id uuid REFERENCES auth.users(id),
  comments text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON expense_approvals
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON expense_approvals
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON expense_receipts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON expense_receipts
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 11. FORMS — response annotations
-- ============================================================

CREATE TABLE IF NOT EXISTS form_response_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  response_id uuid NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','follow_up','reviewed','archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE form_response_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON form_response_annotations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON form_response_annotations
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 12. FAMILY / STAFF extensions
-- ============================================================

CREATE TABLE IF NOT EXISTS family_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_name text,
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE family_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON family_documents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON family_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS pto_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  policy_name text NOT NULL,
  accrued_hours numeric NOT NULL DEFAULT 0,
  used_hours numeric NOT NULL DEFAULT 0,
  pending_hours numeric NOT NULL DEFAULT 0,
  year integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, policy_name, year)
);

ALTER TABLE pto_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON pto_balances
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON pto_balances
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 13. BROADCASTS — message broadcast audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  audience text NOT NULL CHECK (audience IN ('all_parents','all_staff','classroom','custom')),
  classroom_id uuid REFERENCES classrooms(id),
  subject text,
  body text NOT NULL,
  channels text[] NOT NULL DEFAULT '{in_app}',
  recipient_count integer DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON broadcasts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
