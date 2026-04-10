// @anchor: cca.family.create-page
// Create family form.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateFamilySchema, type CreateFamilyInput } from '@/lib/schemas/family'
import { createFamily } from '@/lib/actions/family/create-family'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldWrapper } from '@/components/ui/form-field'

export default function NewFamilyPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateFamilySchema) as any,
  })

  const onSubmit = async (data: CreateFamilyInput) => {
    setServerError(null)
    const result = await createFamily(data)
    if (result.ok && result.familyId) {
      router.push(`/portal/admin/families/${result.familyId}`)
    } else {
      setServerError(result.error || 'Something went wrong')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Add New Family</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Create a family record. You can add members and link students after.
        </p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Family Info */}
        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormFieldWrapper label="Family Name" error={errors.family_name?.message} required>
              <Input {...register('family_name')} placeholder="e.g., Smith Family" error={!!errors.family_name} />
            </FormFieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper label="Billing Email" error={errors.billing_email?.message}>
                <Input type="email" {...register('billing_email')} error={!!errors.billing_email} />
              </FormFieldWrapper>
              <FormFieldWrapper label="Billing Phone" error={errors.billing_phone?.message}>
                <Input type="tel" {...register('billing_phone')} />
              </FormFieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Mailing Address */}
        <Card>
          <CardHeader>
            <CardTitle>Mailing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormFieldWrapper label="Address Line 1" error={errors.mailing_address_line1?.message}>
              <Input {...register('mailing_address_line1')} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Address Line 2" error={errors.mailing_address_line2?.message}>
              <Input {...register('mailing_address_line2')} />
            </FormFieldWrapper>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormFieldWrapper label="City" error={errors.mailing_city?.message}>
                <Input {...register('mailing_city')} />
              </FormFieldWrapper>
              <FormFieldWrapper label="State" error={errors.mailing_state?.message}>
                <Input {...register('mailing_state')} />
              </FormFieldWrapper>
              <FormFieldWrapper label="ZIP" error={errors.mailing_zip?.message}>
                <Input {...register('mailing_zip')} />
              </FormFieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormFieldWrapper label="Internal Notes" error={errors.notes_internal?.message}>
              <Textarea
                {...register('notes_internal')}
                placeholder="Staff-only notes about this family..."
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
            onClick={() => router.push('/portal/admin/families')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Family
          </Button>
        </div>
      </form>
    </div>
  )
}
