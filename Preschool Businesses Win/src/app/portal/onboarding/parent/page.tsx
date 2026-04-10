'use client'

// @anchor: cca.onboarding.parent
// Multi-step parent onboarding wizard.
// Steps: Contact info, Emergency contacts, Allergies/Medical, Documents, Handbook.
// Uses the Wizard UI component + react-hook-form + zod per step.

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Wizard,
  WizardSteps,
  WizardPanel,
  WizardNav,
  type WizardStep,
} from '@/components/ui/wizard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Phone,
  ShieldPlus,
  Heart,
  Upload,
  FileSignature,
  Plus,
  Trash2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS: WizardStep[] = [
  { id: 'contact', label: 'Contact Info' },
  { id: 'emergency', label: 'Emergency Contacts' },
  { id: 'medical', label: 'Medical Info' },
  { id: 'documents', label: 'Documents' },
  { id: 'handbook', label: 'Handbook' },
]

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Valid email required.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  zip: z.string().min(5, 'ZIP code is required.'),
})
type ContactData = z.infer<typeof contactSchema>

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  relationship: z.string().min(1, 'Relationship is required.'),
  phone: z.string().min(10, 'Phone is required.'),
  canPickup: z.boolean(),
})
type EmergencyContact = z.infer<typeof emergencyContactSchema>

const medicalSchema = z.object({
  allergies: z.string(),
  medications: z.string(),
  dietaryRestrictions: z.string(),
  specialNeeds: z.string(),
  physicianName: z.string(),
  physicianPhone: z.string(),
})
type MedicalData = z.infer<typeof medicalSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParentOnboardingPage() {
  const [currentStepValid, setCurrentStepValid] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', relationship: '', phone: '', canPickup: false },
  ])
  const [handbookAgreed, setHandbookAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Step 1: Contact form
  const contactForm = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
    },
  })

  // Step 3: Medical form
  const medicalForm = useForm<MedicalData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      allergies: '',
      medications: '',
      dietaryRestrictions: '',
      specialNeeds: '',
      physicianName: '',
      physicianPhone: '',
    },
  })

  const handleBeforeNext = useCallback(
    async (currentIndex: number): Promise<boolean> => {
      switch (currentIndex) {
        case 0: {
          const valid = await contactForm.trigger()
          return valid
        }
        case 1: {
          // At least one emergency contact with name and phone
          return emergencyContacts.some(
            (c) => c.name.trim().length > 0 && c.phone.trim().length >= 10
          )
        }
        case 2: {
          // Medical is optional — always allow
          return true
        }
        case 3: {
          // Documents step — always allow for now
          return true
        }
        default:
          return true
      }
    },
    [contactForm, emergencyContacts]
  )

  function handleSubmit() {
    if (!handbookAgreed) return
    // TODO: Server action to save onboarding data
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                color: 'var(--color-success)',
              }}
            >
              <FileSignature size={28} />
            </div>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
            >
              Onboarding complete
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Thank you for completing your onboarding. You can now access the
              full parent portal. Your child&apos;s classroom teacher will reach out
              soon.
            </p>
            <Button asChild>
              <a href="/portal/parent">Go to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          Welcome to your portal
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Let us get your family set up. This should take about 5 minutes.
        </p>
      </div>

      <Wizard steps={STEPS} onBeforeNext={handleBeforeNext}>
        <WizardSteps />

        {/* Step 1: Contact Info */}
        <WizardPanel stepId="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} style={{ color: 'var(--color-primary)' }} />
                Verify Your Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrapper label="First Name" error={contactForm.formState.errors.firstName?.message}>
                    <Input
                      {...contactForm.register('firstName')}
                      error={!!contactForm.formState.errors.firstName}
                      placeholder="First name"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Last Name" error={contactForm.formState.errors.lastName?.message}>
                    <Input
                      {...contactForm.register('lastName')}
                      error={!!contactForm.formState.errors.lastName}
                      placeholder="Last name"
                    />
                  </FieldWrapper>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrapper label="Email" error={contactForm.formState.errors.email?.message}>
                    <Input
                      type="email"
                      {...contactForm.register('email')}
                      error={!!contactForm.formState.errors.email}
                      placeholder="you@example.com"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Phone" error={contactForm.formState.errors.phone?.message}>
                    <Input
                      type="tel"
                      {...contactForm.register('phone')}
                      error={!!contactForm.formState.errors.phone}
                      placeholder="(555) 555-5555"
                    />
                  </FieldWrapper>
                </div>
                <FieldWrapper label="Address" error={contactForm.formState.errors.address?.message}>
                  <Input
                    {...contactForm.register('address')}
                    error={!!contactForm.formState.errors.address}
                    placeholder="Street address"
                  />
                </FieldWrapper>
                <div className="grid gap-4 grid-cols-3">
                  <FieldWrapper label="City" error={contactForm.formState.errors.city?.message}>
                    <Input
                      {...contactForm.register('city')}
                      error={!!contactForm.formState.errors.city}
                      placeholder="City"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="State" error={contactForm.formState.errors.state?.message}>
                    <Input
                      {...contactForm.register('state')}
                      error={!!contactForm.formState.errors.state}
                      placeholder="TX"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="ZIP" error={contactForm.formState.errors.zip?.message}>
                    <Input
                      {...contactForm.register('zip')}
                      error={!!contactForm.formState.errors.zip}
                      placeholder="75114"
                    />
                  </FieldWrapper>
                </div>
              </form>
            </CardContent>
          </Card>
        </WizardPanel>

        {/* Step 2: Emergency Contacts */}
        <WizardPanel stepId="emergency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={18} style={{ color: 'var(--color-primary)' }} />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Add at least one emergency contact who can be reached if we cannot reach you.
              </p>
              {emergencyContacts.map((contact, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4 space-y-3"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" size="sm">Contact {i + 1}</Badge>
                    {emergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmergencyContacts((prev) => prev.filter((_, j) => j !== i))}
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--color-destructive)' }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldWrapper label="Full Name">
                      <Input
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...emergencyContacts]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setEmergencyContacts(updated)
                        }}
                        placeholder="Full name"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Relationship">
                      <Input
                        value={contact.relationship}
                        onChange={(e) => {
                          const updated = [...emergencyContacts]
                          updated[i] = { ...updated[i], relationship: e.target.value }
                          setEmergencyContacts(updated)
                        }}
                        placeholder="Grandmother, uncle, etc."
                      />
                    </FieldWrapper>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldWrapper label="Phone">
                      <Input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...emergencyContacts]
                          updated[i] = { ...updated[i], phone: e.target.value }
                          setEmergencyContacts(updated)
                        }}
                        placeholder="(555) 555-5555"
                      />
                    </FieldWrapper>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
                        <input
                          type="checkbox"
                          checked={contact.canPickup}
                          onChange={(e) => {
                            const updated = [...emergencyContacts]
                            updated[i] = { ...updated[i], canPickup: e.target.checked }
                            setEmergencyContacts(updated)
                          }}
                          className="h-4 w-4 rounded"
                        />
                        Authorized for pickup
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() =>
                  setEmergencyContacts((prev) => [
                    ...prev,
                    { name: '', relationship: '', phone: '', canPickup: false },
                  ])
                }
              >
                <Plus size={14} />
                Add another contact
              </Button>
            </CardContent>
          </Card>
        </WizardPanel>

        {/* Step 3: Allergy / Medical */}
        <WizardPanel stepId="medical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={18} style={{ color: 'var(--color-destructive)' }} />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  This information helps us keep your child safe. Please list all known allergies,
                  medications, and dietary restrictions.
                </p>
                <FieldWrapper label="Allergies">
                  <textarea
                    {...medicalForm.register('allergies')}
                    className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm min-h-[48px]"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                    placeholder="List all known allergies (e.g., peanuts, dairy, bee stings)"
                    rows={3}
                  />
                </FieldWrapper>
                <FieldWrapper label="Current Medications">
                  <textarea
                    {...medicalForm.register('medications')}
                    className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm min-h-[48px]"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                    placeholder="List any medications your child takes regularly"
                    rows={3}
                  />
                </FieldWrapper>
                <FieldWrapper label="Dietary Restrictions">
                  <Input
                    {...medicalForm.register('dietaryRestrictions')}
                    placeholder="Vegetarian, gluten-free, etc."
                  />
                </FieldWrapper>
                <FieldWrapper label="Special Needs or Considerations">
                  <textarea
                    {...medicalForm.register('specialNeeds')}
                    className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm min-h-[48px]"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                    placeholder="Any additional medical or developmental notes"
                    rows={3}
                  />
                </FieldWrapper>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrapper label="Physician Name">
                    <Input
                      {...medicalForm.register('physicianName')}
                      placeholder="Dr. Smith"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Physician Phone">
                    <Input
                      type="tel"
                      {...medicalForm.register('physicianPhone')}
                      placeholder="(555) 555-5555"
                    />
                  </FieldWrapper>
                </div>
              </form>
            </CardContent>
          </Card>
        </WizardPanel>

        {/* Step 4: Documents */}
        <WizardPanel stepId="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={18} style={{ color: 'var(--color-primary)' }} />
                Upload Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Please upload the following documents. You can also upload these later from your
                portal.
              </p>
              {[
                { label: 'Immunization Records', required: true, description: 'Up-to-date shot records from your pediatrician.' },
                { label: 'Birth Certificate', required: false, description: 'Copy of your child\'s birth certificate.' },
                { label: 'Custody Documents', required: false, description: 'If applicable, court-ordered custody agreements.' },
                { label: 'Insurance Card', required: false, description: 'Copy of your child\'s health insurance card.' },
              ].map((doc) => (
                <div
                  key={doc.label}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {doc.label}
                      {doc.required && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--color-destructive)' }}>
                          Required
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                      {doc.description}
                    </p>
                  </div>
                  <label
                    className="shrink-0 cursor-pointer rounded-[var(--radius)] border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--color-muted)]"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  >
                    <input type="file" className="sr-only" accept="image/*,.pdf" />
                    Choose file
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </WizardPanel>

        {/* Step 5: Handbook Acknowledgment */}
        <WizardPanel stepId="handbook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature size={18} style={{ color: 'var(--color-primary)' }} />
                Parent Handbook Acknowledgment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="rounded-lg border p-4 max-h-64 overflow-y-auto text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                  backgroundColor: 'var(--color-muted)',
                }}
              >
                <h3 className="font-semibold mb-2">Parent Handbook Summary</h3>
                <p className="mb-3">
                  By signing below, I acknowledge that I have received and reviewed
                  the Parent Handbook for the current school year. I agree to abide by
                  the policies and procedures outlined therein, including but not
                  limited to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Drop-off and pick-up procedures and authorized pickup policies</li>
                  <li>Health and illness policies, including exclusion criteria</li>
                  <li>Allergy and medication management protocols</li>
                  <li>Tuition and billing policies, including late fee schedule</li>
                  <li>Communication expectations and parent-teacher conference schedule</li>
                  <li>Emergency and lockdown procedures</li>
                  <li>Photo and media consent policies</li>
                  <li>Behavior guidance and discipline philosophy</li>
                </ul>
                <p className="mt-3">
                  I understand that failure to comply with school policies may
                  result in suspension or termination of enrollment.
                </p>
              </div>

              <label
                className="flex items-start gap-3 cursor-pointer"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={handbookAgreed}
                  onChange={(e) => setHandbookAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded"
                />
                <span className="text-sm">
                  I have read and agree to the Parent Handbook and the policies
                  outlined above. I understand this serves as my electronic signature.
                </span>
              </label>
            </CardContent>
          </Card>
        </WizardPanel>

        <WizardNav
          submitLabel="Complete Onboarding"
          onSubmit={handleSubmit}
        />
      </Wizard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper: inline field wrapper (avoids importing react-hook-form's in each step)
// ---------------------------------------------------------------------------

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-destructive)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
