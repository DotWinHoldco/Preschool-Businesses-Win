// @anchor: cca.analytics.executive-dashboard
// Executive overview dashboard with key metrics

import { Users, DollarSign, TrendingUp, UserCheck, AlertTriangle, Clock } from 'lucide-react'

interface MetricCard { label: string; value: string | number; change?: string; changePositive?: boolean; icon: typeof Users }

interface ExecutiveDashboardProps {
  metrics: {
    currentEnrollment: number; capacity: number; revenueMTD: number; expensesMTD: number;
    outstandingAR: number; attendanceRate: number; ratioComplianceScore: number;
    staffHoursThisWeek: number; pendingApplications: number
  }
}

export function ExecutiveDashboard({ metrics }: ExecutiveDashboardProps) {
  const cards: MetricCard[] = [
    { label: 'Enrollment', value: `${metrics.currentEnrollment}/${metrics.capacity}`, icon: Users, change: `${Math.round((metrics.currentEnrollment / metrics.capacity) * 100)}% capacity` },
    { label: 'Revenue MTD', value: `$${(metrics.revenueMTD / 100).toLocaleString()}`, icon: DollarSign, changePositive: true },
    { label: 'Net Income MTD', value: `$${((metrics.revenueMTD - metrics.expensesMTD) / 100).toLocaleString()}`, icon: TrendingUp, changePositive: metrics.revenueMTD > metrics.expensesMTD },
    { label: 'Attendance Rate', value: `${metrics.attendanceRate}%`, icon: UserCheck },
    { label: 'Outstanding AR', value: `$${(metrics.outstandingAR / 100).toLocaleString()}`, icon: Clock },
    { label: 'Ratio Compliance', value: `${metrics.ratioComplianceScore}%`, icon: metrics.ratioComplianceScore < 100 ? AlertTriangle : UserCheck },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>{card.label}</span>
                <Icon size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{card.value}</p>
              {card.change && <p className="text-xs mt-1" style={{ color: card.changePositive === false ? 'var(--color-destructive)' : 'var(--color-muted-foreground)' }}>{card.change}</p>}
            </div>
          )
        })}
      </div>
      {metrics.pendingApplications > 0 && (
        <div className="rounded-lg border p-4 flex items-center gap-3" style={{ borderColor: 'var(--color-warning)', backgroundColor: 'var(--color-card)' }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
          <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
            <strong>{metrics.pendingApplications}</strong> pending enrollment application{metrics.pendingApplications !== 1 ? 's' : ''} awaiting review.
          </p>
        </div>
      )}
    </div>
  )
}
