'use client'

// @anchor: cca.enrollment.system-form
// The system enrollment form — 7-step conversational wizard replacing the legacy
// 4-step wizard. Multi-child via repeater, per-child program + medical, optional
// Stripe fee, family/background, legal acceptances, confirmation.

import { useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { submitSystemEnrollment } from '@/lib/actions/enrollment/submit-system-enrollment'
import {
  SystemEnrollmentSchema,
  type SystemEnrollmentData,
  type ChildData,
} from '@/lib/schemas/enrollment'

const STEPS = [
  { id: 'parent', label: 'Parent' },
  { id: 'children', label: 'Children' },
  { id: 'programs', label: 'Programs' },
  { id: 'medical', label: 'Health' },
  { id: 'family', label: 'Family' },
  { id: 'agreement', label: 'Agree' },
] as const

const PROGRAM_OPTIONS = [
  { value: 'infant', label: 'Infant (12 weeks – 17 mo)' },
  { value: 'toddler', label: 'Toddlers (18 – 23 mo)' },
  { value: 'twos', label: 'Twos' },
  { value: 'threes', label: 'Threes' },
  { value: 'prek', label: 'Pre-K' },
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: 'before_after', label: 'Before & After Care' },
  { value: 'summer', label: 'Summer Camp' },
] as const

const SCHEDULE_OPTIONS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day_am', label: 'Half Day AM' },
  { value: 'half_day_pm', label: 'Half Day PM' },
] as const

const HOW_HEARD_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Friend / Referral' },
  { value: 'church', label: 'Church' },
  { value: 'drive_by', label: 'Drive-by' },
  { value: 'event', label: 'Community Event' },
  { value: 'other', label: 'Other' },
] as const

function emptyChild(): ChildData {
  return {
    first_name: '',
    last_name: '',
    preferred_name: '',
    dob: '',
    gender: 'prefer_not_to_say',
    photo_path: '',
    program_type: 'prek',
    schedule_preference: 'full_day',
    desired_start_date: '',
    has_allergies: false,
    allergies_detail: '',
    has_medical_conditions: false,
    medical_conditions_detail: '',
    has_dietary_restrictions: false,
    dietary_restrictions_detail: '',
    special_needs_or_accommodations: '',
    current_medications: '',
    pediatrician_name: '',
    pediatrician_phone: '',
  }
}

interface SystemEnrollmentFormProps {
  formId?: string
  tenantName?: string
  feeEnabled?: boolean
  feeAmountCents?: number
  feeDescription?: string
}

export function SystemEnrollmentForm({
  formId,
  tenantName = 'our school',
  feeEnabled = false,
  feeAmountCents,
  feeDescription = 'Application Fee',
}: SystemEnrollmentFormProps) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [parent, setParent] = useState({
    parent_first_name: '',
    parent_last_name: '',
    parent_email: '',
    parent_phone: '',
    relationship_to_child: 'parent' as SystemEnrollmentData['relationship_to_child'],
    parent_address_street: '',
    parent_address_city: '',
    parent_address_state: '',
    parent_address_zip: '',
    parent_occupation: '',
    parent_work_phone: '',
    parent_drivers_license: '',
  })

  const [children, setChildren] = useState<ChildData[]>([emptyChild()])

  const [family, setFamily] = useState({
    has_other_parent: false,
    other_parent_name: '',
    other_parent_same_address: true,
    other_parent_address_street: '',
    other_parent_address_city: '',
    other_parent_address_state: '',
    other_parent_address_zip: '',
    other_parent_occupation: '',
    other_parent_work_phone: '',
    other_parent_drivers_license: '',
    family_name: '',
    how_heard: 'google' as SystemEnrollmentData['how_heard'],
    how_heard_other: '',
    referral_family_name: '',
    faith_community: '',
    has_sibling_enrolled: false,
    sibling_name: '',
    parent_goals: '',
    anything_else: '',
  })

  const [agreement, setAgreement] = useState({
    agree_to_contact: false,
    agree_to_policies: false,
    acknowledge_accuracy: false,
  })

  const [honeypot, setHoneypot] = useState('')

  const addChild = () => {
    if (children.length >= 5) return
    setChildren([...children, emptyChild()])
  }
  const removeChild = (idx: number) => {
    if (children.length <= 1) return
    setChildren(children.filter((_, i) => i !== idx))
  }
  const updateChild = (idx: number, patch: Partial<ChildData>) => {
    setChildren(children.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const canAdvance = (): boolean => {
    if (step === 0) {
      return (
        parent.parent_first_name.trim().length > 0 &&
        parent.parent_last_name.trim().length > 0 &&
        parent.parent_email.includes('@') &&
        parent.parent_phone.replace(/\D/g, '').length >= 10
      )
    }
    if (step === 1) {
      return children.every(
        (c) => c.first_name.trim() && c.last_name.trim() && c.dob,
      )
    }
    if (step === 2) {
      return children.every((c) => c.program_type && c.desired_start_date)
    }
    if (step === 3) {
      return true // medical is optional
    }
    if (step === 4) {
      return family.family_name.trim().length > 0
    }
    if (step === 5) {
      return (
        agreement.agree_to_contact &&
        agreement.agree_to_policies &&
        agreement.acknowledge_accuracy
      )
    }
    return true
  }

  const handleSubmit = () => {
    setError(null)
    const payload: SystemEnrollmentData = {
      ...parent,
      children,
      ...family,
      ...agreement,
      form_id: formId,
      website: honeypot,
    }
    const parsed = SystemEnrollmentSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please review your answers.')
      return
    }

    startTransition(async () => {
      const result = await submitSystemEnrollment(parsed.data)
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.')
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return <Confirmation parentFirstName={parent.parent_first_name} children={children} tenantName={tenantName} />
  }

  const currentChild = (idx: number) => children[idx]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <StepIndicator current={step} steps={STEPS} />

      <div className="mt-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8">
        {step === 0 && (
          <section className="space-y-5">
            <Header
              title="Let's get started"
              description={`We're so glad you're interested in ${tenantName}. This application takes about 5 minutes.`}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="First name" value={parent.parent_first_name} onChange={(v) => setParent({ ...parent, parent_first_name: v })} required />
              <TextField label="Last name" value={parent.parent_last_name} onChange={(v) => setParent({ ...parent, parent_last_name: v })} required />
              <TextField label="Email" type="email" value={parent.parent_email} onChange={(v) => setParent({ ...parent, parent_email: v })} required />
              <TextField label="Phone" type="tel" value={parent.parent_phone} onChange={(v) => setParent({ ...parent, parent_phone: v })} required />
              <SelectField
                label="Relationship to child"
                value={parent.relationship_to_child}
                onChange={(v) => setParent({ ...parent, relationship_to_child: v as SystemEnrollmentData['relationship_to_child'] })}
                options={[
                  { value: 'parent', label: 'Parent' },
                  { value: 'grandparent', label: 'Grandparent' },
                  { value: 'guardian', label: 'Guardian' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>

            <div className="pt-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">Address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Street" value={parent.parent_address_street} onChange={(v) => setParent({ ...parent, parent_address_street: v })} />
                <TextField label="City" value={parent.parent_address_city} onChange={(v) => setParent({ ...parent, parent_address_city: v })} />
                <TextField label="State" value={parent.parent_address_state} onChange={(v) => setParent({ ...parent, parent_address_state: v })} />
                <TextField label="ZIP" value={parent.parent_address_zip} onChange={(v) => setParent({ ...parent, parent_address_zip: v })} />
              </div>
            </div>

            <details className="rounded-[var(--radius)] border border-[var(--color-border)] p-3">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-foreground)]">
                Additional info (optional)
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <TextField label="Occupation" value={parent.parent_occupation} onChange={(v) => setParent({ ...parent, parent_occupation: v })} />
                <TextField label="Work phone" value={parent.parent_work_phone} onChange={(v) => setParent({ ...parent, parent_work_phone: v })} />
                <TextField label="Driver's license #" description="Used for authorized pickup verification" value={parent.parent_drivers_license} onChange={(v) => setParent({ ...parent, parent_drivers_license: v })} />
              </div>
            </details>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <Header title="Tell us about your child" description="We'd love to get to know them." />
            <div className="space-y-4">
              {children.map((child, idx) => (
                <div key={idx} className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                      Child {idx + 1}
                    </h3>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(idx)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-destructive)] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First name" value={child.first_name} onChange={(v) => updateChild(idx, { first_name: v })} required />
                    <TextField label="Last name" value={child.last_name} onChange={(v) => updateChild(idx, { last_name: v })} required />
                    <TextField label="Preferred name" value={child.preferred_name ?? ''} onChange={(v) => updateChild(idx, { preferred_name: v })} />
                    <TextField label="Date of birth" type="date" value={child.dob} onChange={(v) => updateChild(idx, { dob: v })} required />
                    <SelectField
                      label="Gender"
                      value={child.gender}
                      onChange={(v) => updateChild(idx, { gender: v as ChildData['gender'] })}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                      ]}
                    />
                  </div>
                </div>
              ))}
              {children.length < 5 && (
                <button
                  type="button"
                  onClick={addChild}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                >
                  <Plus className="h-4 w-4" />
                  Add another child
                </button>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <Header title="Choose a program" description="For each child, pick a program, schedule, and start date." />
            {children.map((child, idx) => (
              <div key={idx} className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
                <div className="mb-3 inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {currentChild(idx).first_name || `Child ${idx + 1}`}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Program"
                    value={child.program_type}
                    onChange={(v) => updateChild(idx, { program_type: v as ChildData['program_type'] })}
                    options={PROGRAM_OPTIONS}
                  />
                  <SelectField
                    label="Schedule"
                    value={child.schedule_preference}
                    onChange={(v) => updateChild(idx, { schedule_preference: v as ChildData['schedule_preference'] })}
                    options={SCHEDULE_OPTIONS}
                  />
                  <TextField
                    label="Desired start date"
                    type="date"
                    value={child.desired_start_date}
                    onChange={(v) => updateChild(idx, { desired_start_date: v })}
                    required
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <Header
              title="Health & safety"
              description="This helps us keep your child safe from day one."
            />
            {children.map((child, idx) => (
              <div key={idx} className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
                <div className="mb-3 inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {currentChild(idx).first_name || `Child ${idx + 1}`}
                </div>
                <div className="space-y-3">
                  <YesNo
                    label="Does your child have any allergies?"
                    value={child.has_allergies}
                    onChange={(v) => updateChild(idx, { has_allergies: v })}
                  />
                  {child.has_allergies && (
                    <TextAreaField
                      label="Allergy details"
                      description="List allergens, severity, and any medications (e.g., EpiPen)."
                      value={child.allergies_detail}
                      onChange={(v) => updateChild(idx, { allergies_detail: v })}
                    />
                  )}
                  <YesNo
                    label="Any medical conditions?"
                    value={child.has_medical_conditions}
                    onChange={(v) => updateChild(idx, { has_medical_conditions: v })}
                  />
                  {child.has_medical_conditions && (
                    <TextAreaField
                      label="Medical conditions"
                      value={child.medical_conditions_detail}
                      onChange={(v) => updateChild(idx, { medical_conditions_detail: v })}
                    />
                  )}
                  <YesNo
                    label="Any dietary restrictions?"
                    value={child.has_dietary_restrictions}
                    onChange={(v) => updateChild(idx, { has_dietary_restrictions: v })}
                  />
                  {child.has_dietary_restrictions && (
                    <TextAreaField
                      label="Dietary restrictions"
                      value={child.dietary_restrictions_detail}
                      onChange={(v) => updateChild(idx, { dietary_restrictions_detail: v })}
                    />
                  )}
                  <TextAreaField
                    label="Special needs or accommodations (optional)"
                    value={child.special_needs_or_accommodations}
                    onChange={(v) => updateChild(idx, { special_needs_or_accommodations: v })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Pediatrician name"
                      value={child.pediatrician_name}
                      onChange={(v) => updateChild(idx, { pediatrician_name: v })}
                    />
                    <TextField
                      label="Pediatrician phone"
                      value={child.pediatrician_phone}
                      onChange={(v) => updateChild(idx, { pediatrician_phone: v })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5">
            <Header title="A little more about your family" />

            <YesNo
              label="Is there another parent or guardian?"
              value={family.has_other_parent}
              onChange={(v) => setFamily({ ...family, has_other_parent: v })}
            />
            {family.has_other_parent && (
              <div className="space-y-3 rounded-[var(--radius)] border border-[var(--color-border)] p-4">
                <TextField
                  label="Other parent's full name"
                  value={family.other_parent_name}
                  onChange={(v) => setFamily({ ...family, other_parent_name: v })}
                />
                <YesNo
                  label="Does this parent live at the same address?"
                  value={family.other_parent_same_address}
                  onChange={(v) => setFamily({ ...family, other_parent_same_address: v })}
                />
                {!family.other_parent_same_address && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Street" value={family.other_parent_address_street} onChange={(v) => setFamily({ ...family, other_parent_address_street: v })} />
                    <TextField label="City" value={family.other_parent_address_city} onChange={(v) => setFamily({ ...family, other_parent_address_city: v })} />
                    <TextField label="State" value={family.other_parent_address_state} onChange={(v) => setFamily({ ...family, other_parent_address_state: v })} />
                    <TextField label="ZIP" value={family.other_parent_address_zip} onChange={(v) => setFamily({ ...family, other_parent_address_zip: v })} />
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Occupation" value={family.other_parent_occupation} onChange={(v) => setFamily({ ...family, other_parent_occupation: v })} />
                  <TextField label="Work phone" value={family.other_parent_work_phone} onChange={(v) => setFamily({ ...family, other_parent_work_phone: v })} />
                  <TextField label="Driver's license #" value={family.other_parent_drivers_license} onChange={(v) => setFamily({ ...family, other_parent_drivers_license: v })} />
                </div>
              </div>
            )}

            <TextField
              label="Family name"
              description="e.g., The Smith Family"
              value={family.family_name}
              onChange={(v) => setFamily({ ...family, family_name: v })}
              required
            />

            <SelectField
              label="How did you hear about us?"
              value={family.how_heard}
              onChange={(v) => setFamily({ ...family, how_heard: v as SystemEnrollmentData['how_heard'] })}
              options={HOW_HEARD_OPTIONS}
            />
            {family.how_heard === 'other' && (
              <TextField label="Please specify" value={family.how_heard_other} onChange={(v) => setFamily({ ...family, how_heard_other: v })} />
            )}
            {family.how_heard === 'referral' && (
              <TextField label="Who referred you?" value={family.referral_family_name} onChange={(v) => setFamily({ ...family, referral_family_name: v })} />
            )}

            <TextField
              label="Church or faith community (optional)"
              value={family.faith_community}
              onChange={(v) => setFamily({ ...family, faith_community: v })}
            />

            <YesNo
              label={`Does another child in your family currently attend ${tenantName}?`}
              value={family.has_sibling_enrolled}
              onChange={(v) => setFamily({ ...family, has_sibling_enrolled: v })}
            />
            {family.has_sibling_enrolled && (
              <TextField label="Sibling name" value={family.sibling_name} onChange={(v) => setFamily({ ...family, sibling_name: v })} />
            )}

            <TextAreaField
              label="What are your goals for your child?"
              value={family.parent_goals}
              onChange={(v) => setFamily({ ...family, parent_goals: v })}
            />
            <TextAreaField
              label="Anything else you'd like us to know?"
              value={family.anything_else}
              onChange={(v) => setFamily({ ...family, anything_else: v })}
            />
          </section>
        )}

        {step === 5 && (
          <section className="space-y-5">
            <Header title="Almost done!" />

            <Acceptance
              label={`I agree to be contacted by ${tenantName} regarding this application.`}
              value={agreement.agree_to_contact}
              onChange={(v) => setAgreement({ ...agreement, agree_to_contact: v })}
            />
            <Acceptance
              label="I have read and agree to the school's policies and handbook."
              value={agreement.agree_to_policies}
              onChange={(v) => setAgreement({ ...agreement, agree_to_policies: v })}
            />
            <Acceptance
              label="I certify that the information provided is accurate and complete."
              value={agreement.acknowledge_accuracy}
              onChange={(v) => setAgreement({ ...agreement, acknowledge_accuracy: v })}
            />

            {feeEnabled && feeAmountCents && (
              <div className="rounded-[var(--radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
                <div className="text-sm font-semibold text-[var(--color-foreground)]">
                  {feeDescription}: ${(feeAmountCents / 100).toFixed(2)}
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  This fee is non-refundable and secures your spot in our review queue. Payment
                  collection is configured by school admin via Stripe Connect.
                </p>
              </div>
            )}

            {/* Honeypot */}
            <input
              type="text"
              tabIndex={-1}
              aria-hidden
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px' }}
            />

            {error && (
              <div className="rounded-[var(--radius)] bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
                {error}
              </div>
            )}
          </section>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0 || pending}
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance() || pending}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Submitting...' : 'Submit application'}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIndicator({
  current,
  steps,
}: {
  current: number
  steps: readonly { id: string; label: string }[]
}) {
  return (
    <ol className="flex items-center justify-between gap-1">
      {steps.map((s, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <li key={s.id} className="flex flex-1 items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                active && 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]',
                !done && !active && 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-px flex-1 transition-colors',
                  done ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
      )}
    </div>
  )
}

function TextField({
  label,
  description,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-foreground)]">
        {label}
        {required && <span className="text-[var(--color-destructive)]"> *</span>}
      </span>
      {description && (
        <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">{description}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </label>
  )
}

function TextAreaField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-foreground)]">{label}</span>
      {description && (
        <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">{description}</span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-foreground)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-[var(--color-foreground)]">{label}</span>
      <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'px-4 py-1.5 text-sm transition-colors',
            value ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'border-l border-[var(--color-border)] px-4 py-1.5 text-sm transition-colors',
            !value ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}

function Acceptance({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--color-border)] p-3 cursor-pointer hover:bg-[var(--color-muted)]/30">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
      />
      <span className="text-sm text-[var(--color-foreground)]">{label}</span>
    </label>
  )
}

function Confirmation({
  parentFirstName,
  children,
  tenantName,
}: {
  parentFirstName: string
  children: ChildData[]
  tenantName: string
}) {
  const names = children.map((c) => c.first_name).filter(Boolean).join(', ')
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">Application received!</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Thank you{parentFirstName ? `, ${parentFirstName}` : ''}! We've received your application for{' '}
        {names || 'your child'}. Our team will review it within 1-2 business days. Watch for an
        email with next steps.
      </p>
      <ol className="mx-auto mt-8 max-w-md space-y-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left text-sm">
        <li>1. We review your application (1-2 business days)</li>
        <li>2. We invite you for a tour & interview (email with booking link)</li>
        <li>3. You visit the school and meet the team</li>
        <li>4. We send your enrollment offer</li>
        <li>5. Your child starts their adventure at {tenantName}!</li>
      </ol>
    </div>
  )
}
