// @anchor: cca.analytics.compliance-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Compliance Scorecard | Admin Portal',
  description: 'Compliance metrics, ratio trends, and inspection readiness',
}

export default async function AdminComplianceAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [checksRes, inspectionsRes] = await Promise.all([
    supabase
      .from('compliance_checks')
      .select('id, status, standard_id, created_at')
      .eq('tenant_id', tenantId),
    supabase
      .from('inspection_records')
      .select('id, inspection_date, inspector_name, inspection_type, overall_result, notes, created_at')
      .eq('tenant_id', tenantId)
      .order('inspection_date', { ascending: false }),
  ])

  const checks = checksRes.data ?? []
  const inspections = inspectionsRes.data ?? []

  // Group checks by status
  const totalChecks = checks.length
  const passedChecks = checks.filter((c) => c.status === 'pass' || c.status === 'compliant').length
  const failedChecks = checks.filter((c) => c.status === 'fail' || c.status === 'non_compliant').length
  const pendingChecks = checks.filter(
    (c) => c.status !== 'pass' && c.status !== 'compliant' && c.status !== 'fail' && c.status !== 'non_compliant',
  ).length

  const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  const hasData = checks.length > 0 || inspections.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Compliance Scorecard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Overall compliance health, ratio trends, and inspection readiness.
        </p>
      </div>

      {!hasData ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>0</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No compliance data yet. Compliance checks and inspection records will appear here once recorded.
          </p>
        </div>
      ) : (
        <>
          {/* Overall score */}
          <div
            className="flex items-center gap-6 rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold"
              style={{
                backgroundColor: overallScore >= 90 ? 'var(--color-primary)' : overallScore >= 70 ? 'var(--color-warning)' : 'var(--color-destructive)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              {overallScore}%
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Overall Compliance Score
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Based on {totalChecks} compliance checks.
              </p>
              <p className="mt-2 text-sm font-medium" style={{ color: overallScore >= 90 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                {overallScore >= 90 ? 'Inspection-ready' : 'Needs attention'}
              </p>
            </div>
          </div>

          {/* Status breakdown */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Check Status Breakdown
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {[
                { label: 'Passed / Compliant', count: passedChecks, color: 'var(--color-primary)' },
                { label: 'Failed / Non-Compliant', count: failedChecks, color: 'var(--color-destructive)' },
                { label: 'Pending / Other', count: pendingChecks, color: 'var(--color-warning)' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection records */}
          {inspections.length > 0 && (
            <div
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Inspection Records
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Date', 'Type', 'Inspector', 'Result', 'Notes'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((insp) => (
                      <tr key={insp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                          {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString() : '\u2014'}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{insp.inspection_type ?? '\u2014'}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{insp.inspector_name ?? '\u2014'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor:
                                insp.overall_result === 'pass'
                                  ? 'var(--color-primary)'
                                  : insp.overall_result === 'fail'
                                    ? 'var(--color-destructive)'
                                    : 'var(--color-warning)',
                              color: 'var(--color-primary-foreground)',
                            }}
                          >
                            {insp.overall_result ?? 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{insp.notes ?? '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Generate Compliance Report
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Start Inspection Prep
        </button>
      </div>
    </div>
  )
}
