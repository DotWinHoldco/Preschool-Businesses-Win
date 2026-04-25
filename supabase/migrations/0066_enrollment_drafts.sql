-- 0066_enrollment_drafts.sql
-- Server-backed in-progress enrollment applications. Captures partially-
-- filled forms so families can resume from any device via a magic link, and
-- so admins can chase abandoned applications from the leads workflow.

CREATE TABLE IF NOT EXISTS enrollment_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  form_id uuid REFERENCES forms(id),
  parent_email text NOT NULL,
  parent_first_name text,
  parent_last_name text,
  parent_phone text,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  resume_token text NOT NULL UNIQUE,
  magic_link_sent_at timestamptz,
  magic_link_send_count integer NOT NULL DEFAULT 0,
  resumed_at timestamptz,
  abandoned_notification_sent_at timestamptz,
  submitted_at timestamptz,
  application_id uuid REFERENCES enrollment_applications(id),
  analytics_visitor_id text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  UNIQUE (tenant_id, parent_email)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_tenant_updated
  ON enrollment_drafts(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_resume_token
  ON enrollment_drafts(resume_token);
CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_tenant_email
  ON enrollment_drafts(tenant_id, parent_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_abandoned
  ON enrollment_drafts(tenant_id, updated_at)
  WHERE submitted_at IS NULL AND abandoned_notification_sent_at IS NULL;

ALTER TABLE enrollment_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON enrollment_drafts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON enrollment_drafts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
