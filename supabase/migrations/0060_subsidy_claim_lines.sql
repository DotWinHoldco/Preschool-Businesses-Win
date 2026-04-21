CREATE TABLE IF NOT EXISTS subsidy_claim_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES subsidy_claims(id) ON DELETE CASCADE,
  family_subsidy_id uuid NOT NULL REFERENCES family_subsidies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  days_claimed integer NOT NULL DEFAULT 0,
  amount_claimed_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subsidy_claim_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON subsidy_claim_lines USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE INDEX idx_subsidy_claim_lines_claim ON subsidy_claim_lines(claim_id);
