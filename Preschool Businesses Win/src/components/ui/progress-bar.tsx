import { cn } from '@/lib/cn'

export interface ProgressBarProps {
  /** 0-100 */
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-[var(--color-foreground)]">{label}</span>
          )}
          {showPercentage && (
            <span className="tabular-nums text-[var(--color-muted-foreground)]">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export { ProgressBar }
