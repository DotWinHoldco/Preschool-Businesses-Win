// @anchor: cca.billing.subscriptions-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manage Subscriptions | Parent Portal',
  description: 'View and manage your active tuition subscriptions',
}

export default function ParentBillingSubscriptionsPage() {
  const mockSubscriptions = [
    {
      id: '1',
      studentName: 'Sophia Martinez',
      plan: 'Full-Day Pre-K',
      amount: '$1,200.00/mo',
      status: 'active' as const,
      nextBillingDate: 'May 1, 2026',
      paymentMethod: 'Visa ending 4242',
      discounts: ['Sibling Discount (10%)'],
      startDate: 'August 2025',
    },
    {
      id: '2',
      studentName: 'Lucas Martinez',
      plan: 'Full-Day Toddlers',
      amount: '$1,080.00/mo',
      status: 'active' as const,
      nextBillingDate: 'May 1, 2026',
      paymentMethod: 'Visa ending 4242',
      discounts: ['Sibling Discount (10%)'],
      startDate: 'January 2026',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Manage Subscriptions
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          View your active tuition plans and manage payment details.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Plans', value: mockSubscriptions.length.toString() },
          { label: 'Monthly Total', value: '$2,280.00' },
          { label: 'Next Billing', value: 'May 1, 2026' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Subscription cards */}
      {mockSubscriptions.map((sub) => (
        <div
          key={sub.id}
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {sub.studentName}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  Active
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {sub.plan} &middot; Since {sub.startDate}
              </p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {sub.amount}
            </p>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Payment Method</dt>
              <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{sub.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Next Billing Date</dt>
              <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{sub.nextBillingDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Discounts Applied</dt>
              <dd className="text-sm" style={{ color: 'var(--color-primary)' }}>
                {sub.discounts.join(', ') || 'None'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
            >
              Change Payment Method
            </button>
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              View History
            </button>
          </div>
        </div>
      ))}

      {/* Payment method */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Payment Methods
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          ACH (bank transfer) is preferred for lower processing fees.
        </p>
        <div className="mt-3 flex gap-3">
          <a
            href="/portal/parent/billing/payment-methods"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Manage Payment Methods
          </a>
        </div>
      </div>
    </div>
  )
}
