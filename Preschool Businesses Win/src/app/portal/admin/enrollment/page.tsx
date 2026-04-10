// @anchor: cca.enrollment.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { ApplicationQueue } from '@/components/portal/enrollment/application-queue'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default async function EnrollmentPage() {
  const supabase = await createTenantServerClient()

  const { data: applications } = await supabase
    .from('enrollment_applications')
    .select('*')
    .order('created_at', { ascending: false })

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
    created_at: a.created_at as string,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Applications</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Review and process enrollment applications
          </p>
        </div>
        <Link
          href="/portal/admin/enrollment/waitlist"
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
        >
          View Waitlist
        </Link>
      </div>

      <ApplicationQueue applications={mapped} />
    </div>
  )
}
