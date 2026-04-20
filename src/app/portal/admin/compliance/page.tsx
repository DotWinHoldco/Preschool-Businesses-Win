// @anchor: cca.compliance.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck } from 'lucide-react'

export default async function AdminCompliancePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [checksRes, inspectionsRes, standardsRes] = await Promise.all([
    supabase
      .from('compliance_checks')
      .select('id, standard_id, checked_by, status, evidence_notes, corrective_action, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('inspection_records')
      .select('id, inspection_date, inspector_name, inspection_type, findings, overall_result, notes, created_at')
      .eq('tenant_id', tenantId)
      .order('inspection_date', { ascending: false }),
    supabase
      .from('compliance_standards')
      .select('id, name, category')
      .eq('tenant_id', tenantId),
  ])

  const checks = checksRes.data ?? []
  const inspections = inspectionsRes.data ?? []
  const standards = standardsRes.data ?? []

  // Build a standards map for name lookups
  const standardsMap = new Map(standards.map((s) => [s.id, s.name ?? 'Unknown Standard']))

  const totalChecks = checks.length
  const passedChecks = checks.filter((c) => c.status === 'pass' || c.status === 'compliant').length
  const failedChecks = checks.filter((c) => c.status === 'fail' || c.status === 'non_compliant').length
  const overallPct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  const hasData = checks.length > 0 || inspections.length > 0

  function resultColor(result: string | null): string {
    switch (result) {
      case 'pass': return 'var(--color-primary)'
      case 'fail': return 'var(--color-destructive)'
      case 'conditional': return 'var(--color-warning)'
      default: return 'var(--color-muted-foreground)'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Compliance Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          DFPS compliance scorecard, upcoming renewals, and inspection records.
        </p>
      </div>

      {!hasData ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <ShieldCheck
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No compliance data yet.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Compliance checks and inspection records will appear here once added.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Checks', value: totalChecks.toString() },
              { label: 'Passed', value: passedChecks.toString() },
              { label: 'Failed', value: failedChecks.toString() },
              { label: 'Compliance Rate', value: overallPct + '%' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Compliance checks table */}
          {checks.length > 0 && (
            <div
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Compliance Checks
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Date', 'Standard', 'Status', 'Checked By', 'Notes'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checks.slice(0, 20).map((chk) => (
                      <tr key={chk.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                          {chk.created_at ? new Date(chk.created_at).toLocaleDateString() : '\u2014'}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                          {standardsMap.get(chk.standard_id) ?? chk.standard_id ?? '\u2014'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor:
                                chk.status === 'pass' || chk.status === 'compliant'
                                  ? 'var(--color-primary)'
                                  : chk.status === 'fail' || chk.status === 'non_compliant'
                                    ? 'var(--color-destructive)'
                                    : 'var(--color-warning)',
                              color: 'var(--color-primary-foreground)',
                            }}
                          >
                            {chk.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{chk.checked_by ?? '\u2014'}</td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                          {chk.evidence_notes ?? chk.corrective_action ?? '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inspection records table */}
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
                              backgroundColor: resultColor(insp.overall_result) + '20',
                              color: resultColor(insp.overall_result),
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
    </div>
  )
}
