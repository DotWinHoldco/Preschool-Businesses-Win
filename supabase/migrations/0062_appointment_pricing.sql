-- Add pricing support to appointment types and appointments
ALTER TABLE appointment_types ADD COLUMN IF NOT EXISTS price_cents integer;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price_cents integer;
