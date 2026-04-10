// @anchor: cca.classroom.create-page
// Create classroom form with capacity and ratio settings.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateClassroomSchema, type CreateClassroomInput } from '@/lib/schemas/classroom'
import { createClassroom } from '@/lib/actions/classroom/create-classroom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldWrapper } from '@/components/ui/form-field'

export default function NewClassroomPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassroomInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateClassroomSchema) as any,
    defaultValues: {
      status: 'active',
      age_range_min_months: 0,
      age_range_max_months: 60,
      capacity: 20,
    },
  })

  const watchName = watch('name')

  const onSubmit = async (data: CreateClassroomInput) => {
    setServerError(null)
    const result = await createClassroom(data)
    if (result.ok && result.classroomId) {
      router.push(`/portal/admin/classrooms/${result.classroomId}`)
    } else {
      setServerError(result.error || 'Something went wrong')
    }
  }

  // Auto-generate slug from name
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Add New Classroom</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Create a classroom with capacity and ratio settings.
        </p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Classroom Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Classroom Name" error={errors.name?.message} required>
                <Input
                  {...register('name')}
                  placeholder="e.g., Butterfly Room"
                  error={!!errors.name}
                />
              </FormFieldWrapper>
              <FormFieldWrapper
                label="Slug"
                error={errors.slug?.message}
                required
                description="URL-friendly identifier"
              >
                <Input
                  {...register('slug')}
                  placeholder={watchName ? generateSlug(watchName) : 'e.g., butterfly-room'}
                  error={!!errors.slug}
                />
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper label="Room Number" error={errors.room_number?.message}>
              <Input {...register('room_number')} placeholder="e.g., 101" />
            </FormFieldWrapper>

            <FormFieldWrapper label="Status" error={errors.status?.message}>
              <Select {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="summer_only">Summer Only</option>
              </Select>
            </FormFieldWrapper>

            <FormFieldWrapper label="Description" error={errors.description?.message}>
              <Textarea
                {...register('description')}
                placeholder="Brief description of this classroom..."
                autoResize
              />
            </FormFieldWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Range &amp; Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper
                label="Minimum Age (months)"
                error={errors.age_range_min_months?.message}
                required
              >
                <Input
                  type="number"
                  min={0}
                  max={240}
                  {...register('age_range_min_months', { valueAsNumber: true })}
                  error={!!errors.age_range_min_months}
                />
              </FormFieldWrapper>
              <FormFieldWrapper
                label="Maximum Age (months)"
                error={errors.age_range_max_months?.message}
                required
              >
                <Input
                  type="number"
                  min={0}
                  max={240}
                  {...register('age_range_max_months', { valueAsNumber: true })}
                  error={!!errors.age_range_max_months}
                />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper
                label="Capacity"
                error={errors.capacity?.message}
                required
                description="Maximum number of students"
              >
                <Input
                  type="number"
                  min={1}
                  max={100}
                  {...register('capacity', { valueAsNumber: true })}
                  error={!!errors.capacity}
                />
              </FormFieldWrapper>
              <FormFieldWrapper
                label="Required Ratio"
                error={errors.ratio_required?.message}
                description="Max students per staff member (from TX DFPS)"
              >
                <Input
                  type="number"
                  min={1}
                  max={100}
                  step="0.1"
                  {...register('ratio_required', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                />
              </FormFieldWrapper>
            </div>

            {/* Texas DFPS ratio reference */}
            <div className="rounded-lg bg-[var(--color-muted)] p-3">
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)]">
                Texas DFPS Chapter 746 Ratios (reference)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
                <span>0-11 mo: 4:1</span>
                <span>12-17 mo: 5:1</span>
                <span>18-23 mo: 9:1</span>
                <span>24-35 mo: 11:1</span>
                <span>36-47 mo: 15:1</span>
                <span>48-59 mo: 18:1</span>
                <span>60-71 mo: 22:1</span>
                <span>72+ mo: 26:1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/portal/admin/classrooms')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Classroom
          </Button>
        </div>
      </form>
    </div>
  )
}
