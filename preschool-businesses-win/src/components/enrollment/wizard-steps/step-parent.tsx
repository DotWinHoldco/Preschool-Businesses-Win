'use client'

// @anchor: cca.enrollment.step-parent
// Step 1: Parent/guardian info.

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RHFFormField } from '@/components/ui/form-field'
import type { EnrollmentApplicationData } from '@/lib/schemas/enrollment'

export function StepParent() {
  const { control } = useFormContext<EnrollmentApplicationData>()

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <RHFFormField
          name="first_name"
          control={control}
          label="First name"
          required
          render={({ field, error }) => (
            <Input {...field} placeholder="Jane" error={!!error} autoComplete="given-name" />
          )}
        />
        <RHFFormField
          name="last_name"
          control={control}
          label="Last name"
          required
          render={({ field, error }) => (
            <Input {...field} placeholder="Doe" error={!!error} autoComplete="family-name" />
          )}
        />
      </div>

      <RHFFormField
        name="email"
        control={control}
        label="Email"
        required
        render={({ field, error }) => (
          <Input {...field} type="email" placeholder="jane@example.com" error={!!error} autoComplete="email" />
        )}
      />

      <RHFFormField
        name="phone"
        control={control}
        label="Phone number"
        required
        render={({ field, error }) => (
          <Input {...field} type="tel" placeholder="(214) 555-0123" error={!!error} autoComplete="tel" />
        )}
      />

      <RHFFormField
        name="relationship_to_child"
        control={control}
        label="Relationship to child"
        required
        render={({ field, error }) => (
          <Select {...field} error={!!error}>
            <option value="">Select...</option>
            <option value="parent">Parent</option>
            <option value="grandparent">Grandparent</option>
            <option value="guardian">Guardian</option>
          </Select>
        )}
      />
    </div>
  )
}
