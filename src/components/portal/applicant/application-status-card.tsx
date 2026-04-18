'use client'

import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const HAPPY_PATH_STAGES = [
  { key: 'form_submitted', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'interview_invited', label: 'Interview Invited' },
  { key: 'interview_scheduled', label: 'Interview Scheduled' },
  { key: 'interview_completed', label: 'Interview Complete' },
  { key: 'offer_sent', label: 'Offer Sent' },
  { key: 'enrolled', label: 'Enrolled' },
] as const

const TERMINAL_STAGES: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  waitlisted: { label: 'On Waitlist', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  rejected: { label: 'Not accepted at this time', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  withdrawn: { label: 'Application withdrawn', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: XCircle },
}

interface PipelineStep {
  step_type: string
  status: string
  created_at: string
  completed_at: string | null
}

interface Props {
  childName: string
  programType: string
  pipelineStage: string
  steps: PipelineStep[]
  submittedAt: string
}

export function ApplicationStatusCard({ childName, programType, pipelineStage, steps, submittedAt }: Props) {
  const terminal = TERMINAL_STAGES[pipelineStage]

  const currentIndex = HAPPY_PATH_STAGES.findIndex((s) => s.key === pipelineStage)
  const completedSteps = new Set(
    steps.filter((s) => s.status === 'completed').map((s) => s.step_type),
  )

  const getStepDate = (key: string): string | null => {
    const step = steps.find((s) => s.step_type === key)
    if (!step) return null
    const date = step.completed_at ?? step.created_at
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const programLabel = programType
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{childName}</h3>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{programLabel} Program</p>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Submitted {new Date(submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="px-5 py-5">
        {terminal ? (
          <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', terminal.color)}>
            <terminal.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{terminal.label}</span>
          </div>
        ) : (
          <div className="relative">
            {/* Progress bar background */}
            <div className="flex items-center gap-0">
              {HAPPY_PATH_STAGES.map((stage, i) => {
                const isCompleted = completedSteps.has(stage.key) || i < currentIndex
                const isCurrent = stage.key === pipelineStage
                const isFuture = !isCompleted && !isCurrent

                return (
                  <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {i > 0 && (
                      <div
                        className={cn(
                          'absolute top-3 right-1/2 w-full h-0.5 -z-10',
                          isCompleted || isCurrent ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                        )}
                      />
                    )}

                    {/* Step dot */}
                    <div
                      className={cn(
                        'relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all',
                        isCompleted && 'bg-green-500 text-white',
                        isCurrent && 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20',
                        isFuture && 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[9px]">{i + 1}</span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'mt-1.5 text-[10px] leading-tight text-center px-0.5',
                        isCurrent ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]',
                      )}
                    >
                      {stage.label}
                    </span>

                    {/* Date */}
                    {(isCompleted || isCurrent) && getStepDate(stage.key) && (
                      <span className="mt-0.5 text-[9px] text-[var(--color-muted-foreground)]">
                        {getStepDate(stage.key)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
