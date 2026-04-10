'use client'

// @anchor: cca.curriculum.activity-card
import { cn } from '@/lib/cn'
import { Clock, BookOpen, CheckCircle } from 'lucide-react'

interface ActivityCardProps {
  name: string
  description?: string
  timeSlot: string
  durationMinutes: number
  category?: string
  standards?: string[]
  completed?: boolean
  onToggleComplete?: () => void
}

export function ActivityCard({
  name,
  description,
  timeSlot,
  durationMinutes,
  category,
  standards = [],
  completed = false,
  onToggleComplete,
}: ActivityCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all',
        completed && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                {category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
              <Clock className="h-3 w-3" />
              {timeSlot} ({durationMinutes} min)
            </span>
          </div>
          <h4 className={cn('text-sm font-semibold text-[var(--color-foreground)]', completed && 'line-through')}>
            {name}
          </h4>
          {description && (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)] line-clamp-2">{description}</p>
          )}
          {standards.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <BookOpen className="h-3 w-3 text-[var(--color-secondary)]" />
              {standards.map((s) => (
                <span key={s} className="text-[10px] rounded bg-[var(--color-secondary)]/10 px-1.5 py-0.5 text-[var(--color-secondary)]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {onToggleComplete && (
          <button
            onClick={onToggleComplete}
            className={cn(
              'flex-shrink-0 rounded-full p-1 transition-colors',
              completed
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]'
            )}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          >
            <CheckCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
