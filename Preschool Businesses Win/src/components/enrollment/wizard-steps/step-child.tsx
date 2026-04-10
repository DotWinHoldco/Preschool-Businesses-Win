'use client'

// @anchor: cca.enrollment.step-child
// Step 2: Child info — name, dob, gender, medical.

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RHFFormField } from '@/components/ui/form-field'
import type { EnrollmentApplicationData } from '@/lib/schemas/enrollment'

export function StepChild() {
  const { control } = useFormContext<EnrollmentApplicationData>()

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <RHFFormField
          name="child_first_name"
          control={control}
          label="Child's first name"
          required
          render={({ field, error }) => (
            <Input {...field} placeholder="Sophia" error={!!error} />
          )}
        />
        <RHFFormField
          name="child_last_name"
          control={control}
          label="Child's last name"
          required
          render={({ field, error }) => (
            <Input {...field} placeholder="Doe" error={!!error} />
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFFormField
          name="child_dob"
          control={control}
          label="Date of birth"
          required
          render={({ field, error }) => (
            <Input {...field} type="date" error={!!error} />
          )}
        />
        <RHFFormField
          name="gender"
          control={control}
          label="Gender"
          required
          render={({ field, error }) => (
            <Select {...field} error={!!error}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          )}
        />
      </div>

      <RHFFormField
        name="allergies_or_medical"
        control={control}
        label="Allergies or medical conditions"
        description="List any allergies, medications, or medical information we should know about."
        render={({ field, error }) => (
          <Textarea
            {...field}
            placeholder="e.g., Peanut allergy (severe), uses EpiPen"
            error={!!error}
            rows={3}
          />
        )}
      />

      <RHFFormField
        name="special_needs"
        control={control}
        label="Special needs or accommodations"
        description="Optional. We want to support every child."
        render={({ field, error }) => (
          <Textarea
            {...field}
            placeholder="e.g., Speech therapy, sensory sensitivities"
            error={!!error}
            rows={3}
          />
        )}
      />
    </div>
  )
}
