// @anchor: platform.form-wizard.step-indicator

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export function WizardStepIndicator({
  current,
  steps,
}: {
  current: number
  steps: { id: string; label: string }[]
}) {
  if (steps.length <= 1) return null
  return (
    <ol className="flex items-center justify-between gap-1">
      {steps.map((s, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <li key={s.id} className="flex flex-1 items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                active && 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]',
                !done && !active && 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
              )}
              title={s.label}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-px flex-1 transition-colors',
                  done ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
