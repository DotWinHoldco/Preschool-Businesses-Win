// @anchor: cca.billing.parent-overview
// Parent billing overview — outstanding balance, recent invoices, payment methods.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceList } from '@/components/portal/billing/invoice-list'
import { DollarSign, CreditCard, FileText } from 'lucide-react'

export default async function ParentBillingPage() {
  // TODO: Fetch family billing info from Supabase
  const billing = {
    outstandingCents: 125000,
    nextDueDate: '2026-04-30',
    autopayEnabled: true,
    paymentMethod: 'Bank account ending in 4521',
  }

  const invoices = [
    { id: '1', invoice_number: 'INV-2026-001', period_start: '2026-04-01', period_end: '2026-04-30', total_cents: 125000, status: 'sent', due_date: '2026-04-30' },
    { id: '2', invoice_number: 'INV-2026-002', period_start: '2026-03-01', period_end: '2026-03-31', total_cents: 120000, status: 'paid', due_date: '2026-03-31' },
    { id: '3', invoice_number: 'INV-2026-003', period_start: '2026-02-01', period_end: '2026-02-28', total_cents: 120000, status: 'paid', due_date: '2026-02-28' },
  ]

  function fmt(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing</h1>

      {/* Outstanding balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <DollarSign size={24} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Current balance</p>
                <p className="text-3xl font-bold text-[var(--color-foreground)]">
                  {fmt(billing.outstandingCents)}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Due {billing.nextDueDate}
                </p>
              </div>
            </div>
            <a
              href="/portal/parent/billing/invoices/1"
              className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-6 py-3 text-sm font-semibold min-h-[48px] hover:brightness-110 transition-all inline-flex items-center"
            >
              Pay Now
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Payment method + autopay */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-foreground)]">{billing.paymentMethod}</p>
            <a
              href="/portal/parent/billing/payment-methods"
              className="text-xs text-[var(--color-primary)] hover:underline mt-1 inline-block"
            >
              Manage payment methods
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} />
              Auto-Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-foreground)]">
              {billing.autopayEnabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {billing.autopayEnabled
                ? 'Your balance will be automatically paid on the due date.'
                : 'Enable auto-pay to never miss a payment.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceList
            invoices={invoices}
            basePath="/portal/parent/billing/invoices"
          />
        </CardContent>
      </Card>
    </div>
  )
}
