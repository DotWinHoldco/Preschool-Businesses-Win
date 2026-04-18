-- Add parent_user_id to link enrollment applications to auth users
ALTER TABLE enrollment_applications
  ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_enrollment_apps_parent_user
  ON enrollment_applications(parent_user_id)
  WHERE parent_user_id IS NOT NULL;

-- Expand role CHECK to allow applicant_parent
ALTER TABLE user_tenant_memberships
  DROP CONSTRAINT IF EXISTS user_tenant_memberships_role_check;

ALTER TABLE user_tenant_memberships
  ADD CONSTRAINT user_tenant_memberships_role_check
  CHECK (role IN (
    'owner', 'admin', 'director', 'lead_teacher', 'assistant_teacher',
    'aide', 'front_desk', 'parent', 'applicant_parent'
  ));

-- RLS: applicant parents can read their own applications
CREATE POLICY "applicant_parent_read_own_applications"
  ON enrollment_applications FOR SELECT
  USING (parent_user_id = auth.uid());

-- RLS: applicant parents can read pipeline steps for their own applications
CREATE POLICY "applicant_parent_read_own_steps"
  ON application_pipeline_steps FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM enrollment_applications
      WHERE parent_user_id = auth.uid()
    )
  );
