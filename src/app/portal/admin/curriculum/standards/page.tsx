// @anchor: cca.curriculum.standards-page
// Learning Standards library — manage standards used for lesson plan alignment.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import StandardsClient from '@/components/portal/standards-client'

export const dynamic = 'force-dynamic'

export default async function StandardsLibraryPage() {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const [standardsRes, domainsRes] = await Promise.all([
    supabase
      .from('learning_standards')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('framework')
      .order('code'),
    supabase
      .from('learning_domains')
      .select('id, domain_name, framework')
      .eq('tenant_id', tenantId)
      .order('domain_name'),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/curriculum"
        className="inline-flex items-center gap-1 text-xs font-medium"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <ChevronLeft size={14} />
        Back to Curriculum
      </Link>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Learning Standards
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Define the standards your lesson plans can align to. Use frameworks like Texas Pre-K
          Guidelines, NAEYC, Head Start ELOF, or your own.
        </p>
      </div>

      <StandardsClient
        standards={(standardsRes.data ?? []).map((s) => ({
          id: s.id,
          framework: s.framework,
          code: s.code,
          title: s.title,
          description: s.description,
          domain_id: s.domain_id,
          age_range_min_months: s.age_range_min_months,
          age_range_max_months: s.age_range_max_months,
          sort_order: s.sort_order ?? 0,
        }))}
        domains={(domainsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.domain_name,
          framework: d.framework,
        }))}
      />
    </div>
  )
}
