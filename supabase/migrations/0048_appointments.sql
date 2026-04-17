-- 0048_appointments.sql
-- @anchor: cca.appointments
-- Calendly-style appointment booking: appointment types, staff availability,
-- calendar sync connections (Google/Outlook/Apple), and booked appointments.

-- Appointment types (admin-configurable)
CREATE TABLE appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  buffer_before_minutes integer NOT NULL DEFAULT 0,
  buffer_after_minutes integer NOT NULL DEFAULT 15,
  color text,
  location text,
  location_type text NOT NULL DEFAULT 'in_person' CHECK (location_type IN ('in_person','virtual','phone')),
  virtual_meeting_url text,
  booking_window_days integer NOT NULL DEFAULT 30,
  min_notice_hours integer NOT NULL DEFAULT 24,
  max_per_day integer,
  max_per_slot integer NOT NULL DEFAULT 1,
  assigned_staff uuid[],
  round_robin boolean NOT NULL DEFAULT false,
  require_confirmation boolean NOT NULL DEFAULT false,
  auto_confirm boolean NOT NULL DEFAULT true,
  confirmation_message text,
  reminder_hours integer[] NOT NULL DEFAULT '{24,1}',
  linked_pipeline_stage text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON appointment_types
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "public_read_active" ON appointment_types
  FOR SELECT USING (is_active = true);

-- Recurring weekly availability patterns per staff member
CREATE TABLE staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE CASCADE,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_time < end_time)
);

CREATE INDEX idx_staff_availability_user ON staff_availability(tenant_id, user_id, day_of_week);

ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON staff_availability
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Date-specific overrides (vacation days, special hours)
CREATE TABLE staff_availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL,
  is_available boolean NOT NULL,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_overrides_user_date ON staff_availability_overrides(tenant_id, user_id, date);

ALTER TABLE staff_availability_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON staff_availability_overrides
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- External calendar connections (OAuth for Google/Outlook, CalDAV URL for Apple)
CREATE TABLE calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google','outlook','apple')),
  provider_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  calendar_id text,
  calendar_name text,
  ical_url text,
  sync_direction text NOT NULL DEFAULT 'both' CHECK (sync_direction IN ('read','write','both')),
  synced_busy_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_synced_at timestamptz,
  last_sync_error text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disconnected','error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_connections_user ON calendar_connections(tenant_id, user_id);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON calendar_connections
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Booked appointments
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_type_id uuid NOT NULL REFERENCES appointment_types(id) ON DELETE RESTRICT,
  booked_by_user_id uuid,
  booked_by_name text NOT NULL,
  booked_by_email text NOT NULL,
  booked_by_phone text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Chicago',
  staff_user_id uuid,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'pending','confirmed','cancelled_by_parent','cancelled_by_staff',
    'rescheduled','no_show','completed'
  )),
  enrollment_application_id uuid REFERENCES enrollment_applications(id) ON DELETE SET NULL,
  notes text,
  staff_notes text,
  cancellation_reason text,
  rescheduled_from_id uuid REFERENCES appointments(id),
  external_calendar_event_id text,
  virtual_meeting_url text,
  reminder_sent_at timestamptz[],
  confirmation_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_at < end_at)
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, start_at);
CREATE INDEX idx_appointments_staff ON appointments(staff_user_id, start_at);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_application ON appointments(enrollment_application_id) WHERE enrollment_application_id IS NOT NULL;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON appointments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY "public_confirmation_lookup" ON appointments
  FOR SELECT USING (confirmation_token IS NOT NULL);

-- Add appointment_booking feature flag for all existing tenants
INSERT INTO tenant_features (tenant_id, feature_key, enabled)
SELECT id, 'appointment_booking', true FROM tenants
ON CONFLICT (tenant_id, feature_key) DO NOTHING;
