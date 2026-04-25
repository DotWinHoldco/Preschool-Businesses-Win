-- 0068_crm_contacts_foundation.sql
-- Unified contact identity. One row per person per tenant, surviving the
-- entire lifecycle: subscriber → lead → opportunity → applicant →
-- enrolled_parent → alumni_parent (and parallel staff identity).
-- Replaces the fragmented enrollment_leads / family_members / staff_profiles
-- triple-identity with a single CRM spine while keeping those tables intact
-- as authoritative role-records.

-- ============================================================
-- 1. Enums
-- ============================================================

DO $$ BEGIN
  CREATE TYPE contact_lifecycle_stage AS ENUM (
    'subscriber',
    'lead',
    'opportunity',
    'applicant',
    'enrolled_parent',
    'alumni_parent',
    'staff',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contact_source AS ENUM (
    'website_form',
    'enrollment_form',
    'newsletter',
    'tour_request',
    'phone_inquiry',
    'walk_in',
    'referral',
    'event',
    'facebook',
    'instagram',
    'google',
    'tiktok',
    'manual_admin',
    'imported',
    'staff_onboarding',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contact_activity_type AS ENUM (
    'created',
    'lifecycle_changed',
    'tag_added',
    'tag_removed',
    'note_added',
    'owner_assigned',
    'merged',
    'lead_created',
    'lead_status_changed',
    'application_submitted',
    'application_approved',
    'application_rejected',
    'tour_booked',
    'tour_completed',
    'tour_no_show',
    'enrollment_completed',
    'enrollment_classroom_assigned',
    'enrollment_unenrolled',
    'email_sent',
    'email_delivered',
    'email_opened',
    'email_clicked',
    'email_bounced',
    'email_complained',
    'email_unsubscribed',
    'sms_sent',
    'sms_replied',
    'page_view',
    'form_started',
    'form_abandoned',
    'form_submitted',
    'call_logged',
    'meeting_logged',
    'campaign_enrolled',
    'campaign_completed',
    'audience_added',
    'audience_removed',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. contacts
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),

  -- Identity
  email text,
  email_normalized text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone text,
  first_name text,
  last_name text,
  full_name text GENERATED ALWAYS AS (
    NULLIF(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
  ) STORED,

  -- Lifecycle
  lifecycle_stage contact_lifecycle_stage NOT NULL DEFAULT 'subscriber',
  lifecycle_changed_at timestamptz NOT NULL DEFAULT now(),

  -- Attribution
  source contact_source NOT NULL DEFAULT 'manual_admin',
  source_detail text,
  utm_source_first text,
  utm_medium_first text,
  utm_campaign_first text,
  utm_content_first text,
  utm_term_first text,
  utm_source_last text,
  utm_medium_last text,
  utm_campaign_last text,
  referrer_first text,

  -- Linked authoritative role records
  primary_lead_id uuid REFERENCES enrollment_leads(id),
  primary_application_id uuid REFERENCES enrollment_applications(id),
  family_id uuid REFERENCES families(id),
  family_member_id uuid REFERENCES family_members(id),
  staff_user_id uuid REFERENCES auth.users(id),

  -- Ownership
  owner_user_id uuid REFERENCES auth.users(id),

  -- Engagement
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  last_contacted_at timestamptz,

  -- Email subscription state (suppression list lives separately)
  email_subscribed boolean NOT NULL DEFAULT true,
  email_unsubscribed_at timestamptz,
  email_unsubscribe_reason text,

  -- Extensibility
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,

  -- Soft-delete + dedup
  deleted_at timestamptz,
  merged_into_id uuid REFERENCES contacts(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One contact per email per tenant (NULL emails coexist for SMS-only).
  CONSTRAINT contacts_tenant_email_unique UNIQUE (tenant_id, email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_lifecycle
  ON contacts(tenant_id, lifecycle_stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_owner
  ON contacts(tenant_id, owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_last_activity
  ON contacts(tenant_id, last_activity_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email
  ON contacts(tenant_id, email_normalized) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone
  ON contacts(tenant_id, phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_source
  ON contacts(tenant_id, source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_lead
  ON contacts(primary_lead_id) WHERE primary_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_application
  ON contacts(primary_application_id) WHERE primary_application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_family
  ON contacts(family_id) WHERE family_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_staff
  ON contacts(staff_user_id) WHERE staff_user_id IS NOT NULL;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contacts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 3. contact_tags + assignments
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  slug text NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#3b70b0',
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_tags_tenant_slug_unique UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_tenant
  ON contact_tags(tenant_id, label);

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contact_tags
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON contact_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag
  ON contact_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tenant
  ON contact_tag_assignments(tenant_id, contact_id);

ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contact_tag_assignments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON contact_tag_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 4. contact_activities (unified timeline)
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type contact_activity_type NOT NULL,
  title text NOT NULL,
  body text,
  actor_user_id uuid REFERENCES auth.users(id),
  related_entity_type text,
  related_entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_occurred
  ON contact_activities(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activities_tenant_type_occurred
  ON contact_activities(tenant_id, activity_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activities_related
  ON contact_activities(related_entity_type, related_entity_id)
  WHERE related_entity_type IS NOT NULL;

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contact_activities
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON contact_activities
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 5. ensure_contact_for_email — idempotent upsert helper
-- ============================================================

-- Looks up or creates a contact for (tenant, email). Updates name/phone/
-- source attribution if they're stronger than what's stored. Returns the
-- contact id. SECURITY DEFINER so triggers can call it without RLS hassle.

CREATE OR REPLACE FUNCTION ensure_contact_for_email(
  p_tenant_id uuid,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_source contact_source DEFAULT NULL,
  p_source_detail text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_referrer text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_email_norm text := lower(trim(p_email));
  v_id uuid;
  v_existing contacts%ROWTYPE;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' OR position('@' in v_email_norm) = 0 THEN
    RAISE EXCEPTION 'ensure_contact_for_email requires a valid email';
  END IF;

  SELECT * INTO v_existing
  FROM contacts
  WHERE tenant_id = p_tenant_id AND email_normalized = v_email_norm AND deleted_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    UPDATE contacts SET
      first_name = COALESCE(NULLIF(trim(p_first_name), ''), first_name),
      last_name = COALESCE(NULLIF(trim(p_last_name), ''), last_name),
      phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
      utm_source_last = COALESCE(p_utm_source, utm_source_last),
      utm_medium_last = COALESCE(p_utm_medium, utm_medium_last),
      utm_campaign_last = COALESCE(p_utm_campaign, utm_campaign_last),
      utm_source_first = COALESCE(utm_source_first, p_utm_source),
      utm_medium_first = COALESCE(utm_medium_first, p_utm_medium),
      utm_campaign_first = COALESCE(utm_campaign_first, p_utm_campaign),
      referrer_first = COALESCE(referrer_first, p_referrer),
      last_activity_at = now(),
      updated_at = now()
    WHERE id = v_existing.id;
    RETURN v_existing.id;
  END IF;

  INSERT INTO contacts (
    tenant_id, email, first_name, last_name, phone,
    source, source_detail,
    utm_source_first, utm_medium_first, utm_campaign_first, referrer_first,
    utm_source_last, utm_medium_last, utm_campaign_last
  ) VALUES (
    p_tenant_id, v_email_norm,
    NULLIF(trim(p_first_name), ''),
    NULLIF(trim(p_last_name), ''),
    NULLIF(trim(p_phone), ''),
    COALESCE(p_source, 'manual_admin'::contact_source), p_source_detail,
    p_utm_source, p_utm_medium, p_utm_campaign, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign
  )
  RETURNING id INTO v_id;

  INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, payload)
  VALUES (
    p_tenant_id, v_id, 'created',
    'Contact created' || COALESCE(' from ' || p_source::text, ''),
    jsonb_build_object('source', p_source, 'source_detail', p_source_detail)
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Same idea but for phone-only (SMS-only) contacts.
CREATE OR REPLACE FUNCTION ensure_contact_for_phone(
  p_tenant_id uuid,
  p_phone text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_source contact_source DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
  v_id uuid;
  v_existing contacts%ROWTYPE;
BEGIN
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'ensure_contact_for_phone requires a phone';
  END IF;

  SELECT * INTO v_existing
  FROM contacts
  WHERE tenant_id = p_tenant_id AND phone = v_phone AND email IS NULL AND deleted_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    UPDATE contacts SET
      first_name = COALESCE(NULLIF(trim(p_first_name), ''), first_name),
      last_name = COALESCE(NULLIF(trim(p_last_name), ''), last_name),
      last_activity_at = now(),
      updated_at = now()
    WHERE id = v_existing.id;
    RETURN v_existing.id;
  END IF;

  INSERT INTO contacts (
    tenant_id, phone, first_name, last_name, source
  ) VALUES (
    p_tenant_id, v_phone,
    NULLIF(trim(p_first_name), ''),
    NULLIF(trim(p_last_name), ''),
    COALESCE(p_source, 'manual_admin'::contact_source)
  )
  RETURNING id INTO v_id;

  INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title)
  VALUES (p_tenant_id, v_id, 'created', 'Contact created (SMS-only)');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Bump lifecycle only forward in the canonical ladder.
CREATE OR REPLACE FUNCTION advance_contact_lifecycle(
  p_contact_id uuid,
  p_target contact_lifecycle_stage
) RETURNS void AS $$
DECLARE
  v_rank int[] := ARRAY[1, 2, 3, 4, 5, 6, 7, 8];
  v_current contact_lifecycle_stage;
  v_current_rank int;
  v_target_rank int;
  v_tenant uuid;
BEGIN
  SELECT lifecycle_stage, tenant_id INTO v_current, v_tenant
  FROM contacts WHERE id = p_contact_id;

  IF NOT FOUND THEN RETURN; END IF;

  v_current_rank := CASE v_current
    WHEN 'subscriber' THEN 1
    WHEN 'lead' THEN 2
    WHEN 'opportunity' THEN 3
    WHEN 'applicant' THEN 4
    WHEN 'enrolled_parent' THEN 5
    WHEN 'alumni_parent' THEN 6
    WHEN 'staff' THEN 7
    ELSE 8
  END;
  v_target_rank := CASE p_target
    WHEN 'subscriber' THEN 1
    WHEN 'lead' THEN 2
    WHEN 'opportunity' THEN 3
    WHEN 'applicant' THEN 4
    WHEN 'enrolled_parent' THEN 5
    WHEN 'alumni_parent' THEN 6
    WHEN 'staff' THEN 7
    ELSE 8
  END;

  -- Staff is parallel; allow setting alongside parent stages without overwriting.
  IF v_target_rank > v_current_rank OR p_target = 'staff' THEN
    UPDATE contacts SET
      lifecycle_stage = p_target,
      lifecycle_changed_at = now(),
      updated_at = now()
    WHERE id = p_contact_id AND lifecycle_stage <> p_target;

    IF FOUND THEN
      INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, payload)
      VALUES (
        v_tenant, p_contact_id, 'lifecycle_changed',
        'Lifecycle: ' || v_current::text || ' → ' || p_target::text,
        jsonb_build_object('from', v_current, 'to', p_target)
      );
    END IF;
  END IF;

  -- Touch lifecycle marker even on no-op so we don't lose the ignored attempt.
  -- (no-op if already at higher stage)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. Sync triggers — keep contacts in lock-step with role records
-- ============================================================

-- enrollment_leads → contacts
CREATE OR REPLACE FUNCTION sync_contact_from_lead() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
  v_source contact_source;
BEGIN
  IF NEW.parent_email IS NULL OR position('@' in NEW.parent_email) = 0 THEN
    RETURN NEW;
  END IF;

  v_source := CASE NEW.source
    WHEN 'website' THEN 'website_form'::contact_source
    WHEN 'phone' THEN 'phone_inquiry'::contact_source
    WHEN 'walk_in' THEN 'walk_in'::contact_source
    WHEN 'referral' THEN 'referral'::contact_source
    WHEN 'event' THEN 'event'::contact_source
    WHEN 'facebook' THEN 'facebook'::contact_source
    WHEN 'google' THEN 'google'::contact_source
    WHEN 'instagram' THEN 'instagram'::contact_source
    WHEN 'tiktok' THEN 'tiktok'::contact_source
    ELSE 'website_form'::contact_source
  END;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := NEW.parent_email,
    p_first_name := NEW.parent_first_name,
    p_last_name := NEW.parent_last_name,
    p_phone := NEW.parent_phone,
    p_source := v_source,
    p_source_detail := NEW.source_detail,
    p_utm_source := NEW.utm_source,
    p_utm_medium := NEW.utm_medium,
    p_utm_campaign := NEW.utm_campaign
  );

  UPDATE contacts SET
    primary_lead_id = COALESCE(primary_lead_id, NEW.id),
    last_activity_at = now()
  WHERE id = v_contact_id;

  PERFORM advance_contact_lifecycle(v_contact_id, 'lead'::contact_lifecycle_stage);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, related_entity_type, related_entity_id, payload)
    VALUES (
      NEW.tenant_id, v_contact_id, 'lead_created',
      'New lead: ' || COALESCE(NEW.source, 'unknown source'),
      'enrollment_lead', NEW.id,
      jsonb_build_object('source', NEW.source, 'priority', NEW.priority)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, related_entity_type, related_entity_id, payload)
    VALUES (
      NEW.tenant_id, v_contact_id, 'lead_status_changed',
      'Lead status: ' || OLD.status || ' → ' || NEW.status,
      'enrollment_lead', NEW.id,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_lead_trg ON enrollment_leads;
CREATE TRIGGER sync_contact_from_lead_trg
  AFTER INSERT OR UPDATE ON enrollment_leads
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_lead();


-- enrollment_applications → contacts
CREATE OR REPLACE FUNCTION sync_contact_from_application() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  IF NEW.parent_email IS NULL OR position('@' in NEW.parent_email) = 0 THEN
    RETURN NEW;
  END IF;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := NEW.parent_email,
    p_first_name := NEW.parent_first_name,
    p_last_name := NEW.parent_last_name,
    p_phone := NEW.parent_phone,
    p_source := 'enrollment_form'::contact_source
  );

  UPDATE contacts SET
    primary_application_id = COALESCE(primary_application_id, NEW.id),
    last_activity_at = now()
  WHERE id = v_contact_id;

  PERFORM advance_contact_lifecycle(v_contact_id, 'applicant'::contact_lifecycle_stage);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, related_entity_type, related_entity_id)
    VALUES (
      NEW.tenant_id, v_contact_id, 'application_submitted',
      'Submitted enrollment application',
      'enrollment_application', NEW.id
    );
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_application_trg ON enrollment_applications;
CREATE TRIGGER sync_contact_from_application_trg
  AFTER INSERT OR UPDATE ON enrollment_applications
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_application();


-- family_members → contacts (parents)
CREATE OR REPLACE FUNCTION sync_contact_from_family_member() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  -- Only parent-style relationships seed contacts. Pickup-only contacts
  -- do not become first-class CRM records by default.
  IF NEW.relationship_type IS NULL OR NEW.relationship_type NOT IN (
    'mother', 'father', 'parent', 'guardian', 'step_parent', 'grandparent'
  ) THEN
    RETURN NEW;
  END IF;
  IF NEW.email IS NULL OR position('@' in NEW.email) = 0 THEN
    RETURN NEW;
  END IF;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := NEW.email,
    p_first_name := NEW.first_name,
    p_last_name := NEW.last_name,
    p_phone := NEW.phone,
    p_source := 'enrollment_form'::contact_source
  );

  UPDATE contacts SET
    family_id = COALESCE(family_id, NEW.family_id),
    family_member_id = COALESCE(family_member_id, NEW.id),
    last_activity_at = now()
  WHERE id = v_contact_id;

  PERFORM advance_contact_lifecycle(v_contact_id, 'enrolled_parent'::contact_lifecycle_stage);

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_family_member_trg ON family_members;
CREATE TRIGGER sync_contact_from_family_member_trg
  AFTER INSERT OR UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_family_member();


-- staff_profiles → contacts
CREATE OR REPLACE FUNCTION sync_contact_from_staff() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
  v_email text;
  v_first text;
  v_last text;
  v_phone text;
BEGIN
  SELECT u.email,
         u.raw_user_meta_data->>'first_name',
         u.raw_user_meta_data->>'last_name',
         u.raw_user_meta_data->>'phone'
  INTO v_email, v_first, v_last, v_phone
  FROM auth.users u WHERE u.id = NEW.user_id;

  IF v_email IS NULL OR position('@' in v_email) = 0 THEN
    RETURN NEW;
  END IF;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := v_email,
    p_first_name := v_first,
    p_last_name := v_last,
    p_phone := v_phone,
    p_source := 'staff_onboarding'::contact_source
  );

  UPDATE contacts SET
    staff_user_id = COALESCE(staff_user_id, NEW.user_id),
    last_activity_at = now()
  WHERE id = v_contact_id;

  PERFORM advance_contact_lifecycle(v_contact_id, 'staff'::contact_lifecycle_stage);

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_staff_trg ON staff_profiles;
CREATE TRIGGER sync_contact_from_staff_trg
  AFTER INSERT OR UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_staff();


-- newsletter_subscribers → contacts
CREATE OR REPLACE FUNCTION sync_contact_from_newsletter() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  IF NEW.email IS NULL OR position('@' in NEW.email) = 0 THEN
    RETURN NEW;
  END IF;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := NEW.email,
    p_source := 'newsletter'::contact_source,
    p_source_detail := NEW.source_page
  );

  -- Newsletter subscribe is the gentlest signal — leave at 'subscriber' if not already higher.
  IF NEW.unsubscribed_at IS NOT NULL THEN
    UPDATE contacts SET
      email_subscribed = false,
      email_unsubscribed_at = NEW.unsubscribed_at,
      email_unsubscribe_reason = COALESCE(email_unsubscribe_reason, 'newsletter_unsubscribed')
    WHERE id = v_contact_id;
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_newsletter_trg ON newsletter_subscribers;
CREATE TRIGGER sync_contact_from_newsletter_trg
  AFTER INSERT OR UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_newsletter();


-- enrollment_drafts → contacts (the moment we get an email, they're a contact)
CREATE OR REPLACE FUNCTION sync_contact_from_draft() RETURNS trigger AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  IF NEW.parent_email IS NULL OR position('@' in NEW.parent_email) = 0 THEN
    RETURN NEW;
  END IF;

  v_contact_id := ensure_contact_for_email(
    p_tenant_id := NEW.tenant_id,
    p_email := NEW.parent_email,
    p_first_name := NEW.parent_first_name,
    p_last_name := NEW.parent_last_name,
    p_phone := NEW.parent_phone,
    p_source := 'enrollment_form'::contact_source,
    p_source_detail := NEW.source
  );

  PERFORM advance_contact_lifecycle(v_contact_id, 'lead'::contact_lifecycle_stage);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, related_entity_type, related_entity_id)
    VALUES (
      NEW.tenant_id, v_contact_id, 'form_started',
      'Started an enrollment application',
      'enrollment_draft', NEW.id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, related_entity_type, related_entity_id)
    VALUES (
      NEW.tenant_id, v_contact_id, 'form_submitted',
      'Submitted enrollment application',
      'enrollment_draft', NEW.id
    );
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_contact_from_draft_trg ON enrollment_drafts;
CREATE TRIGGER sync_contact_from_draft_trg
  AFTER INSERT OR UPDATE ON enrollment_drafts
  FOR EACH ROW EXECUTE FUNCTION sync_contact_from_draft();


-- ============================================================
-- 7. updated_at touch trigger on contacts
-- ============================================================

CREATE OR REPLACE FUNCTION touch_contact_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_contacts_updated_at_trg ON contacts;
CREATE TRIGGER touch_contacts_updated_at_trg
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION touch_contact_updated_at();


-- ============================================================
-- 8. Backfill existing data
-- ============================================================

-- Leads
INSERT INTO contacts (tenant_id, email, first_name, last_name, phone, source, source_detail,
                      utm_source_first, utm_medium_first, utm_campaign_first,
                      utm_source_last, utm_medium_last, utm_campaign_last,
                      lifecycle_stage, primary_lead_id, first_seen_at, last_activity_at)
SELECT
  l.tenant_id,
  lower(trim(l.parent_email)),
  l.parent_first_name,
  l.parent_last_name,
  l.parent_phone,
  CASE l.source
    WHEN 'website' THEN 'website_form'::contact_source
    WHEN 'phone' THEN 'phone_inquiry'::contact_source
    WHEN 'walk_in' THEN 'walk_in'::contact_source
    WHEN 'referral' THEN 'referral'::contact_source
    WHEN 'event' THEN 'event'::contact_source
    WHEN 'facebook' THEN 'facebook'::contact_source
    WHEN 'google' THEN 'google'::contact_source
    WHEN 'instagram' THEN 'instagram'::contact_source
    WHEN 'tiktok' THEN 'tiktok'::contact_source
    ELSE 'manual_admin'::contact_source
  END,
  l.source_detail,
  l.utm_source, l.utm_medium, l.utm_campaign,
  l.utm_source, l.utm_medium, l.utm_campaign,
  CASE l.status
    WHEN 'enrolled' THEN 'enrolled_parent'::contact_lifecycle_stage
    WHEN 'application_received' THEN 'applicant'::contact_lifecycle_stage
    WHEN 'tour_completed' THEN 'opportunity'::contact_lifecycle_stage
    WHEN 'tour_scheduled' THEN 'opportunity'::contact_lifecycle_stage
    WHEN 'lost' THEN 'lead'::contact_lifecycle_stage
    WHEN 'nurture' THEN 'lead'::contact_lifecycle_stage
    ELSE 'lead'::contact_lifecycle_stage
  END,
  l.id,
  l.created_at,
  COALESCE(l.updated_at, l.created_at)
FROM enrollment_leads l
WHERE l.parent_email IS NOT NULL
  AND position('@' in l.parent_email) > 0
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = l.tenant_id
      AND c.email_normalized = lower(trim(l.parent_email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Applications: link + advance lifecycle
UPDATE contacts c SET
  primary_application_id = a.id,
  lifecycle_stage = CASE
    WHEN c.lifecycle_stage IN ('subscriber', 'lead', 'opportunity') THEN 'applicant'::contact_lifecycle_stage
    ELSE c.lifecycle_stage
  END
FROM enrollment_applications a
WHERE a.parent_email IS NOT NULL
  AND lower(trim(a.parent_email)) = c.email_normalized
  AND a.tenant_id = c.tenant_id
  AND c.primary_application_id IS NULL;

INSERT INTO contacts (tenant_id, email, first_name, last_name, phone, source,
                      lifecycle_stage, primary_application_id, first_seen_at, last_activity_at)
SELECT
  a.tenant_id, lower(trim(a.parent_email)),
  a.parent_first_name, a.parent_last_name, a.parent_phone,
  'enrollment_form'::contact_source,
  'applicant'::contact_lifecycle_stage,
  a.id, a.created_at, COALESCE(a.updated_at, a.created_at)
FROM enrollment_applications a
WHERE a.parent_email IS NOT NULL
  AND position('@' in a.parent_email) > 0
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = a.tenant_id AND c.email_normalized = lower(trim(a.parent_email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Family members (parents)
UPDATE contacts c SET
  family_id = fm.family_id,
  family_member_id = fm.id,
  lifecycle_stage = CASE
    WHEN c.lifecycle_stage IN ('subscriber', 'lead', 'opportunity', 'applicant') THEN 'enrolled_parent'::contact_lifecycle_stage
    ELSE c.lifecycle_stage
  END
FROM family_members fm
WHERE fm.email IS NOT NULL
  AND lower(trim(fm.email)) = c.email_normalized
  AND fm.tenant_id = c.tenant_id
  AND c.family_member_id IS NULL
  AND fm.relationship_type IN ('mother', 'father', 'parent', 'guardian', 'step_parent', 'grandparent');

INSERT INTO contacts (tenant_id, email, first_name, last_name, phone, source,
                      lifecycle_stage, family_id, family_member_id, first_seen_at, last_activity_at)
SELECT
  fm.tenant_id, lower(trim(fm.email)),
  fm.first_name, fm.last_name, fm.phone,
  'enrollment_form'::contact_source,
  'enrolled_parent'::contact_lifecycle_stage,
  fm.family_id, fm.id, fm.created_at, fm.created_at
FROM family_members fm
WHERE fm.email IS NOT NULL
  AND position('@' in fm.email) > 0
  AND fm.relationship_type IN ('mother', 'father', 'parent', 'guardian', 'step_parent', 'grandparent')
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = fm.tenant_id AND c.email_normalized = lower(trim(fm.email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Staff
UPDATE contacts c SET
  staff_user_id = sp.user_id,
  lifecycle_stage = CASE WHEN c.lifecycle_stage = 'subscriber' THEN 'staff'::contact_lifecycle_stage ELSE c.lifecycle_stage END
FROM staff_profiles sp
JOIN auth.users u ON u.id = sp.user_id
WHERE u.email IS NOT NULL
  AND lower(trim(u.email)) = c.email_normalized
  AND sp.tenant_id = c.tenant_id
  AND c.staff_user_id IS NULL;

INSERT INTO contacts (tenant_id, email, first_name, last_name, phone, source,
                      lifecycle_stage, staff_user_id, first_seen_at, last_activity_at)
SELECT
  sp.tenant_id, lower(trim(u.email)),
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  u.raw_user_meta_data->>'phone',
  'staff_onboarding'::contact_source,
  'staff'::contact_lifecycle_stage,
  sp.user_id, sp.created_at, COALESCE(sp.updated_at, sp.created_at)
FROM staff_profiles sp
JOIN auth.users u ON u.id = sp.user_id
WHERE u.email IS NOT NULL
  AND position('@' in u.email) > 0
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = sp.tenant_id AND c.email_normalized = lower(trim(u.email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Newsletter subscribers
INSERT INTO contacts (tenant_id, email, source, source_detail, lifecycle_stage,
                      email_subscribed, email_unsubscribed_at, first_seen_at, last_activity_at)
SELECT
  ns.tenant_id, lower(trim(ns.email)),
  'newsletter'::contact_source, ns.source_page,
  'subscriber'::contact_lifecycle_stage,
  ns.unsubscribed_at IS NULL,
  ns.unsubscribed_at,
  ns.consent_at, COALESCE(ns.unsubscribed_at, ns.consent_at, now())
FROM newsletter_subscribers ns
WHERE ns.email IS NOT NULL
  AND position('@' in ns.email) > 0
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = ns.tenant_id AND c.email_normalized = lower(trim(ns.email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Enrollment drafts (in-progress applications)
UPDATE contacts c SET
  lifecycle_stage = CASE
    WHEN c.lifecycle_stage = 'subscriber' THEN 'lead'::contact_lifecycle_stage
    ELSE c.lifecycle_stage
  END
FROM enrollment_drafts d
WHERE d.parent_email IS NOT NULL
  AND lower(trim(d.parent_email)) = c.email_normalized
  AND d.tenant_id = c.tenant_id;

INSERT INTO contacts (tenant_id, email, first_name, last_name, phone, source, source_detail,
                      lifecycle_stage, first_seen_at, last_activity_at)
SELECT
  d.tenant_id, lower(trim(d.parent_email)),
  d.parent_first_name, d.parent_last_name, d.parent_phone,
  'enrollment_form'::contact_source, d.source,
  'lead'::contact_lifecycle_stage,
  d.created_at, d.updated_at
FROM enrollment_drafts d
WHERE d.parent_email IS NOT NULL
  AND position('@' in d.parent_email) > 0
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.tenant_id = d.tenant_id AND c.email_normalized = lower(trim(d.parent_email))
  )
ON CONFLICT (tenant_id, email_normalized) DO NOTHING;

-- Drop a "created" backfill activity for everyone we just created.
INSERT INTO contact_activities (tenant_id, contact_id, activity_type, title, occurred_at)
SELECT tenant_id, id, 'created', 'Backfilled from existing records', first_seen_at
FROM contacts
WHERE NOT EXISTS (
  SELECT 1 FROM contact_activities a
  WHERE a.contact_id = contacts.id AND a.activity_type = 'created'
);
