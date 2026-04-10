// @anchor: cca.daily-report.timeline
// Beautiful parent-facing timeline view of a child's daily report.

import { cn } from '@/lib/cn'
import { EntryCard } from './entry-card'

interface TimelineEntry {
  id: string
  entry_type: string
  timestamp: string
  data: Record<string, unknown>
  entered_by?: string
}

interface ReportTimelineProps {
  studentName: string
  date: string
  entries: TimelineEntry[]
  status: 'draft' | 'published'
  className?: string
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function ReportTimeline({
  studentName,
  date,
  entries,
  status,
  className,
}: ReportTimelineProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            {studentName}&apos;s Day
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{formatDate(date)}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
            status === 'published'
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
          )}
        >
          {status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Timeline */}
      {sortedEntries.length === 0 ? (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No entries yet for today.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3">
          {/* Timeline line */}
          <div
            className="absolute left-5 top-6 bottom-6 w-px bg-[var(--color-border)]"
            aria-hidden="true"
          />

          {sortedEntries.map((entry) => (
            <div key={entry.id} className="relative pl-2">
              <EntryCard
                entryType={entry.entry_type}
                timestamp={entry.timestamp}
                data={entry.data}
                enteredBy={entry.entered_by}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
