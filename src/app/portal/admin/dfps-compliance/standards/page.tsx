// @anchor: cca.dfps.standards-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  DfpsStandardsClient,
  type Standard,
} from '@/components/portal/compliance/dfps-standards-client'

export default async function DFPSStandardsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: rows } = await supabase
    .from('dfps_standards')
    .select(
      'id, rule_code, subchapter, category, rule_text, compliance_status, notes, last_checked_at',
    )
    .eq('tenant_id', tenantId)
    .order('rule_code')

  const standards = (rows ?? []) as Standard[]
  const categories = [
    ...new Set(standards.map((s) => s.category).filter((c): c is string => !!c)),
  ].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Chapter 746 Standards
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {standards.length} standards tracked. Mark compliance status as you verify each rule.
        </p>
      </div>
      <DfpsStandardsClient standards={standards} categories={categories} />
    </div>
  )
}
