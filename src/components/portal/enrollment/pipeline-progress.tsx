// @anchor: cca.enrollment.pipeline-progress
// Horizontal progress bar visualization for the 12-stage enrollment pipeline.

import { cn } from '@/lib/cn'
import { PIPELINE_STAGE_LABELS } from './pipeline-stage-badge'

const MAIN_STAGES = [
  'form_submitted',
  'under_review',
  'interview_invited',
  'interview_scheduled',
  'interview_completed',
  'offer_sent',
  'offer_accepted',
  'enrolled',
] as const

const BRANCH_STAGES = ['info_requested', 'waitlisted', 'rejected', 'withdrawn'] as const

function stageIndex(stage: string): number {
  return MAIN_STAGES.indexOf(stage as (typeof MAIN_STAGES)[number])
}

export function PipelineProgress({
  currentStage,
  className,
}: {
  currentStage: string
  className?: string
}) {
  const isBranch = (BRANCH_STAGES as readonly string[]).includes(currentStage)
  const currentIdx = stageIndex(currentStage)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center">
        {MAIN_STAGES.map((stage, idx) => {
          const isCompleted = !isBranch && currentIdx > idx
          const isCurrent = !isBranch && currentIdx === idx
          const isPast = isBranch && idx === 0
          const isLast = idx === MAIN_STAGES.length - 1
          const connectorFilled = (isCompleted || isPast) && (stageIndex(MAIN_STAGES[idx + 1]) <= currentIdx || isPast)

          return (
            <div key={stage} className={cn('flex items-center', isLast ? 'shrink-0' : 'flex-1')}>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isCompleted
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : isCurrent
                        ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : isPast
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                          : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                  )}
                >
                  {isCompleted || isPast ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-tight text-center w-[72px]',
                    isCurrent
                      ? 'font-semibold text-[var(--color-foreground)]'
                      : 'text-[var(--color-muted-foreground)]',
                  )}
                >
                  {PIPELINE_STAGE_LABELS[stage]}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'mt-[-18px] h-0.5 flex-1 min-w-2',
                    connectorFilled
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {isBranch && (
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              currentStage === 'rejected'
                ? 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]'
                : currentStage === 'withdrawn'
                  ? 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
            )}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {currentStage === 'rejected' ? (
                <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
              ) : currentStage === 'withdrawn' ? (
                <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>
              ) : (
                <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
              )}
            </svg>
            Currently: {PIPELINE_STAGE_LABELS[currentStage] ?? currentStage}
          </div>
        </div>
      )}
    </div>
  )
}
