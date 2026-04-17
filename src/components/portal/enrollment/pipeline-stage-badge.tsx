// @anchor: cca.applications.pipeline.badge
// Color-coded badge for pipeline stage display.

import { cn } from '@/lib/cn'

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  form_submitted: 'Form Submitted',
  under_review: 'Under Review',
  info_requested: 'Info Requested',
  interview_invited: 'Interview Invited',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  enrolled: 'Enrolled',
  waitlisted: 'Waitlisted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const STAGE_CLASSES: Record<string, string> = {
  form_submitted: 'bg-[var(--color-muted)] text-[var(--color-foreground)]',
  under_review: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  info_requested: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  interview_invited: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]',
  interview_scheduled: 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]',
  interview_completed: 'bg-[var(--color-secondary)]/25 text-[var(--color-secondary)]',
  offer_sent: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  offer_accepted: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]',
  enrolled: 'bg-[var(--color-primary)]/25 text-[var(--color-primary)]',
  waitlisted: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  rejected: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
  withdrawn: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
}

export function PipelineStageBadge({
  stage,
  className,
}: {
  stage: string | null | undefined
  className?: string
}) {
  const key = stage ?? 'form_submitted'
  const label = PIPELINE_STAGE_LABELS[key] ?? key
  const variant = STAGE_CLASSES[key] ?? STAGE_CLASSES.form_submitted

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant,
        className,
      )}
    >
      {label}
    </span>
  )
}
