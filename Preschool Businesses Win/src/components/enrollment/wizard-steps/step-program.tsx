'use client'

// @anchor: cca.enrollment.step-program
// Step 3: Program selection, start date, schedule preference, how heard.

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RHFFormField } from '@/components/ui/form-field'
import { cn } from '@/lib/cn'
import type { EnrollmentApplicationData } from '@/lib/schemas/enrollment'

const PROGRAM_OPTIONS = [
  { value: 'infant', label: 'Infants', desc: '6 wks \u2013 23 mo' },
  { value: 'toddler', label: 'Toddlers / Preschool', desc: 'Ages 2\u20134' },
  { value: 'prek', label: 'Pre-K', desc: 'Ages 4\u20135' },
  { value: 'before_after', label: 'Before & After Care', desc: 'Extended hours' },
  { value: 'summer', label: 'Summer Camp', desc: 'Seasonal' },
] as const

export function StepProgram() {
  const { control, watch, setValue } = useFormContext<EnrollmentApplicationData>()
  const selectedProgram = watch('program_type')

  return (
    <div className="space-y-6">
      {/* Segmented program selector */}
      <RHFFormField
        name="program_type"
        control={control}
        label="Program of interest"
        required
        render={({ error }) => (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAM_OPTIONS.map((opt) => {
              const isSelected = selectedProgram === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('program_type', opt.value as EnrollmentApplicationData['program_type'], { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-[var(--radius,0.75rem)] border p-4 text-left transition-all',
                    'min-h-[48px]',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isSelected
                      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-card)]',
                    error && !selectedProgram && 'border-[var(--color-destructive)]',
                  )}
                  style={{
                    ...(isSelected ? { borderColor: 'var(--color-primary)' } : {}),
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isSelected
                        ? 'var(--color-primary)'
                        : 'var(--color-foreground)',
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {opt.desc}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFFormField
          name="desired_start_date"
          control={control}
          label="Desired start date"
          required
          render={({ field, error }) => (
            <Input {...field} type="date" error={!!error} />
          )}
        />
        <RHFFormField
          name="schedule_preference"
          control={control}
          label="Schedule preference"
          required
          render={({ field, error }) => (
            <Select {...field} error={!!error}>
              <option value="">Select...</option>
              <option value="full_day">Full day</option>
              <option value="half_day_am">Half day (morning)</option>
              <option value="half_day_pm">Half day (afternoon)</option>
            </Select>
          )}
        />
      </div>

      <RHFFormField
        name="how_heard"
        control={control}
        label="How did you hear about CCA?"
        render={({ field, error }) => (
          <Input
            {...field}
            placeholder="e.g., Google, friend referral, church"
            error={!!error}
          />
        )}
      />
    </div>
  )
}
