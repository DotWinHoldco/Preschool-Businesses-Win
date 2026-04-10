// @anchor: cca.checklist.progress
// Progress bar showing completion percentage for a checklist assignment

import { cn } from '@/lib/cn'

interface ChecklistProgressProps {
  completed: number
  total: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ChecklistProgress({
  completed,
  total,
  label,
  size = 'md',
}: ChecklistProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = pct === 100
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            {label}
          </span>
          <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {completed}/{total} ({pct}%)
          </span>
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full', heightClass)}
        style={{ backgroundColor: 'var(--color-muted)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${pct}% complete`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out')}
          style={{
            width: `${pct}%`,
            backgroundColor: isComplete ? 'var(--color-success, #10B981)' : 'var(--color-primary)',
          }}
        />
      </div>
    </div>
  )
}
