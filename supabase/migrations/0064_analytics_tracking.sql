-- 0064_analytics_tracking.sql
-- First-party web analytics + conversion tracking for tenant marketing sites.
-- Powers the /portal/admin/analytics dashboard and server-side CAPI forwarding
-- to Meta, GA4, and TikTok. Designed for multi-tenant day one.
--
-- Tables: analytics_sites, analytics_events, analytics_sessions,
-- analytics_visitors, analytics_consent, analytics_ip_salt.
-- RLS pattern matches 0061/0063: tenant_isolation + service_all.

-- ============================================================
-- 1. Rotating IP salt (single-row table, service-role only)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_ip_salt (
  id integer PRIMARY KEY DEFAULT 1,
  salt text NOT NULL,
  rotated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);

INSERT INTO analytics_ip_salt (id, salt)
VALUES (1, encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (id) DO NOTHING;

ALTER TABLE analytics_ip_salt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all" ON analytics_ip_salt
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 2. Sites — one row per tenant marketing property
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  site_key text NOT NULL UNIQUE,
  name text NOT NULL,
  origins text[] NOT NULL DEFAULT '{}',
  meta_pixel_id text,
  meta_capi_token text,
  meta_test_event_code text,
  ga4_measurement_id text,
  ga4_api_secret text,
  tiktok_pixel_id text,
  tiktok_access_token text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_sites_tenant_name
  ON analytics_sites(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_analytics_sites_tenant_active
  ON analytics_sites(tenant_id, is_active);

ALTER TABLE analytics_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON analytics_sites
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON analytics_sites
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 3. Raw event stream
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  site_id uuid REFERENCES analytics_sites(id),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'page_view','click','conversion','session_start','session_end','custom','error'
  )),
  event_name text NOT NULL,
  page_url text,
  page_path text,
  page_title text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  click_id_fbclid text,
  click_id_gclid text,
  click_id_ttclid text,
  ip_hash text,
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  browser_version text,
  os text,
  os_version text,
  user_agent text,
  screen_width integer,
  screen_height integer,
  viewport_width integer,
  viewport_height integer,
  language text,
  application_id uuid REFERENCES enrollment_applications(id),
  properties jsonb NOT NULL DEFAULT '{}',
  forwarded_to jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_created
  ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_type_created
  ON analytics_events(tenant_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_name_created
  ON analytics_events(tenant_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_session
  ON analytics_events(tenant_id, session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_visitor
  ON analytics_events(tenant_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_forward_pending
  ON analytics_events(tenant_id, created_at)
  WHERE event_type = 'conversion';

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON analytics_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 4. Sessions — upserted on each event
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  site_id uuid REFERENCES analytics_sites(id),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NOT NULL DEFAULT now(),
  page_count integer NOT NULL DEFAULT 0,
  event_count integer NOT NULL DEFAULT 0,
  entry_page text,
  exit_page text,
  entry_referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ip_hash text,
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  user_agent text,
  converted boolean NOT NULL DEFAULT false,
  conversion_event text,
  is_bounce boolean NOT NULL DEFAULT true,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_tenant_started
  ON analytics_sessions(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_tenant_visitor
  ON analytics_sessions(tenant_id, visitor_id);

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON analytics_sessions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON analytics_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 5. Visitors — first-touch / last-touch attribution
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  visitor_id text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_sessions integer NOT NULL DEFAULT 1,
  total_events integer NOT NULL DEFAULT 0,
  first_utm_source text,
  first_utm_medium text,
  first_utm_campaign text,
  first_utm_content text,
  first_utm_term text,
  first_referrer text,
  last_utm_source text,
  last_utm_medium text,
  last_utm_campaign text,
  last_utm_content text,
  last_utm_term text,
  last_referrer text,
  converted boolean NOT NULL DEFAULT false,
  conversion_count integer NOT NULL DEFAULT 0,
  first_converted_at timestamptz,
  application_id uuid REFERENCES enrollment_applications(id),
  UNIQUE (tenant_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_visitors_tenant_last_seen
  ON analytics_visitors(tenant_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_tenant_converted
  ON analytics_visitors(tenant_id, converted);

ALTER TABLE analytics_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON analytics_visitors
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON analytics_visitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 6. Consent log (TDPSA compliance audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  visitor_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('granted','denied','withdrawn')),
  ip_hash text,
  user_agent text,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_consent_tenant_visitor
  ON analytics_consent(tenant_id, visitor_id, created_at DESC);

ALTER TABLE analytics_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON analytics_consent
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "service_all" ON analytics_consent
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 7. Helper function: rotate IP salt (called by data-retention cron)
-- ============================================================

CREATE OR REPLACE FUNCTION rotate_analytics_ip_salt() RETURNS void AS $$
BEGIN
  UPDATE analytics_ip_salt
    SET salt = encode(gen_random_bytes(32), 'hex'),
        rotated_at = now()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 8. Seed: CCA marketing site
-- ============================================================

INSERT INTO analytics_sites (tenant_id, site_key, name, origins)
SELECT
  'a0a0a0a0-cca0-4000-8000-000000000001'::uuid,
  'pk_cca_' || encode(gen_random_bytes(18), 'hex'),
  'Crandall Christian Academy',
  ARRAY[
    'https://crandallchristianacademy.com',
    'https://www.crandallchristianacademy.com'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM analytics_sites
  WHERE tenant_id = 'a0a0a0a0-cca0-4000-8000-000000000001'::uuid
    AND name = 'Crandall Christian Academy'
);
