-- 0045_form_builder.sql
-- @anchor: platform.form-builder
-- Form builder engine: tenant-scoped forms with conversational/document modes,
-- logic engine, e-signatures, payment, and submission actions.

-- Form definitions
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  mode text NOT NULL DEFAULT 'conversational' CHECK (mode IN ('conversational','document')),
  theme_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  header_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  footer_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  background_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  access_control text NOT NULL DEFAULT 'public' CHECK (access_control IN ('public','authenticated','role_restricted','tokenized')),
  allowed_roles text[],
  custom_css text,
  seo_title text,
  seo_description text,
  seo_image_path text,
  thank_you_title text DEFAULT 'Thank you!',
  thank_you_message text DEFAULT 'Your response has been submitted.',
  thank_you_redirect_url text,
  allow_response_edit boolean NOT NULL DEFAULT false,
  response_edit_deadline_hours integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (tenant_id, slug)
);
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON forms
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "public_read" ON forms
  FOR SELECT USING (status = 'published' AND access_control = 'public');

-- Form sections (page/section grouping)
CREATE TABLE form_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  title text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  page_number integer NOT NULL DEFAULT 1,
  logic_rules jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_form" ON form_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_sections.form_id
      AND f.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Form fields
CREATE TABLE form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  section_id uuid REFERENCES form_sections(id) ON DELETE SET NULL,
  field_key text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN (
    'short_text','long_text','rich_text','email','phone','url','number','currency',
    'single_select_dropdown','single_select_radio','multi_select_checkbox',
    'image_choice','button_group','rating','opinion_scale','nps','yes_no','legal_acceptance',
    'date','time','datetime','date_range','appointment_slot',
    'file_upload','image_upload','video_embed','signature_pad',
    'section_header','description_block','divider','image_banner','video_banner','spacer',
    'payment_stripe','calculator','hidden_field','address_autocomplete',
    'matrix_grid','ranking','slider',
    'entity_lookup','custom_field_value','dynamic_select',
    'repeater_group'
  )),
  label text,
  description text,
  placeholder text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  logic_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  prefill_source text,
  sort_order integer NOT NULL DEFAULT 0,
  page_number integer NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_system_field boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_form" ON form_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_fields.form_id
      AND f.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Named variables (formulas referencing fields)
CREATE TABLE form_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  name text NOT NULL,
  formula text NOT NULL,
  referenced_fields uuid[] NOT NULL DEFAULT '{}',
  UNIQUE (form_id, name)
);
ALTER TABLE form_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_form" ON form_variables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_variables.form_id
      AND f.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Form responses (submissions)
CREATE TABLE form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  respondent_user_id uuid,
  respondent_email text,
  respondent_name text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'draft','in_progress','awaiting_signature','completed','expired'
  )),
  linked_entity_type text,
  linked_entity_id uuid,
  ip_address text,
  user_agent text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON form_responses
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Per-field response values
CREATE TABLE form_response_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date timestamptz,
  value_json jsonb,
  value_file_path text,
  signature_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (response_id, field_id)
);
ALTER TABLE form_response_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_response" ON form_response_values
  FOR ALL USING (
    EXISTS (SELECT 1 FROM form_responses fr WHERE fr.id = form_response_values.response_id
      AND fr.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Auto-save drafts (for partial form completion + resume)
CREATE TABLE form_response_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  resume_token text UNIQUE,
  respondent_user_id uuid,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_response_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON form_response_drafts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- E-signature requests (multi-signer workflow)
CREATE TABLE form_signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','viewed','signed','declined','expired')),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  signed_at timestamptz,
  signer_ip text,
  content_hash text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_signature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_response" ON form_signature_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM form_responses fr WHERE fr.id = form_signature_requests.response_id
      AND fr.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Post-submission actions
CREATE TABLE form_submission_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'store','write_entity','create_entity','notify','webhook',
    'stripe_charge','generate_pdf','assign_checklist','update_custom_field'
  )),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_submission_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_via_form" ON form_submission_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_submission_actions.form_id
      AND f.tenant_id = current_setting('app.tenant_id', true)::uuid)
  );

-- Form templates (platform-level + tenant-level)
CREATE TABLE form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  snapshot jsonb NOT NULL,
  is_platform boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_or_tenant" ON form_templates
  FOR SELECT USING (
    is_platform = true
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
CREATE POLICY "tenant_write" ON form_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
