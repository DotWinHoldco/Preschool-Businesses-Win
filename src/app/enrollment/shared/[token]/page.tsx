// @anchor: cca.enrollment.shared-view
// Public page for viewing a redacted enrollment application via signed share token.

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShareToken, redactEmail, redactPhone, redactMetadata } from '@/lib/enrollment-share'
import { PIPELINE_STAGE_LABELS } from '@/components/portal/enrollment/pipeline-stage-badge'

export default async function SharedApplicationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { applicationId, valid } = verifyShareToken(token)

  if (!valid || !applicationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Link Expired</h1>
          <p className="mt-2 text-gray-600">
            This share link has expired or is invalid. Please request a new one.
          </p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data: application } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Not Found</h1>
          <p className="mt-2 text-gray-600">This application could not be found.</p>
        </div>
      </div>
    )
  }

  const meta = redactMetadata((application.application_metadata ?? {}) as Record<string, unknown>)
  const parentMeta = (meta.parent ?? {}) as Record<string, unknown>
  const otherParent = meta.other_parent as Record<string, unknown> | null
  const stage = application.pipeline_stage ?? 'form_submitted'

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                Enrollment Application — Shared View
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {application.student_first_name} {application.student_last_name}
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {PIPELINE_STAGE_LABELS[stage] ?? stage}
              </span>
              {application.triage_score !== null && (
                <p className="mt-1 text-xs text-gray-500">Score: {application.triage_score}</p>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Applied {new Date(application.created_at).toLocaleDateString()}
          </p>
          <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Personal information has been redacted for privacy. Contact the school for full details.
          </p>
        </div>

        {/* Parent Info */}
        <Section title="Primary Parent / Guardian">
          <Field label="Name" value={`${application.parent_first_name} ${application.parent_last_name}`} />
          <Field label="Email" value={redactEmail(application.parent_email)} />
          <Field label="Phone" value={redactPhone(application.parent_phone)} />
          <Field label="Relationship" value={application.relationship_to_child?.replace(/_/g, ' ')} />
          <Field label="Occupation" value={parentMeta.occupation as string} />
        </Section>

        {otherParent && (
          <Section title="Other Parent / Guardian">
            <Field label="Name" value={otherParent.name as string} />
            <Field label="Occupation" value={otherParent.occupation as string} />
          </Section>
        )}

        {/* Student Info */}
        <Section title="Student Information">
          <Field label="Name" value={`${application.student_first_name} ${application.student_last_name}`} />
          <Field label="Date of Birth" value={application.student_dob} />
          <Field label="Gender" value={application.student_gender?.replace(/_/g, ' ')} />
          <Field label="Program" value={application.program_type?.replace(/_/g, ' ')} />
          <Field label="Schedule" value={application.schedule_preference?.replace(/_/g, ' ')} />
          <Field label="Desired Start" value={application.desired_start_date} />
        </Section>

        {/* Medical */}
        <Section title="Medical & Special Needs">
          <Field label="Allergies / Medical" value={application.allergies_or_medical} />
          <Field label="Special Needs" value={application.special_needs} />
        </Section>

        {/* Family */}
        <Section title="Family Information">
          <Field label="Family Name" value={meta.family_name as string} />
          <Field label="How Heard" value={(application.how_heard ?? (meta.how_heard as string))?.replace(/_/g, ' ')} />
          {application.faith_community && (
            <Field label="Faith Community" value={application.faith_community} />
          )}
          {application.sibling_enrolled && (
            <Field label="Sibling Enrolled" value={application.sibling_name ?? 'Yes'} />
          )}
          <Field label="Parent Goals" value={meta.parent_goals as string} />
        </Section>

        {/* Agreement */}
        <Section title="Agreement">
          <Field label="Signature" value={meta.parent_signature as string} />
          <Field label="Submitted" value={new Date(application.created_at).toLocaleString()} />
        </Section>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>This is a redacted view. Driver&apos;s license numbers, full addresses, and contact details have been removed.</p>
          <p className="mt-1">Generated {new Date().toLocaleDateString()} — Powered by Preschool Businesses Win</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
        {title}
      </h2>
      <dl className="space-y-0">{children}</dl>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-gray-100 py-2 last:border-0">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 whitespace-pre-wrap">{value}</dd>
    </div>
  )
}
