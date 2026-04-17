// @anchor: platform.form-builder.analytics-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export default async function FormAnalyticsPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: form } = await supabase.from('forms')
    .select('id, title').eq('id', formId).single()
  if (!form) notFound()

  const { data: responses } = await supabase.from('form_responses')
    .select('id, status, completed_at, created_at')
    .eq('form_id', formId)

  const total = responses?.length || 0
  const completed = responses?.filter(r => r.status === 'completed').length || 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{form.title} — Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Responses" value={String(total)} />
        <StatCard label="Completed" value={String(completed)} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
      </div>

      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-semibold mb-4">Response Timeline</h3>
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {total === 0 ? 'No responses yet. Publish the form and share the link to start collecting data.' : `${completed} completed responses collected.`}
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-foreground)' }}>{value}</p>
    </div>
  )
}
