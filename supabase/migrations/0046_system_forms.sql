-- 0046_system_forms.sql
-- @anchor: platform.system-forms
-- System form infrastructure: platform-provided forms that seed per-tenant and allow
-- admin customization without breaking core structure. Enables enrollment form,
-- re-enrollment, medical auth, photo release, field trip permission, etc.

-- Add system form fields to existing forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_system_form boolean NOT NULL DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS system_form_key text;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS parent_form_id uuid REFERENCES forms(id);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS instance_label text;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_amount_cents integer;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_description text DEFAULT 'Application Fee';

-- is_locked and is_system_field already present on form_fields from 0045_form_builder.sql

-- Unique constraint: one primary system form per (tenant, key). Spawned instances have parent_form_id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_system_key_tenant
  ON forms(tenant_id, system_form_key)
  WHERE system_form_key IS NOT NULL AND parent_form_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_forms_parent ON forms(parent_form_id) WHERE parent_form_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forms_system_form ON forms(tenant_id, is_system_form) WHERE is_system_form = true;
