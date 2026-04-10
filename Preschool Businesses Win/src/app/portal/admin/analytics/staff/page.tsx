// @anchor: cca.analytics.staff-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Analytics | Admin Portal',
  description: 'Staff performance, labor costs, and workforce analytics',
}

export default function AdminStaffAnalyticsPage() {
  const mockStats = [
    { label: 'Total Staff', value: '24' },
    { label: 'Labor Cost % of Revenue', value: '62%' },
    { label: 'Avg Hours / Week', value: '36.4' },
    { label: 'Overtime This Month', value: '18.5 hrs' },
  ]

  const mockStaffMetrics = [
    { name: 'Sarah Johnson', role: 'Lead Teacher', hours: 42.5, overtime: 2.5, certStatus: 'Current', ptoBalance: '48 hrs' },
    { name: 'Maria Garcia', role: 'Assistant Teacher', hours: 38.0, overtime: 0, certStatus: 'Current', ptoBalance: '32 hrs' },
    { name: 'Emily Davis', role: 'Lead Teacher', hours: 40.0, overtime: 0, certStatus: 'Expiring Soon', ptoBalance: '16 hrs' },
    { name: 'James Wilson', role: 'Aide', hours: 35.5, overtime: 0, certStatus: 'Current', ptoBalance: '56 hrs' },
    { name: 'Ashley Brown', role: 'Lead Teacher', hours: 44.0, overtime: 4.0, certStatus: 'Current', ptoBalance: '24 hrs' },
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
            { label: 'All Current', count: 20, color: 'var(--color-primary)' },
            { label: 'Expiring Within 30 Days', count: 3, color: 'var(--color-warning)' },
            { label: 'Expired', count: 1, color: 'var(--color-destructive)' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff metrics table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Staff Metrics — This Week
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Role', 'Hours', 'Overtime', 'Certs', 'PTO Balance'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockStaffMetrics.map((s) => (
                <tr key={s.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{s.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{s.role}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>{s.hours}</td>
                  <td className="px-4 py-3" style={{ color: s.overtime > 0 ? 'var(--color-warning)' : 'var(--color-muted-foreground)' }}>
                    {s.overtime > 0 ? `${s.overtime} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: s.certStatus === 'Current' ? 'var(--color-primary)' : 'var(--color-warning)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      {s.certStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{s.ptoBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
