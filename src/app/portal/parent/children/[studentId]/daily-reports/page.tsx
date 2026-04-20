// @anchor: cca.daily-report.parent-view
// Parent view of their child's daily reports — beautiful timeline.
// Real Supabase queries replace placeholder data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ReportTimeline } from '@/components/portal/daily-reports/report-timeline'

export default async function ParentDailyReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Verify student belongs to parent's family
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  if (familyIds.length === 0) notFound()

  const { data: studentLink } = await supabase
    .from('student_family_links')
    .select('student_id')
    .eq('student_id', studentId)
    .in('family_id', familyIds)
    .eq('tenant_id', tenantId)
    .limit(1)
    .single()

  if (!studentLink) notFound()

  // Fetch student name
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (!student) notFound()

  // Fetch published daily reports, most recent first
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, date, status')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(10)

  const mostRecentReport = (reports ?? [])[0] ?? null
  const today = new Date().toISOString().split('T')[0]
  const reportDate = mostRecentReport?.date ?? today

  // Fetch entries for the most recent report
  let entries: { id: string; entry_type: string; timestamp: string; data: Record<string, unknown> }[] = []
  if (mostRecentReport) {
    const { data: reportEntries } = await supabase
      .from('daily_report_entries')
      .select('id, entry_type, timestamp, data')
      .eq('report_id', mostRecentReport.id)
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: true })
    entries = (reportEntries ?? []) as typeof entries
  }

  // Past report dates (exclude the most recent one shown)
  const pastReportDates = (reports ?? [])
    .slice(1)
    .map(r => new Date(r.date + 'T12:00:00'))

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <a
          href={`/portal/parent/children/${studentId}`}
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to {student.first_name}
        </a>
      </div>

      {entries.length > 0 ? (
        <ReportTimeline
          studentName={student.first_name}
          date={reportDate}
          entries={entries}
          status="published"
        />
      ) : (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No daily reports yet.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Daily reports will appear here once published by your child&apos;s teacher.
          </p>
        </div>
      )}

      {/* Past reports navigation */}
      {pastReportDates.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] mb-3">
            Past Reports
          </h3>
          <div className="flex flex-wrap gap-2">
            {pastReportDates.map((d, i) => (
              <button
                key={i}
                type="button"
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] min-h-[36px]"
              >
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
