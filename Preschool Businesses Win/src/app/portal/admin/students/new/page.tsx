// @anchor: cca.student.create-page
// Create student form with medical profile fields.
// Uses 'use client' for react-hook-form + Zod resolver.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateStudentSchema, type CreateStudentInput } from '@/lib/schemas/student'
import { createStudent } from '@/lib/actions/student/create-student'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldWrapper } from '@/components/ui/form-field'

export default function NewStudentPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateStudentSchema) as any,
    defaultValues: {
      enrollment_status: 'applied',
    } as Partial<CreateStudentInput>,
  })

  const onSubmit = async (data: CreateStudentInput) => {
    setServerError(null)
    const result = await createStudent(data)
    if (result.ok && result.studentId) {
      router.push(`/portal/admin/students/${result.studentId}`)
    } else {
      setServerError(result.error || 'Something went wrong')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Add New Student</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Create a student record. You can add family links and classroom assignments after.
        </p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register('first_name')} error={!!errors.first_name} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register('last_name')} error={!!errors.last_name} />
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper label="Preferred Name" error={errors.preferred_name?.message}>
              <Input {...register('preferred_name')} placeholder="Nickname or preferred name" />
            </FormFieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Date of Birth" error={errors.date_of_birth?.message} required>
                <Input type="date" {...register('date_of_birth')} error={!!errors.date_of_birth} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Gender" error={errors.gender?.message}>
                <Select {...register('gender')}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Enrollment Status" error={errors.enrollment_status?.message}>
                <Select {...register('enrollment_status')}>
                  <option value="applied">Applied</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="active">Active</option>
                  <option value="waitlisted">Waitlisted</option>
                </Select>
              </FormFieldWrapper>
              <FormFieldWrapper label="Enrollment Date" error={errors.enrollment_date?.message}>
                <Input type="date" {...register('enrollment_date')} />
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper label="Internal Notes" error={errors.notes_internal?.message}>
              <Textarea
                {...register('notes_internal')}
                placeholder="Staff-only notes about this student..."
                autoResize
              />
            </FormFieldWrapper>
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Optional. You can add allergies after creating the student.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Blood Type" error={errors.blood_type?.message}>
                <Input {...register('blood_type')} placeholder="e.g., A+" />
              </FormFieldWrapper>
              <FormFieldWrapper label="Primary Physician" error={errors.primary_physician_name?.message}>
                <Input {...register('primary_physician_name')} />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Physician Phone" error={errors.primary_physician_phone?.message}>
                <Input type="tel" {...register('primary_physician_phone')} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Insurance Provider" error={errors.insurance_provider?.message}>
                <Input {...register('insurance_provider')} />
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper label="Insurance Policy Number" error={errors.insurance_policy_number?.message}>
              <Input {...register('insurance_policy_number')} />
            </FormFieldWrapper>

            <FormFieldWrapper label="Special Needs Notes" error={errors.special_needs_notes?.message}>
              <Textarea
                {...register('special_needs_notes')}
                placeholder="Any special needs, accommodations, or important care instructions..."
                autoResize
              />
            </FormFieldWrapper>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/portal/admin/students')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Student
          </Button>
        </div>
      </form>
    </div>
  )
}
