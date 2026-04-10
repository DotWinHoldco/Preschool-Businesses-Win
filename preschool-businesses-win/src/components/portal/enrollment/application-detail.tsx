// @anchor: cca.enrollment.application-detail
import { cn } from '@/lib/cn'
import { CheckCircle, XCircle, Clock, AlertTriangle, User, Baby, Calendar, MapPin, MessageSquare } from 'lucide-react'

interface ApplicationDetailProps {
  application: {
    id: string
    parent_first_name: string
    parent_last_name: string
    parent_email: string
    parent_phone: string | null
    student_first_name: string
    student_last_name: string
    student_dob: string
    desired_start_date: string | null
    program_type: string
    how_heard: string | null
    faith_community: string | null
    notes: string | null
    triage_status: string
    triage_score: number | null
    triage_notes: string | null
    created_at: string
  }
  onApprove?: () => void
  onReject?: () => void
  onWaitlist?: () => void
  onRequestInfo?: () => void
}

export function ApplicationDetail({
  application,
  onApprove,
  onReject,
  onWaitlist,
  onRequestInfo,
}: ApplicationDetailProps) {
  const isPending = ['new', 'reviewing'].includes(application.triage_status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">
              {application.student_first_name} {application.student_last_name}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Application submitted {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>
          {application.triage_score !== null && (
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{application.triage_score}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Parent info */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-3">
            <User className="h-4 w-4 text-[var(--color-primary)]" /> Parent Information
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Name</dt>
              <dd className="font-medium text-[var(--color-foreground)]">{application.parent_first_name} {application.parent_last_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Email</dt>
              <dd className="font-medium text-[var(--color-foreground)]">{application.parent_email}</dd>
            </div>
            {application.parent_phone && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Phone</dt>
                <dd className="font-medium text-[var(--color-foreground)]">{application.parent_phone}</dd>
              </div>
            )}
            {application.faith_community && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Faith community</dt>
                <dd className="font-medium text-[var(--color-foreground)]">{application.faith_community}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Child info */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-3">
            <Baby className="h-4 w-4 text-[var(--color-primary)]" /> Child Information
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Name</dt>
              <dd className="font-medium text-[var(--color-foreground)]">{application.student_first_name} {application.student_last_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Date of birth</dt>
              <dd className="font-medium text-[var(--color-foreground)]">{application.student_dob}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Program</dt>
              <dd className="font-medium text-[var(--color-foreground)]">{application.program_type}</dd>
            </div>
            {application.desired_start_date && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Desired start</dt>
                <dd className="font-medium text-[var(--color-foreground)]">{application.desired_start_date}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Notes */}
      {application.notes && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-2">
            <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" /> Additional Notes
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line">{application.notes}</p>
        </div>
      )}

      {/* Triage notes */}
      {application.triage_notes && (
        <div className="rounded-[var(--radius)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)] mb-2">
            <AlertTriangle className="h-4 w-4" /> Triage Notes
          </h3>
          <p className="text-sm text-[var(--color-foreground)]">{application.triage_notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex flex-wrap gap-3">
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
          )}
          {onWaitlist && (
            <button
              onClick={onWaitlist}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors"
            >
              <Clock className="h-4 w-4" /> Waitlist
            </button>
          )}
          {onRequestInfo && (
            <button
              onClick={onRequestInfo}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <MessageSquare className="h-4 w-4" /> Request Info
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-destructive)] px-4 py-2.5 text-sm font-medium text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          )}
        </div>
      )}
    </div>
  )
}
