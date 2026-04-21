-- 0057_access_log.sql
-- @anchor: platform.access-log
-- FERPA access logging: who viewed, searched, exported, or downloaded student data.

CREATE TABLE IF NOT EXISTS access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  access_type text NOT NULL CHECK (access_type IN ('view','search','export','download')),
  endpoint text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON access_log USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_access_log_entity ON access_log(tenant_id, entity_type, entity_id);
CREATE INDEX idx_access_log_actor ON access_log(tenant_id, actor_id, created_at DESC);
