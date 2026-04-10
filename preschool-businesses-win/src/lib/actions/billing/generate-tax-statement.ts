'use server'

// @anchor: cca.billing.tax-statement
// Generate annual tax statement for a family (for dependent-care FSA / tax credit).

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { GenerateTaxStatementSchema } from '@/lib/schemas/billing'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export type TaxStatementState = {
  ok: boolean
  error?: string
  statement_id?: string
  total_paid_cents?: number
}

export async function generateTaxStatement(
  _prev: TaxStatementState,
  formData: FormData,
): Promise<TaxStatementState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = GenerateTaxStatementSchema.safeParse({
      ...raw,
      tax_year: raw.tax_year ? Number(raw.tax_year) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { family_id, tax_year } = parsed.data
    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
    const supabase = await createTenantServerClient()

    // Calculate total payments for the year
    const yearStart = `${tax_year}-01-01`
    const yearEnd = `${tax_year}-12-31`

    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('amount_cents')
      .eq('family_id', family_id)
      .eq('status', 'succeeded')
      .gte('paid_at', yearStart)
      .lte('paid_at', yearEnd)

    if (payErr) {
      return { ok: false, error: payErr.message }
    }

    const totalPaidCents = (payments ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0)

    // Fetch tenant branding for school name and address
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('school_name, address_line1, city, state, zip')
      .eq('tenant_id', tenantId)
      .single()

    // Create or update tax statement
    const { data: statement, error: stmtErr } = await supabase
      .from('annual_tax_statements')
      .insert({
        tenant_id: tenantId,
        family_id,
        tax_year,
        total_paid_cents: totalPaidCents,
        school_name: branding?.school_name ?? '',
        school_address: branding
          ? `${branding.address_line1 ?? ''}, ${branding.city ?? ''}, ${branding.state ?? ''} ${branding.zip ?? ''}`
          : '',
        generated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (stmtErr || !statement) {
      return { ok: false, error: stmtErr?.message ?? 'Failed to generate statement' }
    }

    return { ok: true, statement_id: statement.id, total_paid_cents: totalPaidCents }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
