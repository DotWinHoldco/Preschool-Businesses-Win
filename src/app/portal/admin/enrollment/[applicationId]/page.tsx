// @anchor: cca.enrollment.admin.application-detail

import { headers } from 'next/headers'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  PipelineTimeline,
  type PipelineStep,
} from '@/components/portal/enrollment/pipeline-timeline'
import { PipelineStageBadge } from '@/components/portal/enrollment/pipeline-stage-badge'
import { PipelineActions } from '@/components/portal/enrollment/pipeline-actions'
import { PipelineProgress } from '@/components/portal/enrollment/pipeline-progress'
import { ApplicationFormView } from '@/components/portal/enrollment/application-form-view'
import { ApplicationToolbar } from '@/components/portal/enrollment/application-toolbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, FileText, DollarSign, Mail, User } from 'lucide-react'

export default async function ApplicationDetailPage({
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
    .select('id, step_type, status, notes, metadata, completed_at, completed_by, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, start_at, end_at, status, notes')
    .eq('enrollment_application_id', applicationId)
    .order('start_at', { ascending: true })

  // Resolve actor names for pipeline steps
  const actorIds = [
    ...new Set((steps ?? []).map((s) => s.completed_by).filter(Boolean) as string[]),
  ]
  const actorMap = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', actorIds)
    for (const p of profiles ?? []) {
      actorMap.set(p.user_id, `${p.first_name} ${p.last_name}`)
    }
  }

  const enrichedSteps: PipelineStep[] = (steps ?? []).map((s) => ({
    ...s,
    metadata: (s.metadata ?? {}) as Record<string, unknown>,
    actor_name: s.completed_by ? (actorMap.get(s.completed_by) ?? null) : null,
  }))

  const meta = (application.application_metadata ?? {}) as Record<string, unknown>
  const stage = application.pipeline_stage ?? 'form_submitted'

  // Invitation tracking: find interview_invited step
  const invitedStep = enrichedSteps.find((s) => s.step_type === 'interview_invited')
  const interviewCompleteStep = enrichedSteps.find((s) => s.step_type === 'interview_completed')
  const offerStep = enrichedSteps.find((s) => s.step_type === 'offer_sent')
  const hasAppointment = (appointments?.length ?? 0) > 0
  const latestAppointment = appointments?.[appointments.length - 1]

  // Fee/deposit tracking from metadata
  const paymentIntentId = meta.payment_intent_id as string | undefined

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/portal/admin/enrollment"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to applications
      </Link>

      {/* Header card */}
      <Card className="print:shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                  {application.student_first_name} {application.student_last_name}
                </h1>
                <PipelineStageBadge stage={stage} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {application.parent_first_name} {application.parent_last_name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {application.parent_email}
                </span>
                {application.parent_phone && <span>{application.parent_phone}</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
                <span>DOB: {application.student_dob}</span>
                <span>Program: {application.program_type?.replace(/_/g, ' ') ?? '—'}</span>
                <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                {application.triage_score !== null && (
                  <Badge variant="outline" size="sm">
                    Score: {application.triage_score}
                  </Badge>
                )}
              </div>
            </div>
            <ApplicationToolbar applicationId={applicationId} />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline progress bar */}
      <Card className="print:shadow-none">
        <CardContent className="p-6">
          <PipelineProgress currentStage={stage} />
        </CardContent>
      </Card>

      {/* Two-column: audit trail + actions/details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Audit trail */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineTimeline steps={enrichedSteps} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions + Details sidebar */}
        <div className="space-y-6">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Pipeline Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineActions applicationId={applicationId} />
            </CardContent>
          </Card>

          {/* Invitation & Interview tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Interview Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Invitation Sent
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {invitedStep
                      ? new Date(
                          invitedStep.completed_at ?? invitedStep.created_at,
                        ).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Appointment Booked
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {hasAppointment ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        {new Date(latestAppointment!.start_at).toLocaleString()} —{' '}
                        {latestAppointment!.status}
                      </span>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">
                        No appointment yet
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Interview Completed
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {interviewCompleteStep
                      ? new Date(
                          interviewCompleteStep.completed_at ?? interviewCompleteStep.created_at,
                        ).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                {application.interview_notes && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      Interview Notes
                    </dt>
                    <dd className="whitespace-pre-wrap text-[var(--color-foreground)]">
                      {application.interview_notes}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Offer Sent
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {offerStep
                      ? new Date(offerStep.completed_at ?? offerStep.created_at).toLocaleString()
                      : application.offer_sent_at
                        ? new Date(application.offer_sent_at).toLocaleString()
                        : '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Fee / Deposit status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Application Fee
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {paymentIntentId ? (
                      <Badge variant="success" size="sm">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        Not collected
                      </Badge>
                    )}
                  </dd>
                </div>
                {application.offer_accepted_at && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      Enrollment Deposit
                    </dt>
                    <dd className="text-[var(--color-foreground)]">
                      <Badge variant="outline" size="sm">
                        Pending setup
                      </Badge>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Quick details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {meta.family_name && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      Family
                    </dt>
                    <dd className="text-[var(--color-foreground)]">{String(meta.family_name)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    How Heard
                  </dt>
                  <dd className="text-[var(--color-foreground)]">
                    {(application.how_heard ?? '—').replace(/_/g, ' ')}
                  </dd>
                </div>
                {application.faith_community && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      Faith Community
                    </dt>
                    <dd className="text-[var(--color-foreground)]">
                      {application.faith_community}
                    </dd>
                  </div>
                )}
                {application.converted_to_student_id && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      Converted To
                    </dt>
                    <dd>
                      <Link
                        href={`/portal/admin/students/${application.converted_to_student_id}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        View Student Record
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full application form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationFormView
            application={application as Parameters<typeof ApplicationFormView>[0]['application']}
          />
        </CardContent>
      </Card>
    </div>
  )
}
