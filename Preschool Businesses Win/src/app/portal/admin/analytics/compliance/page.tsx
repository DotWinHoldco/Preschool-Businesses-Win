// @anchor: cca.analytics.compliance-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance Scorecard | Admin Portal',
  description: 'Compliance metrics, ratio trends, and inspection readiness',
}

export default function AdminComplianceAnalyticsPage() {
  const overallScore = 94

  const mockCategories = [
    { name: 'Staff-to-Child Ratios', score: 98, status: 'Compliant', trend: 'stable' },
    { name: 'Staff Certifications', score: 92, status: 'Attention', trend: 'declining' },
    { name: 'Background Checks', score: 100, status: 'Compliant', trend: 'stable' },
    { name: 'Training Hours', score: 85, status: 'Attention', trend: 'improving' },
    { name: 'Document Compliance', score: 96, status: 'Compliant', trend: 'stable' },
    { name: 'Incident Reporting', score: 100, status: 'Compliant', trend: 'stable' },
    { name: 'Fire Drills', score: 90, status: 'Compliant', trend: 'stable' },
    { name: 'Health & Safety', score: 88, status: 'Attention', trend: 'improving' },
  ]

  const mockIncidents = [
    { month: 'Jan', count: 2 },
    { month: 'Feb', count: 1 },
    { month: 'Mar', count: 3 },
    { month: 'Apr', count: 0 },
  ]

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

      {/* Overall score */}
      <div
        className="flex items-center gap-6 rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold"
          style={{
            backgroundColor: overallScore >= 90 ? 'var(--color-primary)' : 'var(--color-warning)',
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
            Based on 8 compliance categories. Updated daily.
          </p>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            Inspection-ready
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Category Scores
        </h2>
        <div className="mt-4 space-y-3">
          {mockCategories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-4">
              <span className="w-44 text-sm" style={{ color: 'var(--color-foreground)' }}>{cat.name}</span>
              <div className="flex-1 rounded-full" style={{ backgroundColor: 'var(--color-muted)', height: 10 }}>
                <div
                  className="rounded-full"
                  style={{
                    width: `${cat.score}%`,
                    height: 10,
                    backgroundColor: cat.score >= 95 ? 'var(--color-primary)' : cat.score >= 85 ? 'var(--color-warning)' : 'var(--color-destructive)',
                  }}
                />
              </div>
              <span className="w-12 text-right text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {cat.score}%
              </span>
              <span
                className="w-20 text-center text-xs"
                style={{ color: cat.trend === 'improving' ? 'var(--color-primary)' : cat.trend === 'declining' ? 'var(--color-destructive)' : 'var(--color-muted-foreground)' }}
              >
                {cat.trend === 'improving' ? '^ Improving' : cat.trend === 'declining' ? 'v Declining' : '- Stable'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Incident trend */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Incident Reports — 2026
        </h2>
        <div className="mt-4 flex items-end gap-4">
          {mockIncidents.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-1">
              <div
                className="w-12 rounded-t"
                style={{
                  height: Math.max(m.count * 24, 4),
                  backgroundColor: m.count === 0 ? 'var(--color-primary)' : 'var(--color-warning)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{m.month}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>{m.count}</span>
            </div>
          ))}
        </div>
      </div>

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
