// @anchor: cca.daily-report.parent-view
// Parent view of their child's daily reports — beautiful timeline.

import { ReportTimeline } from '@/components/portal/daily-reports/report-timeline'

export default async function ParentDailyReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params

  // TODO: Fetch student info and published daily reports from Supabase
  const student = { id: studentId, name: 'Sophia' }
  const today = new Date().toISOString().split('T')[0]

  // Sample published entries (would come from Supabase)
  const entries = [
    {
      id: '1',
      entry_type: 'meal',
      timestamp: `${today}T08:30:00Z`,
      data: {
        meal_type: 'breakfast',
        items_offered: ['Oatmeal', 'Banana', 'Milk'],
        amount_eaten: 'all',
      },
    },
    {
      id: '2',
      entry_type: 'activity',
      timestamp: `${today}T09:15:00Z`,
      data: {
        activity_name: 'Circle Time',
        description: 'We sang the alphabet song and counted to 20!',
        engagement_level: 'high',
        photo_paths: [],
      },
    },
    {
      id: '3',
      entry_type: 'nap',
      timestamp: `${today}T12:00:00Z`,
      data: { started_at: `${today}T12:00:00Z`, ended_at: `${today}T14:00:00Z`, quality: 'restful' },
    },
    {
      id: '4',
      entry_type: 'mood',
      timestamp: `${today}T15:00:00Z`,
      data: { overall: 'happy', notes: 'Had a wonderful day!' },
    },
    {
      id: '5',
      entry_type: 'meal',
      timestamp: `${today}T11:30:00Z`,
      data: {
        meal_type: 'lunch',
        items_offered: ['Chicken nuggets', 'Green beans', 'Applesauce'],
        amount_eaten: 'most',
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <a
          href={`/portal/parent/children/${studentId}`}
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to {student.name}
        </a>
      </div>

      <ReportTimeline
        studentName={student.name}
        date={today}
        entries={entries}
        status="published"
      />

      {/* Past reports navigation */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] mb-3">
          Past Reports
        </h3>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (i + 1))
            return (
              <button
                key={i}
                type="button"
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] min-h-[36px]"
              >
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
