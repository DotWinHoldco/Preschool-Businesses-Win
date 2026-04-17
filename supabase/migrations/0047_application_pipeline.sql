-- 0047_application_pipeline.sql
-- @anchor: cca.applications.pipeline
-- Multi-step application pipeline for enrollment: form_submitted → under_review →
-- interview_invited → interview_scheduled → interview_completed → offer_sent →
-- offer_accepted → enrolled (with waitlist/reject/withdraw branches).

CREATE TABLE application_pipeline_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
  step_type text NOT NULL CHECK (step_type IN (
    'form_submitted','under_review','info_requested',
    'interview_invited','interview_scheduled','interview_completed',
    'offer_sent','offer_accepted','enrolled',
    'waitlisted','rejected','withdrawn'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','skipped')),
  assigned_to uuid,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_steps_app ON application_pipeline_steps(application_id);
CREATE INDEX idx_pipeline_steps_tenant ON application_pipeline_steps(tenant_id, step_type);

ALTER TABLE application_pipeline_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON application_pipeline_steps
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Pipeline columns on enrollment_applications
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'form_submitted';
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_scheduled_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_completed_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_notes text;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS offer_sent_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS offer_accepted_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS form_response_id uuid;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS application_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS student_gender text;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS child_index integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_enrollment_apps_pipeline ON enrollment_applications(tenant_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_enrollment_apps_form_response ON enrollment_applications(form_response_id) WHERE form_response_id IS NOT NULL;
