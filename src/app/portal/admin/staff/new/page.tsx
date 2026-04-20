// @anchor: cca.staff.create-page
// Create staff member form with role selection and basic info.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaff, type CreateStaffInput } from '@/lib/actions/staff/create-staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldWrapper } from '@/components/ui/form-field'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'lead_teacher', label: 'Lead Teacher' },
  { value: 'assistant_teacher', label: 'Assistant Teacher' },
  { value: 'aide', label: 'Aide' },
  { value: 'front_desk', label: 'Front Desk' },
] as const

export default function NewStaffPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const input: CreateStaffInput = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      role: formData.get('role') as CreateStaffInput['role'],
      hire_date: (formData.get('hire_date') as string) || '',
    }

    const result = await createStaff(input)

    if (result.ok) {
      router.push('/portal/admin/staff')
    } else {
      setServerError(result.error || 'Something went wrong')
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Add Staff Member</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Create a new staff profile. You can assign certifications and schedules after.
        </p>
      </div>

      {serverError && (
        <div
          className="rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="First Name" error={fieldErrors.first_name} required>
                <Input name="first_name" error={!!fieldErrors.first_name} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Last Name" error={fieldErrors.last_name} required>
                <Input name="last_name" error={!!fieldErrors.last_name} />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Email" error={fieldErrors.email} required>
                <Input name="email" type="email" error={!!fieldErrors.email} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Phone" error={fieldErrors.phone}>
                <Input name="phone" type="tel" placeholder="(555) 123-4567" />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Role" error={fieldErrors.role} required>
                <Select name="role" defaultValue="">
                  <option value="" disabled>
                    Select role...
                  </option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormFieldWrapper>
              <FormFieldWrapper label="Hire Date" error={fieldErrors.hire_date}>
                <Input name="hire_date" type="date" />
              </FormFieldWrapper>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/portal/admin/staff')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Staff Member
          </Button>
        </div>
      </form>
    </div>
  )
}
