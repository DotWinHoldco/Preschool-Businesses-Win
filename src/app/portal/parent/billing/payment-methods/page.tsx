// @anchor: cca.billing.payment-methods
// Payment method management for parents.

import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default async function PaymentMethodsPage() {
  // Payment methods require Stripe integration which is not connected yet.
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

      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)]">
            <CreditCard size={24} className="text-[var(--color-muted-foreground)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Online payments coming soon
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
            Payment method management requires Stripe integration. Contact your school to set up online payments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
