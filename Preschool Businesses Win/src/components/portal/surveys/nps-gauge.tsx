// @anchor: cca.survey.nps-gauge
// NPS score gauge visualization

interface NPSGaugeProps { score: number; responseCount: number }

export function NPSGauge({ score, responseCount }: NPSGaugeProps) {
  const clampedScore = Math.max(-100, Math.min(100, score))
  const pct = ((clampedScore + 100) / 200) * 100
  const color = score >= 50 ? 'var(--color-success, #10B981)' : score >= 0 ? 'var(--color-warning)' : 'var(--color-destructive)'
  const label = score >= 50 ? 'Excellent' : score >= 0 ? 'Good' : 'Needs Improvement'

  return (
    <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted-foreground)' }}>Net Promoter Score</p>
      <p className="text-4xl font-bold" style={{ color }}>{score}</p>
      <p className="text-sm font-medium mt-1" style={{ color }}>{label}</p>
      <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
        <span>-100</span><span>0</span><span>+100</span>
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>{responseCount} responses</p>
    </div>
  )
}
