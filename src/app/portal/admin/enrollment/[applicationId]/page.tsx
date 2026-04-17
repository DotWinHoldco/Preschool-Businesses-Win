// @anchor: cca.enrollment.admin.application-detail

import { createTenantServerClient } from '@/lib/supabase/server'
import { PipelineTimeline, type PipelineStep } from '@/components/portal/enrollment/pipeline-timeline'
import { PipelineStageBadge } from '@/components/portal/enrollment/pipeline-stage-badge'
import { PipelineActions } from '@/components/portal/enrollment/pipeline-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params
  const supabase = await createTenantServerClient()

  const { data: application } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (!application) notFound()

  const { data: steps } = await supabase
    .from('application_pipeline_steps')
    .select('id, step_type, status, notes, completed_at, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, start_at, end_at, status, staff_user_id, appointment_type_id')
    .eq('enrollment_application_id', applicationId)
    .order('start_at', { ascending: true })

  const meta = (application.application_metadata ?? {}) as Record<string, unknown>

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/enrollment"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to applications
      </Link>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {application.student_first_name} {application.student_last_name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Parent: {application.parent_first_name} {application.parent_last_name} ·{' '}
              {application.parent_email} · {application.parent_phone ?? '—'}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              DOB: {application.student_dob} · Program: {application.program_type ?? '—'} ·
              Applied: {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <PipelineStageBadge stage={application.pipeline_stage} />
            {application.triage_score !== null && (
              <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Triage score: {application.triage_score}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Pipeline Actions
        </h2>
        <PipelineActions applicationId={applicationId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Pipeline Timeline
          </h2>
          <PipelineTimeline steps={(steps ?? []) as PipelineStep[]} />
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Application Details
          </h2>
          <dl className="space-y-3 text-sm">
            {application.notes && (
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Notes</dt>
                <dd className="whitespace-pre-wrap text-[var(--color-foreground)]">
                  {application.notes}
                </dd>
              </div>
            )}
            {Boolean(meta.family_name) && (
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Family</dt>
                <dd className="text-[var(--color-foreground)]">{String(meta.family_name)}</dd>
              </div>
            )}
            {Boolean(meta.other_parent) && (
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Other parent</dt>
                <dd className="text-[var(--color-foreground)]">
                  {JSON.stringify(meta.other_parent, null, 2)}
                </dd>
              </div>
            )}
            {appointments && appointments.length > 0 && (
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Appointments</dt>
                <dd>
                  <ul className="space-y-1 text-[var(--color-foreground)]">
                    {appointments.map((a) => (
                      <li key={a.id}>
                        {new Date(a.start_at).toLocaleString()} — {a.status}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
