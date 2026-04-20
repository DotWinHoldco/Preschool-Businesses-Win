// @anchor: cca.billing.subscriptions-page

import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Manage Subscriptions | Parent Portal',
  description: 'View and manage your active tuition subscriptions',
}

export default function ParentBillingSubscriptionsPage() {
  // The subscriptions table does not exist yet — show an honest empty state.
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

      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-muted)' }}
        >
          <FileText size={24} style={{ color: 'var(--color-muted-foreground)' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Subscription management coming soon
        </h2>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
          Recurring tuition subscription plans will be available here once set up by your school.
          Contact your school for current billing arrangements.
        </p>
        <a
          href="/portal/parent/billing"
          className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Back to Billing
        </a>
      </div>
    </div>
  )
}
