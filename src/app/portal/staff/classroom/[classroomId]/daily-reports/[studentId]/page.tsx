// @anchor: cca.daily-report.staff-student-page
// Per-student report builder — staff enters daily report entries.
// Real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ReportBuilder } from '@/components/portal/daily-reports/report-builder'
import { ReportTimeline } from '@/components/portal/daily-reports/report-timeline'

export default async function StudentDailyReportPage({
  params,
}: {
  params: Promise<{ classroomId: string; studentId: string }>
}) {
  const { classroomId, studentId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch student info
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  if (!student) notFound()

  const studentName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
  const today = new Date().toISOString().split('T')[0]

  // Get or find today's report for this student
  const { data: report } = await supabase
    .from('daily_reports')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .eq('date', today)
    .maybeSingle()

  const reportId = (report?.id as string) ?? 'auto'
  const reportStatus = (report?.status as 'draft' | 'published') ?? 'draft'

  // Fetch report entries if a report exists
  let entries: Array<{
    id: string
    entry_type: string
    timestamp: string
    data: Record<string, unknown>
    entered_by?: string
  }> = []

  if (report?.id) {
    const { data: entryRows } = await supabase
      .from('daily_report_entries')
      .select('id, entry_type, entered_at, data, entered_by')
      .eq('report_id', report.id as string)
      .order('entered_at', { ascending: true })

    entries = (entryRows ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      entry_type: e.entry_type as string,
      timestamp: e.entered_at as string,
      data: (typeof e.data === 'object' && e.data !== null ? e.data : {}) as Record<string, unknown>,
      entered_by: e.entered_by as string | undefined,
    }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <a
          href={`/portal/staff/classroom/${classroomId}/daily-reports`}
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to classroom
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {studentName}&apos;s Daily Report
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Report builder (staff entry) */}
      <ReportBuilder
        studentId={studentId}
        studentName={studentName}
        classroomId={classroomId}
        reportId={reportId}
      />

      {/* Existing entries timeline */}
      <ReportTimeline
        studentName={studentName}
        date={today}
        entries={entries}
        status={reportStatus}
      />

      {/* Publish button */}
      {report?.id && reportStatus !== 'published' && (
        <form action="/api/daily-report/publish" method="POST">
          <input type="hidden" name="report_id" value={report.id as string} />
          <input type="hidden" name="student_id" value={studentId} />
          <button
            type="submit"
            className="w-full rounded-[var(--radius,0.75rem)] bg-[var(--color-success)] text-white px-4 py-3 text-sm font-semibold min-h-[48px] hover:brightness-110 transition-all"
          >
            Publish Report (visible to parents)
          </button>
        </form>
      )}
    </div>
  )
}
