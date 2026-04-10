// @anchor: cca.staff.schedule-grid
// Weekly schedule grid display for staff members.

import { cn } from '@/lib/cn'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

interface ScheduleEntry {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  classroom_name: string
}

interface ScheduleGridProps {
  entries: ScheduleEntry[]
  className?: string
}

function formatTime(time: string): string {
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr = h % 12 || 12
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return time
  }
}

export function ScheduleGrid({ entries, className }: ScheduleGridProps) {
  const grouped: Record<string, ScheduleEntry[]> = {}
  for (const entry of entries) {
    const day = entry.day_of_week.toLowerCase()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(entry)
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="grid grid-cols-5 gap-2 min-w-[600px]">
        {/* Header */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="rounded-t-[var(--radius,0.75rem)] bg-[var(--color-muted)] px-3 py-2 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {day}
            </span>
          </div>
        ))}

        {/* Cells */}
        {DAYS.map((day) => {
          const dayEntries = grouped[day.toLowerCase()] ?? []
          return (
            <div
              key={`cell-${day}`}
              className="min-h-[80px] rounded-b-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-2"
            >
              {dayEntries.length === 0 ? (
                <p className="text-xs text-[var(--color-muted-foreground)] italic text-center py-4">
                  Off
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[calc(var(--radius,0.75rem)*0.5)] bg-[var(--color-primary)]/10 px-2 py-1.5"
                    >
                      <p className="text-xs font-medium text-[var(--color-primary)]">
                        {entry.classroom_name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
