// @anchor: cca.billing.admin-invoice-detail
// Admin invoice detail page.

import { InvoiceDetail } from '@/components/portal/billing/invoice-detail'

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Fetch invoice data from Supabase
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <a
        href="/portal/admin/billing"
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        &larr; Back to billing
      </a>

      <InvoiceDetail {...invoice} />

      {/* Admin actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2.5 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          Record Payment
        </button>
        <button
          type="button"
          className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-[var(--color-muted)] transition-colors"
        >
          Send Reminder
        </button>
        <button
          type="button"
          className="rounded-[var(--radius,0.75rem)] border border-[var(--color-destructive)] text-[var(--color-destructive)] px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-[var(--color-destructive)]/10 transition-colors"
        >
          Void Invoice
        </button>
      </div>
    </div>
  )
}
