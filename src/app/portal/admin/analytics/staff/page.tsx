// @anchor: cca.analytics.staff-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Staff Analytics | Admin Portal',
  description: 'Staff performance, labor costs, and workforce analytics',
}

export default async function AdminStaffAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  // Parallel queries
  const [staffRes, timeRes, certsRes] = await Promise.all([
    supabase
      .from('staff_profiles')
      .select('id, user_id, position, hire_date')
      .eq('tenant_id', tenantId),
    supabase
      .from('time_entries')
      .select('id, user_id, hours, overtime_hours, created_at')
      .eq('tenant_id', tenantId),
    supabase
      .from('staff_certifications')
      .select('id, user_id, certification_name, expiry_date, status')
      .eq('tenant_id', tenantId),
  ])

  const staff = staffRes.data ?? []
  const timeEntries = timeRes.data ?? []
  const certs = certsRes.data ?? []

  const staffCount = staff.length
  const totalHours = timeEntries.reduce((s, t) => s + (t.hours ?? 0), 0)
  const totalOvertime = timeEntries.reduce((s, t) => s + (t.overtime_hours ?? 0), 0)
  const avgHoursPerWeek = staffCount > 0 ? (totalHours / staffCount).toFixed(1) : '0'

  // Certification status counts
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  let currentCerts = 0
  let expiringCerts = 0
  let expiredCerts = 0
  for (const cert of certs) {
    if (!cert.expiry_date) {
      currentCerts++
      continue
    }
    const expDate = new Date(cert.expiry_date)
    if (expDate < now) {
      expiredCerts++
    } else if (expDate <= thirtyDaysFromNow) {
      expiringCerts++
    } else {
      currentCerts++
    }
  }

  // Build a per-staff summary (join time_entries by user_id)
  const staffSummaries = staff.map((s) => {
    const entries = timeEntries.filter((t) => t.user_id === s.user_id)
    const hours = entries.reduce((sum, t) => sum + (t.hours ?? 0), 0)
    const overtime = entries.reduce((sum, t) => sum + (t.overtime_hours ?? 0), 0)
    const staffCerts = certs.filter((c) => c.user_id === s.user_id)
    const hasExpiring = staffCerts.some((c) => {
      if (!c.expiry_date) return false
      const d = new Date(c.expiry_date)
      return d > now && d <= thirtyDaysFromNow
    })
    const hasExpired = staffCerts.some((c) => {
      if (!c.expiry_date) return false
      return new Date(c.expiry_date) < now
    })
    const certStatus = hasExpired ? 'Expired' : hasExpiring ? 'Expiring Soon' : 'Current'
    return {
      id: s.id,
      userId: s.user_id,
      position: s.position ?? 'Staff',
      hours: Number(hours.toFixed(1)),
      overtime: Number(overtime.toFixed(1)),
      certStatus,
    }
  })

  const mockStats = [
    { label: 'Total Staff', value: staffCount.toString() },
    { label: 'Total Hours Logged', value: totalHours.toFixed(1) },
    { label: 'Avg Hours / Staff', value: avgHoursPerWeek },
    { label: 'Overtime Hours', value: totalOvertime.toFixed(1) + ' hrs' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Staff Analytics
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Workforce performance, labor costs, and certification compliance overview.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {mockStats.map((stat) => (
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

      {/* Certification overview */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Certification Status
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'All Current', count: currentCerts, color: 'var(--color-primary)' },
            { label: 'Expiring Within 30 Days', count: expiringCerts, color: 'var(--color-warning)' },
            { label: 'Expired', count: expiredCerts, color: 'var(--color-destructive)' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff metrics table */}
      {staffSummaries.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No staff data to display yet.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Staff Metrics
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Staff ID', 'Role', 'Hours', 'Overtime', 'Certs'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffSummaries.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{s.userId?.slice(0, 8) ?? s.id.slice(0, 8)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{s.position}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>{s.hours}</td>
                    <td className="px-4 py-3" style={{ color: s.overtime > 0 ? 'var(--color-warning)' : 'var(--color-muted-foreground)' }}>
                      {s.overtime > 0 ? `${s.overtime} hrs` : '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: s.certStatus === 'Current' ? 'var(--color-primary)' : s.certStatus === 'Expired' ? 'var(--color-destructive)' : 'var(--color-warning)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        {s.certStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Export Staff Report
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Schedule Weekly Email
        </button>
      </div>
    </div>
  )
}
