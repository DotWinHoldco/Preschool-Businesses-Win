// @anchor: cca.enrollment.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { ApplicationQueue } from '@/components/portal/enrollment/application-queue'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  stage?: string
}

export default async function EnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createTenantServerClient()

  let query = supabase
    .from('enrollment_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.stage) {
    query = query.eq('pipeline_stage', params.stage)
  }

  const { data: applications } = await query

  const mapped = (applications ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    parent_first_name: a.parent_first_name as string,
    parent_last_name: a.parent_last_name as string,
    parent_email: a.parent_email as string,
    student_first_name: a.student_first_name as string,
    student_last_name: a.student_last_name as string,
    student_dob: a.student_dob as string,
    program_type: (a.program_type as string) ?? '',
    triage_status: (a.triage_status as string) ?? 'new',
    triage_score: a.triage_score as number | null,
    pipeline_stage: (a.pipeline_stage as string) ?? 'form_submitted',
    created_at: a.created_at as string,
  }))

  const stageFilters = [
    { key: '', label: 'All' },
    { key: 'form_submitted', label: 'New' },
    { key: 'under_review', label: 'Reviewing' },
    { key: 'interview_invited', label: 'Invited' },
    { key: 'interview_scheduled', label: 'Scheduled' },
    { key: 'interview_completed', label: 'Interviewed' },
    { key: 'offer_sent', label: 'Offered' },
    { key: 'enrolled', label: 'Enrolled' },
    { key: 'waitlisted', label: 'Waitlist' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Applications</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Review and process enrollment applications through the pipeline
          </p>
        </div>
        <Link
          href="/portal/admin/enrollment/waitlist"
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
        >
          View Waitlist
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {stageFilters.map((f) => {
          const active = (params.stage ?? '') === f.key
          return (
            <Link
              key={f.key || 'all'}
              href={f.key ? `/portal/admin/enrollment?stage=${f.key}` : '/portal/admin/enrollment'}
              className={
                active
                  ? 'rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-1 text-xs font-medium'
                  : 'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
              }
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <ApplicationQueue applications={mapped} />
    </div>
  )
}
