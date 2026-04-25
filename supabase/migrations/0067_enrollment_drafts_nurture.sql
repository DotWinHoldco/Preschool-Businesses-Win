-- 0067_enrollment_drafts_nurture.sql
-- Adds the nurture-sequence state to enrollment_drafts so an
-- abandonment cadence (6h / 24h / 72h / 1w) can be driven from a cron.

ALTER TABLE enrollment_drafts
  ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nurture_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES enrollment_leads(id);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_nurture_due
  ON enrollment_drafts(tenant_id, nurture_step, updated_at)
  WHERE submitted_at IS NULL AND nurture_step < 4;
