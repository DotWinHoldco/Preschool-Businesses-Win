// @anchor: cca.daily-report.staff-student-page
// Per-student report builder — staff enters daily report entries.

import { ReportBuilder } from '@/components/portal/daily-reports/report-builder'
import { ReportTimeline } from '@/components/portal/daily-reports/report-timeline'

export default async function StudentDailyReportPage({
  params,
}: {
  params: Promise<{ classroomId: string; studentId: string }>
}) {
  const { classroomId, studentId } = await params

  // TODO: Fetch student info, daily report, and entries from Supabase
  const student = { id: studentId, name: 'Sophia Martinez' }
  const today = new Date().toISOString().split('T')[0]

  const entries = [
    {
      id: '1',
      entry_type: 'meal',
      timestamp: new Date().toISOString(),
      data: {
        meal_type: 'breakfast',
        items_offered: ['Oatmeal', 'Apple slices', 'Milk'],
        amount_eaten: 'most',
        notes: 'Loved the apple slices!',
      },
      entered_by: 'Ms. Johnson',
    },
    {
      id: '2',
      entry_type: 'mood',
      timestamp: new Date().toISOString(),
      data: { overall: 'happy', notes: 'Excited to see friends' },
      entered_by: 'Ms. Johnson',
    },
  ]

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
          {student.name}&apos;s Daily Report
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
        studentName={student.name}
        classroomId={classroomId}
        reportId="auto"
      />

      {/* Existing entries timeline */}
      <ReportTimeline
        studentName={student.name}
        date={today}
        entries={entries}
        status="draft"
      />

      {/* Publish button */}
      <form action="/api/daily-report/publish" method="POST">
        <input type="hidden" name="report_id" value="auto" />
        <input type="hidden" name="student_id" value={studentId} />
        <button
          type="submit"
          className="w-full rounded-[var(--radius,0.75rem)] bg-[var(--color-success)] text-white px-4 py-3 text-sm font-semibold min-h-[48px] hover:brightness-110 transition-all"
        >
          Publish Report (visible to parents)
        </button>
      </form>
    </div>
  )
}
