// @anchor: cca.analytics.reports-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ReportBuilderClient } from '@/components/portal/analytics/report-builder-client'

export const metadata: Metadata = {
  title: 'Custom Reports | Admin Portal',
  description: 'Build, save, schedule, and export custom reports',
}

export default async function AdminCustomReportsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: savedReports } = await supabase
    .from('saved_reports')
    .select('id, name, entity_type, filters, is_scheduled, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const reports = (savedReports ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? 'Untitled',
    entity_type: (r.entity_type as string) ?? null,
    is_scheduled: (r.is_scheduled as boolean) ?? false,
    created_at: (r.created_at as string) ?? null,
    filters: (r.filters as Record<string, unknown>) ?? null,
  }))

  const entityOptions = [
    'students',
    'families',
    'staff',
    'attendance',
    'billing',
    'enrollment',
    'classrooms',
    'compliance',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Custom Report Builder
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Build, save, and schedule custom reports from any data in the platform.
        </p>
      </div>

      <ReportBuilderClient savedReports={reports} entityOptions={entityOptions} />
    </div>
  )
}
