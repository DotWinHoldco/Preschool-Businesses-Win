// @anchor: cca.daily-report.meal-entry
// Meal entry component for daily reports — meal type, items, amount eaten.

import { cn } from '@/lib/cn'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
] as const

const AMOUNTS = [
  { value: 'all', label: 'All', color: 'bg-[var(--color-success)]' },
  { value: 'most', label: 'Most', color: 'bg-[var(--color-primary)]' },
  { value: 'some', label: 'Some', color: 'bg-[var(--color-warning)]' },
  { value: 'none', label: 'None', color: 'bg-[var(--color-destructive)]' },
] as const

interface MealEntryProps {
  mealType?: string
  items?: string[]
  amountEaten?: string
  notes?: string
  className?: string
}

export function MealEntry({
  mealType = 'lunch',
  items = [],
  amountEaten = 'all',
  notes,
  className,
}: MealEntryProps) {
  const meal = MEAL_TYPES.find((m) => m.value === mealType)
  const amount = AMOUNTS.find((a) => a.value === amountEaten)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {meal?.label ?? mealType}
        </span>
        {amount && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
              amount.color,
            )}
          >
            {amount.label}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {items.join(', ')}
        </p>
      )}
      {notes && (
        <p className="text-xs text-[var(--color-muted-foreground)] italic">{notes}</p>
      )}
    </div>
  )
}
