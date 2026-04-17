// @anchor: cca.enrollment.application-queue
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Star } from 'lucide-react'
import { PipelineStageBadge } from './pipeline-stage-badge'

interface Application {
  id: string
  parent_first_name: string
  parent_last_name: string
  parent_email: string
  student_first_name: string
  student_last_name: string
  student_dob: string
  program_type: string
  triage_status: string
  triage_score: number | null
  pipeline_stage?: string
  created_at: string
}

interface ApplicationQueueProps {
  applications: Application[]
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; className: string }> = {
  new: { icon: AlertCircle, label: 'New', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
  reviewing: { icon: Clock, label: 'Reviewing', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
  waitlisted: { icon: Clock, label: 'Waitlisted', className: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]' },
  enrolled: { icon: CheckCircle, label: 'Enrolled', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
}

export function ApplicationQueue({ applications }: ApplicationQueueProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Application Queue</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          No applications to review
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {applications.map((app) => {
            const config = statusConfig[app.triage_status] ?? statusConfig.new
            const StatusIcon = config.icon

            return (
              <Link
                key={app.id}
                href={`/portal/admin/enrollment/${app.id}`}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-[var(--color-muted)]/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {app.student_first_name} {app.student_last_name}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', config.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <PipelineStageBadge stage={app.pipeline_stage} />
                    {app.triage_score !== null && (
                      <span
                        title={`Triage priority score: ${app.triage_score}/100 (higher = higher priority). Factors: sibling enrolled +15, referral +10, faith community +10, PreK +10, infant +5. Base: 50.`}
                        className="inline-flex items-center gap-0.5 text-xs text-[var(--color-warning)]"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {app.triage_score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Parent: {app.parent_first_name} {app.parent_last_name} ({app.parent_email})
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      DOB: {app.student_dob}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      Program: {app.program_type}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--color-muted-foreground)]" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
