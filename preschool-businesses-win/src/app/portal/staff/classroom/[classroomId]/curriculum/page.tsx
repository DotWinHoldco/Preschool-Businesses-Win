// @anchor: cca.curriculum.page
// Staff curriculum view for a specific classroom
// Next.js 16: params is a Promise, must await

import { createTenantServerClient } from '@/lib/supabase/server'
import { WeekView } from '@/components/portal/curriculum/week-view'
import { BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params
  const supabase = await createTenantServerClient()

  // Fetch classroom info
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('id', classroomId)
    .single()

  // Fetch recent lesson plans
  const { data: lessonPlans } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('week_start_date', { ascending: false })
    .limit(5)

  // Fetch activities for the most recent lesson plan
  const currentPlan = lessonPlans?.[0]
  let activities: Array<{
    id: string
    day_of_week: number
    time_slot: string
    activity_name: string
    description: string
    duration_minutes: number
    standards_addressed: string[]
    completed: boolean
  }> = []

  if (currentPlan) {
    const { data } = await supabase
      .from('lesson_plan_activities')
      .select('*')
      .eq('lesson_plan_id', currentPlan.id)
      .order('day_of_week', { ascending: true })

    activities = (data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      day_of_week: a.day_of_week as number,
      time_slot: a.time_slot as string,
      activity_name: a.activity_name as string,
      description: (a.description as string) ?? '',
      duration_minutes: (a.duration_minutes as number) ?? 30,
      standards_addressed: (a.standards_addressed as string[]) ?? [],
      completed: (a.completed as boolean) ?? false,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Curriculum</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {classroom?.name ?? 'Classroom'} - Lesson plans and activities
          </p>
        </div>
        <Link
          href={`/portal/staff/classroom/${classroomId}/curriculum?action=new`}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Plan
        </Link>
      </div>

      {currentPlan ? (
        <WeekView
          weekStartDate={currentPlan.week_start_date}
          title={currentPlan.title}
          theme={currentPlan.theme ?? ''}
          faithComponent={currentPlan.faith_component}
          activities={activities}
        />
      ) : (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">No lesson plans yet</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Create your first lesson plan for this classroom
          </p>
          <Link
            href={`/portal/staff/classroom/${classroomId}/curriculum?action=new`}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
          >
            <Plus className="h-4 w-4" /> Create Lesson Plan
          </Link>
        </div>
      )}

      {/* Previous plans */}
      {lessonPlans && lessonPlans.length > 1 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Previous Plans</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {lessonPlans.slice(1).map((plan: Record<string, unknown>) => (
              <div key={plan.id as string} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{plan.title as string}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Week of {plan.week_start_date as string} | {plan.theme as string}
                  </p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                  {plan.status as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
