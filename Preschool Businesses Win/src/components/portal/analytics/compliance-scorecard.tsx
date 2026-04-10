// @anchor: cca.analytics.compliance-scorecard
// Compliance scores overview

import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'

interface ComplianceArea { name: string; score: number; total: number; status: 'compliant' | 'needs_attention' | 'non_compliant' }
interface ComplianceScorecardProps { areas: ComplianceArea[]; overallScore: number }

export function ComplianceScorecard({ areas, overallScore }: ComplianceScorecardProps) {
  const statusConfig = {
    compliant: { icon: ShieldCheck, color: 'var(--color-success, #10B981)', label: 'Compliant' },
    needs_attention: { icon: AlertTriangle, color: 'var(--color-warning)', label: 'Needs Attention' },
    non_compliant: { icon: XCircle, color: 'var(--color-destructive)', label: 'Non-Compliant' },
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="p-6 border-b text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>Overall Compliance</p>
        <p className="text-4xl font-bold mt-1" style={{ color: overallScore >= 90 ? 'var(--color-success, #10B981)' : overallScore >= 70 ? 'var(--color-warning)' : 'var(--color-destructive)' }}>{overallScore}%</p>
      </div>
      <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {areas.map((area) => {
          const config = statusConfig[area.status]
          const Icon = config.icon
          return (
            <li key={area.name} className="flex items-center gap-3 px-6 py-3">
              <Icon size={18} style={{ color: config.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{area.name}</p>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(area.score / area.total) * 100}%`, backgroundColor: config.color }} />
                </div>
              </div>
              <span className="text-sm font-medium" style={{ color: config.color }}>{area.score}/{area.total}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
