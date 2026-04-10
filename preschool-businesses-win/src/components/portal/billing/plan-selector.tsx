'use client'

// @anchor: cca.billing.plan-selector
// Billing plan selection component.

import { cn } from '@/lib/cn'
import { Check } from 'lucide-react'

interface BillingPlan {
  id: string
  name: string
  description?: string
  amount_cents: number
  frequency: string
  sibling_discount_pct?: number
  staff_discount_pct?: number
}

interface PlanSelectorProps {
  plans: BillingPlan[]
  selectedId?: string
  onSelect?: (planId: string) => void
  className?: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatFrequency(freq: string): string {
  switch (freq) {
    case 'weekly': return '/week'
    case 'monthly': return '/month'
    case 'annually': return '/year'
    default: return `/${freq}`
  }
}

export function PlanSelector({ plans, selectedId, onSelect, className }: PlanSelectorProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {plans.map((plan) => {
        const isSelected = plan.id === selectedId
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect?.(plan.id)}
            className={cn(
              'relative flex flex-col rounded-[var(--radius,0.75rem)] border-2 p-5 text-left min-h-[48px]',
              'transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
              isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-muted-foreground)]',
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                <Check size={12} className="text-[var(--color-primary-foreground)]" />
              </div>
            )}
            <h4 className="text-base font-semibold text-[var(--color-foreground)]">{plan.name}</h4>
            {plan.description && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{plan.description}</p>
            )}
            <div className="mt-3">
              <span className="text-2xl font-bold text-[var(--color-foreground)]">
                {formatCurrency(plan.amount_cents)}
              </span>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {formatFrequency(plan.frequency)}
              </span>
            </div>
            {(plan.sibling_discount_pct ?? 0) > 0 && (
              <p className="mt-2 text-xs text-[var(--color-success)]">
                {plan.sibling_discount_pct}% sibling discount available
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
