// @anchor: cca.applications.pipeline.timeline
// Renders the full pipeline journey for an application.

import { PIPELINE_STAGE_LABELS } from './pipeline-stage-badge'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

export interface PipelineStep {
  id: string
  step_type: string
  status: string
  notes: string | null
  completed_at: string | null
  created_at: string
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
    <ol className="space-y-4">
      {sorted.map((step, idx) => {
        const isCompleted = step.status === 'completed'
        const isActive = step.status === 'active'
        const Icon = isCompleted ? CheckCircle2 : isActive ? Clock : Circle
        return (
          <li key={step.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <div
                className={
                  isCompleted
                    ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : isActive
                    ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
                    : 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }
              >
                <Icon className="h-4 w-4" />
              </div>
              {idx < sorted.length - 1 && (
                <div className="h-full w-px flex-1 bg-[var(--color-border)]" />
              )}
            </div>
            <div className="pb-4">
              <div className="text-sm font-semibold text-[var(--color-foreground)]">
                {PIPELINE_STAGE_LABELS[step.step_type] ?? step.step_type}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                {new Date(step.completed_at ?? step.created_at).toLocaleString()}
              </div>
              {step.notes && (
                <div className="mt-1 text-sm text-[var(--color-foreground)]/80">{step.notes}</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
