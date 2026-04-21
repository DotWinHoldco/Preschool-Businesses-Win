-- 0056_consent_records.sql
-- @anchor: platform.consent-records
-- FERPA/GDPR consent tracking per family/student with full audit trail.

CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('photo_use','data_sharing','marketing','directory_inclusion','third_party_sharing','field_trip_photo')),
  granted boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  ip_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON consent_records USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_consent_tenant_family ON consent_records(tenant_id, family_id);
CREATE INDEX idx_consent_tenant_student ON consent_records(tenant_id, student_id);

-- Unique constraint for upsert support
CREATE UNIQUE INDEX idx_consent_upsert ON consent_records(tenant_id, family_id, COALESCE(student_id, '00000000-0000-0000-0000-000000000000'::uuid), consent_type);
