// @anchor: cca.classroom.capacity-gauge
// Visual capacity bar showing current enrollment vs max capacity.
// Green = plenty of room, yellow = getting full, red = at capacity.

import { cn } from '@/lib/cn'

export interface CapacityGaugeProps {
  current: number
  max: number
  label?: string
  className?: string
}

export function CapacityGauge({
  current,
  max,
  label,
  className,
}: CapacityGaugeProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const remaining = max - current

  let barColor: string
  if (pct >= 100) {
    barColor = 'bg-red-500'
  } else if (pct >= 80) {
    barColor = 'bg-yellow-500'
  } else {
    barColor = 'bg-green-500'
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--color-foreground)]">
          {label ?? 'Capacity'}
        </span>
        <span className="tabular-nums text-[var(--color-muted-foreground)]">
          {current}/{max}
          {remaining > 0 && (
            <span className="ml-1 text-[var(--color-muted-foreground)]">
              ({remaining} open)
            </span>
          )}
          {remaining <= 0 && (
            <span className="ml-1 font-semibold text-red-600">Full</span>
          )}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${current} of ${max} capacity`}
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
