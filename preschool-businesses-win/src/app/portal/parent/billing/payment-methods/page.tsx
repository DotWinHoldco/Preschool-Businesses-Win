// @anchor: cca.billing.payment-methods
// Payment method management for parents.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Building2, Plus, Check } from 'lucide-react'

export default async function PaymentMethodsPage() {
  // TODO: Fetch payment methods from Stripe via Supabase
  const methods = [
    { id: 'pm_1', type: 'ach', label: 'Bank account ending in 4521', is_default: true },
    { id: 'pm_2', type: 'card', label: 'Visa ending in 8832', is_default: false },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <div>
        <a
          href="/portal/parent/billing"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to billing
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Payment Methods</h1>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {method.type === 'ach' ? (
                  <Building2 size={20} className="text-[var(--color-muted-foreground)]" />
                ) : (
                  <CreditCard size={20} className="text-[var(--color-muted-foreground)]" />
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{method.label}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] capitalize">{method.type === 'ach' ? 'Bank account' : 'Credit/Debit card'}</p>
                </div>
              </div>
              {method.is_default ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] px-2.5 py-0.5 text-xs font-medium">
                  <Check size={12} />
                  Default
                </span>
              ) : (
                <button
                  type="button"
                  className="text-xs text-[var(--color-primary)] hover:underline min-h-[44px]"
                >
                  Set as default
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add new method */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)] border-2 border-dashed border-[var(--color-border)] p-4 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] min-h-[48px] transition-colors"
          >
            <Plus size={16} />
            Add payment method
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
