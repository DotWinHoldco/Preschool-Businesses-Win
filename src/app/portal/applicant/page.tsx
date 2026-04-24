import { headers } from 'next/headers'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApplicationStatusCard } from '@/components/portal/applicant/application-status-card'
import { InterviewBookingWidget } from '@/components/portal/applicant/interview-booking-widget'

export default async function ApplicantDashboardPage() {
  const session = await requireAuth()
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')!

  const supabase = createAdminClient()

  const { data: applications } = await supabase
    .from('enrollment_applications')
    .select(
      'id, student_first_name, student_last_name, program_type, pipeline_stage, created_at, parent_first_name, parent_last_name, parent_email',
    )
    .eq('parent_user_id', session.user.id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const apps = applications ?? []

  const appIds = apps.map((a) => a.id as string)

  const { data: allSteps } =
    appIds.length > 0
      ? await supabase
          .from('application_pipeline_steps')
          .select('application_id, step_type, status, created_at, completed_at')
          .in('application_id', appIds)
          .order('created_at', { ascending: true })
      : { data: [] }

  type StepRow = {
    application_id: unknown
    step_type: unknown
    status: unknown
    created_at: unknown
    completed_at: unknown
  }
  const stepsByApp = new Map<string, StepRow[]>()
  for (const step of (allSteps ?? []) as StepRow[]) {
    const appId = step.application_id as string
    if (!stepsByApp.has(appId)) stepsByApp.set(appId, [])
    stepsByApp.get(appId)!.push(step)
  }

  const { data: existingAppointments } =
    appIds.length > 0
      ? await supabase
          .from('appointments')
          .select('id, enrollment_application_id, start_at, end_at, status, notes')
          .in('enrollment_application_id', appIds)
          .not('status', 'in', '("cancelled_by_parent","cancelled_by_staff")')
      : { data: [] }

  type ApptRow = {
    id: unknown
    enrollment_application_id: unknown
    start_at: unknown
    end_at: unknown
    status: unknown
    notes: unknown
  }
  const appointmentsByApp = new Map<string, ApptRow>()
  for (const appt of (existingAppointments ?? []) as ApptRow[]) {
    const appId = appt.enrollment_application_id as string
    if (appId) appointmentsByApp.set(appId, appt)
  }

  const { data: interviewType } = await supabase
    .from('appointment_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('linked_pipeline_stage', 'interview_scheduled')
    .maybeSingle()

  const appointmentTypeId = (interviewType?.id as string) ?? null

  const parentName = apps[0]
    ? `${apps[0].parent_first_name} ${apps[0].parent_last_name}`
    : session.user.email

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">My Application</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Track the status of your enrollment application below.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No applications found. If you recently submitted, please check back in a few minutes.
          </p>
        </div>
      ) : (
        <>
          {apps.map((app) => (
            <ApplicationStatusCard
              key={app.id as string}
              childName={`${app.student_first_name} ${app.student_last_name}`}
              programType={app.program_type as string}
              pipelineStage={app.pipeline_stage as string}
              steps={(stepsByApp.get(app.id as string) ?? []).map((s) => ({
                step_type: s.step_type as string,
                status: s.status as string,
                created_at: s.created_at as string,
                completed_at: s.completed_at as string | null,
              }))}
              submittedAt={app.created_at as string}
            />
          ))}

          <InterviewBookingWidget
            pipelineStage={apps[0].pipeline_stage as string}
            appointmentTypeId={appointmentTypeId}
            applicationId={apps[0].id as string}
            parentName={parentName as string}
            parentEmail={apps[0].parent_email as string}
            existingAppointment={
              appointmentsByApp.has(apps[0].id as string)
                ? {
                    id: appointmentsByApp.get(apps[0].id as string)!.id as string,
                    start_at: appointmentsByApp.get(apps[0].id as string)!.start_at as string,
                    end_at: appointmentsByApp.get(apps[0].id as string)!.end_at as string,
                    status: appointmentsByApp.get(apps[0].id as string)!.status as string,
                    notes: appointmentsByApp.get(apps[0].id as string)!.notes as string | null,
                  }
                : null
            }
          />
        </>
      )}
    </div>
  )
}
