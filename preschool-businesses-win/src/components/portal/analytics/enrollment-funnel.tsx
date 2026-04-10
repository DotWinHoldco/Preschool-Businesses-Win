// @anchor: cca.analytics.enrollment-funnel
// Enrollment conversion funnel visualization

interface FunnelStage { label: string; count: number; color?: string }
interface EnrollmentFunnelProps { stages: FunnelStage[] }

export function EnrollmentFunnel({ stages }: EnrollmentFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Enrollment Funnel</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const widthPct = (stage.count / maxCount) * 100
          const conversionRate = i > 0 && stages[i - 1].count > 0 ? Math.round((stage.count / stages[i - 1].count) * 100) : null
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>{stage.count}</span>
                  {conversionRate !== null && (
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>({conversionRate}%)</span>
                  )}
                </div>
              </div>
              <div className="h-8 rounded overflow-hidden mx-auto" style={{ backgroundColor: 'var(--color-muted)', width: `${Math.max(widthPct, 10)}%` }}>
                <div className="h-full rounded" style={{ backgroundColor: stage.color ?? 'var(--color-primary)', width: '100%' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
