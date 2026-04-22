// @anchor: cca.enrollment.application-form-view
// Read-only rendering of the full enrollment application form data.
// Used on the detail page and optimized for print.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ApplicationData {
  student_first_name: string
  student_last_name: string
  student_dob: string
  student_gender: string | null
  parent_first_name: string
  parent_last_name: string
  parent_email: string
  parent_phone: string | null
  relationship_to_child: string | null
  program_type: string | null
  schedule_preference: string | null
  desired_start_date: string | null
  allergies_or_medical: string | null
  special_needs: string | null
  how_heard: string | null
  faith_community: string | null
  sibling_enrolled: boolean | null
  sibling_name: string | null
  notes: string | null
  application_metadata: Record<string, unknown>
  created_at: string
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 border-b border-[var(--color-border)]/50 last:border-0">
      <dt className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">{value}</dd>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="print:shadow-none print:border-[var(--color-border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>{children}</dl>
      </CardContent>
    </Card>
  )
}

function formatAddress(meta: Record<string, unknown>, prefix: string): string | null {
  const street = meta[`${prefix}_street`] as string | undefined
  const city = meta[`${prefix}_city`] as string | undefined
  const state = meta[`${prefix}_state`] as string | undefined
  const zip = meta[`${prefix}_zip`] as string | undefined
  if (!street && !city) return null
  return [street, city, state, zip].filter(Boolean).join(', ')
}

export function ApplicationFormView({ application }: { application: ApplicationData }) {
  const meta = application.application_metadata ?? {}
  const parent = (meta.parent ?? {}) as Record<string, unknown>
  const otherParent = meta.other_parent as Record<string, unknown> | null
  const parentAddress = formatAddress(parent, 'address')

  return (
    <div className="space-y-4 print:space-y-6" id="application-form-view">
      <div className="text-center print:block hidden mb-6">
        <h1 className="text-xl font-bold">Enrollment Application</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {application.student_first_name} {application.student_last_name} — Submitted{' '}
          {new Date(application.created_at).toLocaleDateString()}
        </p>
      </div>

      <SectionCard title="Primary Parent / Guardian">
        <FieldRow label="Name" value={`${application.parent_first_name} ${application.parent_last_name}`} />
        <FieldRow label="Email" value={application.parent_email} />
        <FieldRow label="Phone" value={application.parent_phone} />
        <FieldRow label="Relationship" value={application.relationship_to_child?.replace(/_/g, ' ')} />
        <FieldRow label="Address" value={parentAddress} />
        <FieldRow label="Occupation" value={parent.occupation as string} />
        <FieldRow label="Work Phone" value={parent.work_phone as string} />
        <FieldRow label="Driver's License" value={parent.drivers_license as string} />
      </SectionCard>

      {otherParent && (
        <SectionCard title="Other Parent / Guardian">
          <FieldRow label="Name" value={otherParent.name as string} />
          <FieldRow
            label="Same Address"
            value={otherParent.same_address ? 'Yes' : 'No'}
          />
          {!otherParent.same_address && (
            <FieldRow label="Address" value={formatAddress(otherParent, 'address')} />
          )}
          <FieldRow label="Occupation" value={otherParent.occupation as string} />
          <FieldRow label="Work Phone" value={otherParent.work_phone as string} />
          <FieldRow label="Driver's License" value={otherParent.drivers_license as string} />
        </SectionCard>
      )}

      <SectionCard title="Student Information">
        <FieldRow label="Name" value={`${application.student_first_name} ${application.student_last_name}`} />
        <FieldRow label="Date of Birth" value={application.student_dob} />
        <FieldRow label="Gender" value={application.student_gender?.replace(/_/g, ' ')} />
        <FieldRow label="Program" value={application.program_type?.replace(/_/g, ' ')} />
        <FieldRow label="Schedule" value={application.schedule_preference?.replace(/_/g, ' ')} />
        <FieldRow label="Desired Start" value={application.desired_start_date} />
      </SectionCard>

      <SectionCard title="Medical & Special Needs">
        <FieldRow label="Allergies / Medical" value={application.allergies_or_medical} />
        <FieldRow label="Special Needs" value={application.special_needs} />
      </SectionCard>

      <SectionCard title="Family Information">
        <FieldRow label="Family Name" value={meta.family_name as string} />
        <FieldRow label="How Heard" value={(meta.how_heard as string)?.replace(/_/g, ' ')} />
        {meta.how_heard === 'referral' && (
          <FieldRow label="Referral Family" value={meta.referral_family_name as string} />
        )}
        <FieldRow label="Faith Community" value={application.faith_community ?? (meta.faith_community as string)} />
        {(application.sibling_enrolled === true || meta.has_sibling_enrolled === true) && (
          <FieldRow label="Sibling Enrolled" value={String(application.sibling_name ?? (meta.sibling_name as string) ?? 'Yes')} />
        )}
        <FieldRow label="Parent Goals" value={meta.parent_goals as string} />
        <FieldRow label="Additional Notes" value={meta.anything_else as string} />
      </SectionCard>

      <SectionCard title="Agreement & Signature">
        <FieldRow label="Signature" value={meta.parent_signature as string} />
        <FieldRow
          label="Payment Intent"
          value={meta.payment_intent_id ? `Stripe: ${(meta.payment_intent_id as string).slice(0, 20)}...` : null}
        />
        <FieldRow label="Submitted" value={new Date(application.created_at).toLocaleString()} />
      </SectionCard>

      {application.notes && (
        <SectionCard title="Compiled Notes">
          <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
            {application.notes}
          </p>
        </SectionCard>
      )}
    </div>
  )
}
