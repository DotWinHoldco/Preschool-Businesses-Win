-- 0044_custom_fields.sql
-- @anchor: platform.custom-fields
-- Custom fields engine: tenant-scoped extensible fields for any entity type.

-- Entity types that support custom fields
CREATE TABLE custom_field_entity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  label text NOT NULL,
  icon text,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, entity_type)
);
ALTER TABLE custom_field_entity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_field_entity_types
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Custom field definitions
CREATE TABLE custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  field_key text NOT NULL,
  label text NOT NULL,
  description text,
  field_type text NOT NULL CHECK (field_type IN (
    'text','textarea','number','currency','date','datetime','boolean',
    'select','multi_select','email','phone','url','file','image',
    'rating','color','json'
  )),
  is_required boolean NOT NULL DEFAULT false,
  is_searchable boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT false,
  is_visible_to_parents boolean NOT NULL DEFAULT false,
  is_parent_editable boolean NOT NULL DEFAULT false,
  default_value jsonb,
  validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  section_label text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, entity_type, field_key)
);
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_fields
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Options for select/multi_select fields
CREATE TABLE custom_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  color text,
  icon text
);
ALTER TABLE custom_field_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_field_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      WHERE cf.id = custom_field_options.custom_field_id
        AND cf.tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- Custom field values (typed columns, one non-null per row)
CREATE TABLE custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  custom_field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date timestamptz,
  value_json jsonb,
  value_file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, custom_field_id, entity_id)
);
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_field_values
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE INDEX idx_cfv_entity ON custom_field_values (tenant_id, entity_type, entity_id);
CREATE INDEX idx_cfv_field ON custom_field_values (tenant_id, custom_field_id);
