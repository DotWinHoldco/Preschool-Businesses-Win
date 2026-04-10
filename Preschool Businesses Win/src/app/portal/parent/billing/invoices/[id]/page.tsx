// @anchor: cca.billing.parent-invoice
// Parent invoice view with payment option.

import { InvoiceDetail } from '@/components/portal/billing/invoice-detail'
import { PaymentForm } from '@/components/portal/billing/payment-form'

export default async function ParentInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Fetch invoice from Supabase
  const invoice = {
    invoiceNumber: `INV-${id.slice(0, 8).toUpperCase()}`,
    familyName: 'Martinez Family',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    dueDate: '2026-04-30',
    status: 'sent',
    lineItems: [
      { id: '1', description: 'Pre-K Full Day - April 2026', quantity: 1, unit_amount_cents: 95000, total_cents: 95000, category: 'tuition' },
      { id: '2', description: 'Before Care - April 2026', quantity: 1, unit_amount_cents: 25000, total_cents: 25000, category: 'tuition' },
      { id: '3', description: 'Spring Supply Fee', quantity: 1, unit_amount_cents: 5000, total_cents: 5000, category: 'supplies' },
    ],
    subtotalCents: 125000,
    discountsCents: 0,
    taxCents: 0,
    totalCents: 125000,
    paidAt: null,
  }

  const needsPayment = invoice.status !== 'paid' && invoice.status !== 'voided'

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <a
        href="/portal/parent/billing"
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        &larr; Back to billing
      </a>

      <InvoiceDetail {...invoice} />

      {needsPayment && (
        <PaymentForm
          invoiceId={id}
          amountCents={invoice.totalCents}
        />
      )}
    </div>
  )
}
