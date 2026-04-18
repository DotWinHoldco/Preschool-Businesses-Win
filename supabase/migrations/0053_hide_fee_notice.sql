-- Add toggle to completely hide the fee notice banner from applicants
ALTER TABLE forms ADD COLUMN IF NOT EXISTS hide_fee_notice boolean NOT NULL DEFAULT false;
