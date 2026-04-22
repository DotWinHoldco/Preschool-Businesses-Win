// @anchor: cca.enrollment.print-page
// Dedicated print page: full multi-page enrollment application form.
// Opens in new tab, auto-triggers window.print().

import { headers } from 'next/headers'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PIPELINE_STAGE_LABELS } from '@/components/portal/enrollment/pipeline-stage-badge'
import { PrintTrigger } from './print-trigger'

export default async function ApplicationPrintPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { applicationId } = await params
  const supabase = await createTenantAdminClient(tenantId)

  const { data: application } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .single()

  if (!application) notFound()

  const { data: steps } = await supabase
    .from('application_pipeline_steps')
    .select('step_type, status, notes, completed_at, completed_by, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  const actorIds = [...new Set(
    (steps ?? []).map((s) => s.completed_by).filter(Boolean) as string[]
  )]
  let actorMap = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', actorIds)
    for (const p of profiles ?? []) {
      actorMap.set(p.user_id, `${p.first_name} ${p.last_name}`)
    }
  }

  const meta = (application.application_metadata ?? {}) as Record<string, unknown>
  const parentMeta = (meta.parent ?? {}) as Record<string, unknown>
  const otherParent = meta.other_parent as Record<string, unknown> | null
  const stage = application.pipeline_stage ?? 'form_submitted'

  function formatAddress(obj: Record<string, unknown>, prefix: string): string | null {
    const street = obj[`${prefix}_street`] as string | undefined
    const city = obj[`${prefix}_city`] as string | undefined
    const state = obj[`${prefix}_state`] as string | undefined
    const zip = obj[`${prefix}_zip`] as string | undefined
    if (!street && !city) return null
    return [street, city, state, zip].filter(Boolean).join(', ')
  }

  const parentAddress = formatAddress(parentMeta, 'address')
  const otherParentAddress = otherParent && !otherParent.same_address
    ? formatAddress(otherParent, 'address')
    : null

  return (
    <html>
      <head>
        <title>
          Application — {application.student_first_name} {application.student_last_name}
        </title>
        <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      </head>
      <body>
        <PrintTrigger />

        {/* Page 1: Header + Parent + Student info */}
        <div className="page">
          <header className="header">
            <div>
              <h1 className="title">Enrollment Application</h1>
              <p className="subtitle">Confidential — For Administrative Use</p>
            </div>
            <div className="header-right">
              <span className="badge">{PIPELINE_STAGE_LABELS[stage] ?? stage}</span>
              {application.triage_score !== null && (
                <p className="score">Score: {application.triage_score}</p>
              )}
            </div>
          </header>

          <div className="student-banner">
            <div className="student-name">
              {application.student_first_name} {application.student_last_name}
            </div>
            <div className="student-meta">
              DOB: {application.student_dob} &nbsp;|&nbsp; Program: {application.program_type?.replace(/_/g, ' ') ?? 'N/A'}
              &nbsp;|&nbsp; Applied: {new Date(application.created_at).toLocaleDateString()}
            </div>
          </div>

          <Section title="Primary Parent / Guardian">
            <Field label="Name" value={`${application.parent_first_name} ${application.parent_last_name}`} />
            <Field label="Email" value={application.parent_email} />
            <Field label="Phone" value={application.parent_phone} />
            <Field label="Relationship" value={application.relationship_to_child?.replace(/_/g, ' ')} />
            <Field label="Address" value={parentAddress} />
            <Field label="Occupation" value={parentMeta.occupation as string} />
            <Field label="Work Phone" value={parentMeta.work_phone as string} />
            <Field label="Driver&apos;s License" value={parentMeta.drivers_license as string} />
          </Section>

          {otherParent && (
            <Section title="Other Parent / Guardian">
              <Field label="Name" value={otherParent.name as string} />
              <Field label="Same Address" value={otherParent.same_address ? 'Yes' : 'No'} />
              {otherParentAddress && <Field label="Address" value={otherParentAddress} />}
              <Field label="Occupation" value={otherParent.occupation as string} />
              <Field label="Work Phone" value={otherParent.work_phone as string} />
              <Field label="Driver&apos;s License" value={otherParent.drivers_license as string} />
            </Section>
          )}

          <Section title="Student Information">
            <Field label="Full Name" value={`${application.student_first_name} ${application.student_last_name}`} />
            <Field label="Date of Birth" value={application.student_dob} />
            <Field label="Gender" value={application.student_gender?.replace(/_/g, ' ')} />
            <Field label="Program Type" value={application.program_type?.replace(/_/g, ' ')} />
            <Field label="Schedule Pref." value={application.schedule_preference?.replace(/_/g, ' ')} />
            <Field label="Desired Start" value={application.desired_start_date} />
          </Section>
        </div>

        {/* Page 2: Medical + Family + Agreement + Audit */}
        <div className="page">
          <Section title="Medical & Special Needs">
            <Field label="Allergies / Medical" value={application.allergies_or_medical} />
            <Field label="Special Needs" value={application.special_needs} />
          </Section>

          <Section title="Family Information">
            <Field label="Family Name" value={meta.family_name as string} />
            <Field label="How Heard" value={(application.how_heard ?? (meta.how_heard as string))?.replace(/_/g, ' ')} />
            {meta.how_heard === 'referral' && (
              <Field label="Referral Family" value={meta.referral_family_name as string} />
            )}
            <Field label="Faith Community" value={application.faith_community ?? (meta.faith_community as string)} />
            {(application.sibling_enrolled === true || meta.has_sibling_enrolled === true) && (
              <Field label="Sibling Enrolled" value={String(application.sibling_name ?? (meta.sibling_name as string) ?? 'Yes')} />
            )}
            <Field label="Parent Goals" value={meta.parent_goals as string} />
            <Field label="Additional Notes" value={meta.anything_else as string} />
          </Section>

          {application.notes && (
            <Section title="Compiled Notes">
              <div className="notes-block">{application.notes}</div>
            </Section>
          )}

          <Section title="Agreement & Signature">
            <Field label="Electronic Signature" value={meta.parent_signature as string} />
            <Field label="Agreed to Contact" value={application.agree_to_contact ? 'Yes' : 'No'} />
            <Field label="Date Submitted" value={new Date(application.created_at).toLocaleString()} />
            {meta.payment_intent_id ? (
              <Field label="Payment" value="Application fee collected" />
            ) : null}
          </Section>

          {(steps ?? []).length > 0 && (
            <Section title="Processing History">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(steps ?? []).map((step, i) => (
                    <tr key={i}>
                      <td>{new Date(step.completed_at ?? step.created_at).toLocaleString()}</td>
                      <td>{PIPELINE_STAGE_LABELS[step.step_type] ?? step.step_type}</td>
                      <td>{step.completed_by ? actorMap.get(step.completed_by) ?? '—' : '—'}</td>
                      <td>{step.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <div className="footer">
            <p>Application ID: {applicationId}</p>
            <p>Generated {new Date().toLocaleString()} — Confidential</p>
          </div>
        </div>
      </body>
    </html>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  )
}

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.4; }

  .page { page-break-after: always; padding: 0.75in; min-height: 100vh; }
  .page:last-child { page-break-after: auto; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20pt; font-weight: 700; }
  .subtitle { font-size: 9pt; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-right { text-align: right; }
  .badge { display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 10px; font-size: 9pt; font-weight: 600; }
  .score { font-size: 9pt; color: #666; margin-top: 4px; }

  .student-banner { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
  .student-name { font-size: 16pt; font-weight: 700; }
  .student-meta { font-size: 9pt; color: #666; margin-top: 4px; }

  .section { margin-bottom: 20px; }
  .section-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }

  .field { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
  .field:last-child { border-bottom: none; }
  .field-label { flex: 0 0 140px; font-size: 9pt; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.3px; padding-top: 1px; }
  .field-value { flex: 1; font-size: 10pt; white-space: pre-wrap; }

  .notes-block { font-size: 10pt; white-space: pre-wrap; padding: 8px 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }

  .audit-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .audit-table th { text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding: 4px 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; color: #666; }
  .audit-table td { border-bottom: 1px solid #f3f4f6; padding: 4px 8px; vertical-align: top; }

  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #999; text-align: center; }

  @media print {
    .page { padding: 0; min-height: auto; }
    @page { margin: 0.75in; size: letter; }
    .no-print { display: none !important; }
  }

  @media screen {
    body { background: #f1f5f9; }
    .page { max-width: 8.5in; margin: 20px auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; }
  }
`
