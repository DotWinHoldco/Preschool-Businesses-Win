// @anchor: cca.applications.pipeline.timeline
// Renders the full pipeline audit trail for an application.

import { PIPELINE_STAGE_LABELS } from './pipeline-stage-badge'
import { CheckCircle2, Circle, Clock, AlertCircle, MessageSquare } from 'lucide-react'

export interface PipelineStep {
  id: string
  step_type: string
  status: string
  notes: string | null
  completed_at: string | null
  completed_by: string | null
  created_at: string
  metadata: Record<string, unknown>
  actor_name?: string | null
}

const STEP_ICONS: Record<string, typeof CheckCircle2> = {
  info_requested: AlertCircle,
  rejected: AlertCircle,
  withdrawn: AlertCircle,
}

export function PipelineTimeline({ steps }: { steps: PipelineStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        No pipeline activity yet.
      </div>
    )
  }

  const sorted = [...steps].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return (
    <ol className="space-y-1">
      {sorted.map((step, idx) => {
        const isCompleted = step.status === 'completed'
        const isActive = step.status === 'active'
        const SpecialIcon = STEP_ICONS[step.step_type]
        const Icon = SpecialIcon ?? (isCompleted ? CheckCircle2 : isActive ? Clock : Circle)
        const ts = step.completed_at ?? step.created_at
        const date = new Date(ts)

        return (
          <li key={step.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <div
                className={
                  isCompleted
                    ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : isActive
                      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
                      : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }
              >
                <Icon className="h-4 w-4" />
              </div>
              {idx < sorted.length - 1 && (
                <div className="h-full w-px flex-1 bg-[var(--color-border)]" />
              )}
            </div>
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {PIPELINE_STAGE_LABELS[step.step_type] ?? step.step_type}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {step.actor_name && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  by {step.actor_name}
                </p>
              )}
              {step.notes && (
                <div className="mt-1.5 flex gap-1.5 rounded-md bg-[var(--color-muted)]/50 p-2">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]" />
                  <p className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap">
                    {step.notes}
                  </p>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
