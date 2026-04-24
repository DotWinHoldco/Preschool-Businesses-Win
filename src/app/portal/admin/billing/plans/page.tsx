// @anchor: cca.billing.plans
// Billing plans management page.

import Link from 'next/link'
import { PlanSelector } from '@/components/portal/billing/plan-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BillingPlansPage() {
  // TODO: Fetch billing plans from Supabase
  const plans = [
    {
      id: '1',
      name: 'Infant Full Day',
      description: 'Full-day program for infants 6-17 months',
      amount_cents: 135000,
      frequency: 'monthly',
      sibling_discount_pct: 10,
    },
    {
      id: '2',
      name: 'Toddler Full Day',
      description: 'Full-day program for toddlers 18-35 months',
      amount_cents: 120000,
      frequency: 'monthly',
      sibling_discount_pct: 10,
    },
    {
      id: '3',
      name: 'Pre-K Full Day',
      description: 'Full-day Pre-K for ages 3-5',
      amount_cents: 95000,
      frequency: 'monthly',
      sibling_discount_pct: 10,
    },
    {
      id: '4',
      name: 'Half Day AM',
      description: 'Morning half-day program',
      amount_cents: 65000,
      frequency: 'monthly',
      sibling_discount_pct: 10,
    },
    {
      id: '5',
      name: 'Before Care',
      description: '6:30 AM - 8:00 AM',
      amount_cents: 25000,
      frequency: 'monthly',
    },
    {
      id: '6',
      name: 'After Care',
      description: '3:00 PM - 6:00 PM',
      amount_cents: 30000,
      frequency: 'monthly',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/portal/admin/billing"
            className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
          >
            &larr; Back to billing
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing Plans</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage tuition plans and pricing
          </p>
        </div>
        <button
          type="button"
          className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          Add Plan
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanSelector plans={plans} />
        </CardContent>
      </Card>
    </div>
  )
}
