// @anchor: cca.curriculum.week-view
import { cn } from '@/lib/cn'
import { ActivityCard } from './activity-card'
import { CalendarDays, BookOpen } from 'lucide-react'

interface Activity {
  id: string
  day_of_week: number
  time_slot: string
  activity_name: string
  description: string
  duration_minutes: number
  standards_addressed: string[]
  completed: boolean
}

interface WeekViewProps {
  weekStartDate: string
  title: string
  theme: string
  faithComponent?: string
  activities: Activity[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function WeekView({ weekStartDate, title, theme, faithComponent, activities }: WeekViewProps) {
  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-primary)]">
            Week of {weekStartDate}
          </span>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">{title}</h2>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            Theme: {theme}
          </span>
          {faithComponent && (
            <span className="flex items-center gap-1 text-[var(--color-secondary)]">
              Faith: {faithComponent}
            </span>
          )}
        </div>
      </div>

      {/* Daily columns */}
      <div className="grid gap-4 md:grid-cols-5">
        {DAYS.map((day, dayIndex) => {
          const dayActivities = activities
            .filter((a) => a.day_of_week === dayIndex)
            .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
          const completedCount = dayActivities.filter((a) => a.completed).length

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{day}</h3>
                <span className={cn(
                  'text-xs',
                  completedCount === dayActivities.length && dayActivities.length > 0
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)]'
                )}>
                  {completedCount}/{dayActivities.length}
                </span>
              </div>
              {dayActivities.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-muted-foreground)]">
                  No activities
                </div>
              ) : (
                dayActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    name={activity.activity_name}
                    description={activity.description}
                    timeSlot={activity.time_slot}
                    durationMinutes={activity.duration_minutes}
                    standards={activity.standards_addressed}
                    completed={activity.completed}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
