'use client'

// @anchor: cca.subsidy.enrollment-form
import { cn } from '@/lib/cn'
import { Shield, Calendar, DollarSign, AlertTriangle } from 'lucide-react'

interface FamilySubsidy {
  id: string
  student_name: string
  family_name: string
  agency_name: string
  case_number: string
  authorization_start: string
  authorization_end: string
  authorized_days_per_week: number
  authorized_hours_per_day: number
  subsidy_rate_cents_per_day: number
  family_copay_cents_per_week: number
  status: string
}

interface SubsidyEnrollmentProps {
  subsidies: FamilySubsidy[]
  onEdit?: (id: string) => void
}

const statusStyles: Record<string, string> = {
  active: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  expired: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  pending_renewal: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  terminated: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
}

export function SubsidyEnrollment({ subsidies, onEdit }: SubsidyEnrollmentProps) {
  // Check for expiring soon (within 30 days)
  const now = new Date()
  const expiringSubsidies = subsidies.filter((s) => {
    if (s.status !== 'active') return false
    const end = new Date(s.authorization_end)
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 30 && daysLeft > 0
  })

  return (
    <div className="space-y-4">
      {expiringSubsidies.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
            <span className="text-sm font-medium text-[var(--color-warning)]">
              {expiringSubsidies.length} subsidy authorization(s) expiring within 30 days
            </span>
          </div>
          {expiringSubsidies.map((s) => (
            <p key={s.id} className="text-xs text-[var(--color-foreground)] ml-6">
              {s.student_name} - {s.agency_name} (expires {s.authorization_end})
            </p>
          ))}
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Subsidy Enrollments</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {subsidies.length} active subsidies
          </p>
        </div>

        {subsidies.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No subsidy enrollments
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {subsidies.map((s) => (
              <button
                key={s.id}
                onClick={() => onEdit?.(s.id)}
                className="flex w-full items-start gap-4 p-4 text-left hover:bg-[var(--color-muted)]/50 transition-colors"
              >
                <Shield className="h-5 w-5 flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {s.student_name}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyles[s.status])}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {s.agency_name} | Case: {s.case_number}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                      <Calendar className="h-3 w-3" />
                      {s.authorization_start} to {s.authorization_end}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                      <DollarSign className="h-3 w-3" />
                      ${(s.subsidy_rate_cents_per_day / 100).toFixed(2)}/day
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      Co-pay: ${(s.family_copay_cents_per_week / 100).toFixed(2)}/week
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {s.authorized_days_per_week} days/week
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
