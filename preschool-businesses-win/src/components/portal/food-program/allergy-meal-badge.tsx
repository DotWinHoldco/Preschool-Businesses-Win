// @anchor: cca.food-program.allergy-badge
import { cn } from '@/lib/cn'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

interface AllergyMealBadgeProps {
  allergens: string[]
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  compact?: boolean
}

export function AllergyMealBadge({ allergens, severity = 'moderate', compact = false }: AllergyMealBadgeProps) {
  const isLifeThreatening = severity === 'life_threatening' || severity === 'severe'

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          isLifeThreatening
            ? 'bg-[var(--color-destructive)] text-white'
            : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
        )}
      >
        {isLifeThreatening ? (
          <ShieldAlert className="h-2.5 w-2.5" />
        ) : (
          <AlertTriangle className="h-2.5 w-2.5" />
        )}
        {allergens[0]}{allergens.length > 1 ? ` +${allergens.length - 1}` : ''}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius)] p-3',
        isLifeThreatening
          ? 'border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)]/5'
          : 'border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5'
      )}
    >
      <div className="flex items-start gap-2">
        {isLifeThreatening ? (
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-[var(--color-destructive)]" />
        ) : (
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[var(--color-warning)]" />
        )}
        <div>
          <p className={cn(
            'text-sm font-semibold',
            isLifeThreatening ? 'text-[var(--color-destructive)]' : 'text-[var(--color-warning)]'
          )}>
            {isLifeThreatening ? 'Life-Threatening Allergy' : 'Food Allergy'}
          </p>
          <p className="text-sm text-[var(--color-foreground)] mt-0.5">
            {allergens.join(', ')}
          </p>
          {isLifeThreatening && (
            <p className="text-xs text-[var(--color-destructive)] mt-1 font-medium">
              Check meal substitution before serving
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
