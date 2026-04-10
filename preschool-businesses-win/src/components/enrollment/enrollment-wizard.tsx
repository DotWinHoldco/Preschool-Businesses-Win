'use client'

// @anchor: cca.enrollment.wizard
// 4-step enrollment wizard — react-hook-form + zod per step.
// Final submit calls submitEnrollment server action.

import { useState, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/cn'
import {
  Wizard,
  WizardSteps,
  WizardPanel,
  WizardNav,
} from '@/components/ui/wizard'
import { StepParent } from './wizard-steps/step-parent'
import { StepChild } from './wizard-steps/step-child'
import { StepProgram } from './wizard-steps/step-program'
import { StepAdditional } from './wizard-steps/step-additional'
import {
  EnrollmentApplicationSchema,
  StepParentSchema,
  StepChildSchema,
  StepProgramSchema,
  type EnrollmentApplicationData,
} from '@/lib/schemas/enrollment'
import { submitEnrollment } from '@/lib/actions/enrollment/submit-enrollment'
import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 'parent', label: 'Parent Info' },
  { id: 'child', label: 'Child Info' },
  { id: 'program', label: 'Program' },
  { id: 'additional', label: 'Additional' },
] as const

const STEP_SCHEMAS = [
  StepParentSchema,
  StepChildSchema,
  StepProgramSchema,
  // Step 4 validated on final submit
  null,
] as const

export function EnrollmentWizard() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<EnrollmentApplicationData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(EnrollmentApplicationSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      relationship_to_child: 'parent',
      child_first_name: '',
      child_last_name: '',
      child_dob: '',
      gender: 'male',
      allergies_or_medical: '',
      special_needs: '',
      program_type: 'prek',
      desired_start_date: '',
      schedule_preference: 'full_day',
      how_heard: '',
      faith_community: '',
      sibling_enrolled: false,
      sibling_name: '',
      notes: '',
      agree_to_contact: false,
    },
    mode: 'onTouched',
  })

  const validateStep = useCallback(
    async (index: number): Promise<boolean> => {
      const schema = STEP_SCHEMAS[index]
      if (!schema) return true

      // Validate only the fields for this step
      const fields = Object.keys(schema.shape) as Array<keyof EnrollmentApplicationData>
      const result = await form.trigger(fields)
      return result
    },
    [form],
  )

  const handleSubmit = useCallback(async () => {
    // Trigger full form validation
    const isValid = await form.trigger()
    if (!isValid) return

    setSubmitting(true)
    setSubmitError(null)

    const data = form.getValues()

    const result = await submitEnrollment({
      ...data,
      website: '', // Honeypot
    })

    setSubmitting(false)

    if (result.ok) {
      setSubmitted(true)
    } else {
      setSubmitError(result.error ?? 'Something went wrong. Please try again.')
    }
  }, [form])

  // Success state
  if (submitted) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-6 rounded-[var(--radius,0.75rem)] border p-8 md:p-12 text-center',
        )}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-card)',
        }}
      >
        <div
          className="inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-primary) 12%, transparent)`,
          }}
        >
          <CheckCircle2
            size={32}
            style={{ color: 'var(--color-primary)' }}
          />
        </div>
        <h3
          className="text-2xl font-bold text-balance"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-foreground)',
          }}
        >
          Application received!
        </h3>
        <p
          className="max-w-md text-base leading-relaxed text-pretty"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Thank you for your interest in Crandall Christian Academy. We&rsquo;ll
          review your application and be in touch within two business days to
          schedule a tour.
        </p>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <div
        className={cn(
          'rounded-[var(--radius,0.75rem)] border p-6 md:p-10',
        )}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-card)',
        }}
      >
        {/* Honeypot — invisible to humans, bots fill it */}
        <div
          className="absolute opacity-0 pointer-events-none h-0 overflow-hidden"
          aria-hidden="true"
          tabIndex={-1}
        >
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Wizard
          steps={[...STEPS]}
          onBeforeNext={validateStep}
        >
          <WizardSteps className="mb-8" />

          <WizardPanel stepId="parent">
            <StepParent />
          </WizardPanel>

          <WizardPanel stepId="child">
            <StepChild />
          </WizardPanel>

          <WizardPanel stepId="program">
            <StepProgram />
          </WizardPanel>

          <WizardPanel stepId="additional">
            <StepAdditional />
          </WizardPanel>

          {submitError && (
            <p
              role="alert"
              className="text-sm text-center"
              style={{ color: 'var(--color-destructive)' }}
            >
              {submitError}
            </p>
          )}

          <WizardNav
            submitLabel="Submit application"
            onSubmit={handleSubmit}
            loading={submitting}
            className="mt-6 pt-6 border-t"
          />
        </Wizard>
      </div>
    </FormProvider>
  )
}
