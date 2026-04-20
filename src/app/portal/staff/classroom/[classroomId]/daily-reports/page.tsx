// @anchor: cca.daily-report.staff-classroom-page
// Staff daily report entry page for a classroom — lists all students with report status.
// Real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, FileText } from 'lucide-react'

export default async function ClassroomDailyReportsPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch classroom info
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('id', classroomId)
    .eq('tenant_id', tenantId)
    .single()

  if (!classroom) notFound()

  const today = new Date().toISOString().split('T')[0]

  // Students in this classroom
  const { data: studentAssignments } = await supabase
    .from('student_classroom_assignments')
    .select('student_id, students(id, first_name, last_name)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)

  // Daily reports for today
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, student_id, status')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .eq('date', today)

  const reportMap = new Map<string, Record<string, unknown>>()
  for (const r of reports ?? []) {
    const row = r as Record<string, unknown>
    reportMap.set(row.student_id as string, row)
  }

  // Get entry counts for each report
  const reportIds = (reports ?? []).map((r: Record<string, unknown>) => r.id as string).filter(Boolean)
  let entryCounts = new Map<string, number>()
  if (reportIds.length > 0) {
    const { data: entries } = await supabase
      .from('daily_report_entries')
      .select('report_id')
      .in('report_id', reportIds)

    for (const e of entries ?? []) {
      const row = e as Record<string, unknown>
      const reportId = row.report_id as string
      entryCounts.set(reportId, (entryCounts.get(reportId) ?? 0) + 1)
    }
  }

  const students = (studentAssignments ?? []).map((sa: Record<string, unknown>) => {
    const s = sa.students as Record<string, unknown> | null
    const studentId = (s?.id as string) ?? (sa.student_id as string)
    const firstName = (s?.first_name as string) ?? ''
    const lastName = (s?.last_name as string) ?? ''
    const name = `${firstName} ${lastName.charAt(0)}.`.trim()

    const report = reportMap.get(studentId)
    const reportId = report?.id as string | undefined
    const status = report ? (report.status as string) : 'empty'
    const entryCount = reportId ? (entryCounts.get(reportId) ?? 0) : 0

    return {
      id: studentId,
      name,
      entryCount,
      status: status as 'draft' | 'published' | 'empty',
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Daily Reports
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {classroom.name} &mdash;{' '}
          {new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {students.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <ClipboardList size={32} className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No students in this classroom.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((student) => (
            <a
              key={student.id}
              href={`/portal/staff/classroom/${classroomId}/daily-reports/${student.id}`}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{student.name}</CardTitle>
                    <Badge
                      variant={
                        student.status === 'published'
                          ? 'success'
                          : student.status === 'draft'
                            ? 'warning'
                            : 'outline'
                      }
                    >
                      {student.status === 'published'
                        ? 'Published'
                        : student.status === 'draft'
                          ? 'Draft'
                          : 'No entries'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                    {student.status === 'empty' ? (
                      <>
                        <ClipboardList size={14} />
                        <span>No entries yet</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        <span>{student.entryCount} entries</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
