'use client'

// @anchor: cca.enrollment.step-additional
// Step 4: Additional info — faith, sibling, notes, agreement.

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RHFFormField } from '@/components/ui/form-field'
import type { EnrollmentApplicationData } from '@/lib/schemas/enrollment'

export function StepAdditional() {
  const { control, watch, register, formState: { errors } } = useFormContext<EnrollmentApplicationData>()
  const siblingEnrolled = watch('sibling_enrolled')

  return (
    <div className="space-y-5">
      <RHFFormField
        name="faith_community"
        control={control}
        label="Faith community or church"
        description="Optional. Helps us understand your family."
        render={({ field, error }) => (
          <Input
            {...field}
            placeholder="e.g., First Baptist Crandall"
            error={!!error}
          />
        )}
      />

      <div className="space-y-3">
        <Checkbox
          label="A sibling is currently enrolled at CCA"
          {...register('sibling_enrolled')}
        />
        {siblingEnrolled && (
          <RHFFormField
            name="sibling_name"
            control={control}
            label="Sibling's name"
            render={({ field, error }) => (
              <Input {...field} placeholder="Sibling name" error={!!error} />
            )}
          />
        )}
      </div>

      <RHFFormField
        name="notes"
        control={control}
        label="Anything else we should know?"
        description="Optional. Share any questions or additional information."
        render={({ field, error }) => (
          <Textarea
            {...field}
            placeholder="e.g., Questions about scheduling, specific classroom requests, etc."
            error={!!error}
            rows={3}
          />
        )}
      />

      <div className="pt-2">
        <Checkbox
          label="I agree to be contacted by Crandall Christian Academy regarding this application."
          {...register('agree_to_contact')}
          error={!!errors.agree_to_contact}
        />
        {errors.agree_to_contact && (
          <p
            role="alert"
            className="mt-1.5 text-sm"
            style={{ color: 'var(--color-destructive)' }}
          >
            {errors.agree_to_contact.message}
          </p>
        )}
      </div>
    </div>
  )
}
