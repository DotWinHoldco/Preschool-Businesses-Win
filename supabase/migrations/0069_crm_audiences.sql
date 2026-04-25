-- 0069_crm_audiences.sql
-- Saved audience segments. Static lists are manual; dynamic audiences
-- compile a JSON filter tree against contacts and refresh on demand /
-- on a schedule. kanban_enabled exposes the audience as a draggable
-- pipeline keyed by kanban_columns (an ordered list of column labels).

CREATE TABLE IF NOT EXISTS audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('static','dynamic')),
  filter_json jsonb NOT NULL DEFAULT '{"conditions":[],"match":"all"}'::jsonb,
  color text NOT NULL DEFAULT '#3b70b0',
  kanban_enabled boolean NOT NULL DEFAULT false,
  kanban_columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  member_count integer NOT NULL DEFAULT 0,
  last_refreshed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audiences_tenant_slug_unique UNIQUE (tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_audiences_tenant ON audiences(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_audiences_kanban ON audiences(tenant_id) WHERE kanban_enabled;

ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON audiences USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON audiences FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audience_members (
  audience_id uuid NOT NULL REFERENCES audiences(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','rule','csv','automation')),
  kanban_column text,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (audience_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_audience_members_contact ON audience_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_audience_members_tenant ON audience_members(tenant_id, audience_id);
CREATE INDEX IF NOT EXISTS idx_audience_members_kanban ON audience_members(audience_id, kanban_column) WHERE kanban_column IS NOT NULL;

ALTER TABLE audience_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON audience_members USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON audience_members FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION refresh_audience_count(p_audience_id uuid) RETURNS void AS $fn$
BEGIN
  UPDATE audiences SET
    member_count = (SELECT COUNT(*) FROM audience_members WHERE audience_id = p_audience_id),
    last_refreshed_at = now()
  WHERE id = p_audience_id;
END $fn$ LANGUAGE plpgsql SECURITY DEFINER;
