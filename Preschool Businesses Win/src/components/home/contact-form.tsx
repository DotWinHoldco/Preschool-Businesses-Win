'use client'

// @anchor: marketing.contact.form
// Contact form component with react-hook-form + zod.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ContactMessageSchema, type ContactMessageData } from '@/lib/schemas/contact-message'
import { submitContactMessage } from '@/lib/actions/enrollment/submit-contact-message'
import { CheckCircle2 } from 'lucide-react'

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactMessageData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ContactMessageSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      inquiry_type: 'prospective_parent',
      message: '',
      website: '',
    },
  })

  const onSubmit = async (data: ContactMessageData) => {
    setSubmitting(true)
    setSubmitError(null)

    const result = await submitContactMessage(data)

    setSubmitting(false)
    if (result.ok) {
      setSubmitted(true)
    } else {
      setSubmitError(result.error ?? 'Something went wrong. Please try again.')
    }
  }

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
          <CheckCircle2 size={32} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h3
          className="text-xl font-bold text-balance"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-foreground)',
          }}
        >
          Message sent!
        </h3>
        <p
          className="max-w-md text-base leading-relaxed text-pretty"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Thank you for reaching out. We&rsquo;ll get back to you as soon as
          possible.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        'rounded-[var(--radius,0.75rem)] border p-6 md:p-8',
        'bg-[var(--color-card)]',
      )}
      style={{ borderColor: 'var(--color-border)' }}
      noValidate
    >
      <h2
        className="text-xl font-bold mb-6"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-foreground)',
        }}
      >
        Send us a message
      </h2>

      {/* Honeypot */}
      <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
        <label htmlFor="contact-website">Website</label>
        <input type="text" id="contact-website" {...register('website')} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            Name <span className="text-[var(--color-destructive)]" aria-hidden="true">*</span>
          </label>
          <Input id="contact-name" {...register('name')} placeholder="Your name" error={!!errors.name} autoComplete="name" />
          {errors.name && <p role="alert" className="text-sm" style={{ color: 'var(--color-destructive)' }}>{errors.name.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Email <span className="text-[var(--color-destructive)]" aria-hidden="true">*</span>
            </label>
            <Input id="contact-email" type="email" {...register('email')} placeholder="you@example.com" error={!!errors.email} autoComplete="email" />
            {errors.email && <p role="alert" className="text-sm" style={{ color: 'var(--color-destructive)' }}>{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-phone" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Phone</label>
            <Input id="contact-phone" type="tel" {...register('phone')} placeholder="(214) 555-0123" autoComplete="tel" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            I am a... <span className="text-[var(--color-destructive)]" aria-hidden="true">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: 'current_parent', label: 'Current parent' },
              { value: 'prospective_parent', label: 'Prospective parent' },
              { value: 'staff_inquiry', label: 'Staff inquiry' },
              { value: 'other', label: 'Other' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)] border px-3 py-3 text-sm font-medium cursor-pointer transition-all min-h-[48px]',
                  'has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]',
                )}
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register('inquiry_type')}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {errors.inquiry_type && <p role="alert" className="text-sm" style={{ color: 'var(--color-destructive)' }}>{errors.inquiry_type.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-message" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            How can we help? <span className="text-[var(--color-destructive)]" aria-hidden="true">*</span>
          </label>
          <Textarea id="contact-message" {...register('message')} placeholder="Tell us what's on your mind..." error={!!errors.message} rows={4} />
          {errors.message && <p role="alert" className="text-sm" style={{ color: 'var(--color-destructive)' }}>{errors.message.message}</p>}
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-center" style={{ color: 'var(--color-destructive)' }}>{submitError}</p>
        )}

        <Button type="submit" pill loading={submitting} className="w-full sm:w-auto">
          Send message
        </Button>
      </div>
    </form>
  )
}
