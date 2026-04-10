// @anchor: cca.daily-report.activity-entry
// Activity entry display — name, engagement level, optional photo.

import { cn } from '@/lib/cn'

const ENGAGEMENT: Record<string, { label: string; color: string }> = {
  high: { label: 'Highly engaged', color: 'bg-[var(--color-success)]' },
  medium: { label: 'Engaged', color: 'bg-[var(--color-primary)]' },
  low: { label: 'Low engagement', color: 'bg-[var(--color-warning)]' },
}

interface ActivityEntryProps {
  activityName: string
  description?: string
  engagementLevel: string
  photoPaths?: string[]
  className?: string
}

export function ActivityEntry({
  activityName,
  description,
  engagementLevel,
  photoPaths = [],
  className,
}: ActivityEntryProps) {
  const engagement = ENGAGEMENT[engagementLevel]

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {activityName}
        </span>
        {engagement && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
              engagement.color,
            )}
          >
            {engagement.label}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
      )}
      {photoPaths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {photoPaths.map((path, i) => (
            <div
              key={i}
              className="h-16 w-16 shrink-0 rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)] overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={path}
                alt={`Activity photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
