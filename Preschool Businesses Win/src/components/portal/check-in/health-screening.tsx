'use client'

// @anchor: cca.checkin.health-screening
// Quick toggle health screening questions at check-in.
// Yes = flagged for review. No = proceed.
// See CCA_BUILD_BRIEF.md §7

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { AlertTriangle, Check, ThermometerSun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HealthScreening as HealthScreeningData } from '@/lib/schemas/check-in'

interface HealthScreeningProps {
  studentName: string
  onComplete: (screening: HealthScreeningData) => void
  onCancel: () => void
  className?: string
}

interface ScreeningQuestion {
  key: keyof Omit<HealthScreeningData, 'notes'>
  label: string
  icon: typeof ThermometerSun
}

const questions: ScreeningQuestion[] = [
  { key: 'has_fever', label: 'Fever (100.4+ F)', icon: ThermometerSun },
  { key: 'has_rash', label: 'Rash or skin irritation', icon: AlertTriangle },
  { key: 'has_vomiting', label: 'Vomiting', icon: AlertTriangle },
  { key: 'has_diarrhea', label: 'Diarrhea', icon: AlertTriangle },
]

export function HealthScreening({
  studentName,
  onComplete,
  onCancel,
  className,
}: HealthScreeningProps) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    has_fever: false,
    has_rash: false,
    has_vomiting: false,
    has_diarrhea: false,
  })
  const [notes, setNotes] = useState('')

  const hasSymptoms = Object.values(answers).some(Boolean)

  const toggle = (key: string) => {
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = () => {
    onComplete({
      has_fever: answers.has_fever,
      has_rash: answers.has_rash,
      has_vomiting: answers.has_vomiting,
      has_diarrhea: answers.has_diarrhea,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          Health Screening
        </h2>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Does {studentName} have any of the following today?
        </p>
      </div>

      {/* Symptom toggles */}
      <div className="flex flex-col gap-3">
        {questions.map((q) => {
          const isYes = answers[q.key]
          const Icon = q.icon
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => toggle(q.key)}
              className={cn(
                'flex items-center gap-4 rounded-[var(--radius,0.75rem)] border-2 p-4 transition-colors',
                'min-h-[56px] text-left',
                isYes
                  ? 'border-[var(--color-warning)] bg-[var(--color-warning)]/10'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]',
              )}
              role="switch"
              aria-checked={isYes}
              aria-label={q.label}
            >
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0',
                  isYes ? 'text-[var(--color-warning)]' : 'text-[var(--color-muted-foreground)]',
                )}
              />
              <span className="flex-1 font-medium text-[var(--color-foreground)]">
                {q.label}
              </span>
              <div
                className={cn(
                  'flex h-8 w-14 items-center rounded-full px-1 transition-colors',
                  isYes ? 'justify-end bg-[var(--color-warning)]' : 'justify-start bg-[var(--color-border)]',
                )}
              >
                <div className="h-6 w-6 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Warning when symptoms detected */}
      {hasSymptoms && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius,0.75rem)] border-2 border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-4"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
          <div>
            <p className="font-semibold text-[var(--color-foreground)]">
              Symptoms reported
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {studentName} will be flagged for teacher review. Staff will
              monitor symptoms throughout the day.
            </p>
          </div>
        </div>
      )}

      {/* Notes field (optional, shown when symptoms present) */}
      {hasSymptoms && (
        <div>
          <label
            htmlFor="health-notes"
            className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
          >
            Additional notes (optional)
          </label>
          <textarea
            id="health-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            className={cn(
              'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3',
              'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
              'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'resize-none',
            )}
            placeholder="Any details for the teacher..."
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          className="flex-1"
        >
          <Check className="h-5 w-5" />
          {hasSymptoms ? 'Continue with Flag' : 'All Clear'}
        </Button>
      </div>
    </div>
  )
}
