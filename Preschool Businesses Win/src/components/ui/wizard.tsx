'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { Button } from './button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardStep {
  id: string
  label: string
}

interface WizardCtx {
  steps: WizardStep[]
  currentIndex: number
  currentStep: WizardStep
  isFirst: boolean
  isLast: boolean
  next: () => void
  back: () => void
  goTo: (index: number) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const Ctx = createContext<WizardCtx>({
  steps: [],
  currentIndex: 0,
  currentStep: { id: '', label: '' },
  isFirst: true,
  isLast: true,
  next: () => {},
  back: () => {},
  goTo: () => {},
})

export const useWizard = () => useContext(Ctx)

// ---------------------------------------------------------------------------
// Wizard root
// ---------------------------------------------------------------------------

export interface WizardProps {
  steps: WizardStep[]
  /** Optional validation before advancing. Return true to allow. */
  onBeforeNext?: (currentIndex: number) => boolean | Promise<boolean>
  children: ReactNode
  className?: string
}

function Wizard({ steps, onBeforeNext, children, className }: WizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = useCallback(async () => {
    if (currentIndex >= steps.length - 1) return
    if (onBeforeNext) {
      const ok = await onBeforeNext(currentIndex)
      if (!ok) return
    }
    setCurrentIndex((i) => i + 1)
  }, [currentIndex, steps.length, onBeforeNext])

  const back = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) setCurrentIndex(index)
    },
    [steps.length],
  )

  const ctx: WizardCtx = {
    steps,
    currentIndex,
    currentStep: steps[currentIndex],
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
    next,
    back,
    goTo,
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className={cn('flex flex-col gap-8', className)}>{children}</div>
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Step indicators
// ---------------------------------------------------------------------------

export interface WizardStepsProps {
  className?: string
}

function WizardSteps({ className }: WizardStepsProps) {
  const { steps, currentIndex } = useWizard()

  return (
    <nav aria-label="Wizard progress" className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => {
        const isComplete = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={step.id} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  'h-px w-8 transition-colors md:w-12',
                  isComplete ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                )}
                aria-hidden="true"
              />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isComplete
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : isCurrent
                      ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium md:inline',
                  isCurrent ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]',
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Panel (only renders for the active step)
// ---------------------------------------------------------------------------

export interface WizardPanelProps {
  stepId: string
  children: ReactNode
  className?: string
}

function WizardPanel({ stepId, children, className }: WizardPanelProps) {
  const { currentStep } = useWizard()
  if (currentStep.id !== stepId) return null
  return <div className={className}>{children}</div>
}

// ---------------------------------------------------------------------------
// Navigation buttons
// ---------------------------------------------------------------------------

export interface WizardNavProps {
  nextLabel?: string
  backLabel?: string
  submitLabel?: string
  onSubmit?: () => void
  loading?: boolean
  className?: string
}

function WizardNav({
  nextLabel = 'Continue',
  backLabel = 'Back',
  submitLabel = 'Submit',
  onSubmit,
  loading = false,
  className,
}: WizardNavProps) {
  const { isFirst, isLast, next, back } = useWizard()

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div>
        {!isFirst && (
          <Button variant="ghost" onClick={back} type="button">
            {backLabel}
          </Button>
        )}
      </div>
      <div>
        {isLast ? (
          <Button onClick={onSubmit} loading={loading} type="submit">
            {submitLabel}
          </Button>
        ) : (
          <Button onClick={next} type="button">
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export { Wizard, WizardSteps, WizardPanel, WizardNav }
