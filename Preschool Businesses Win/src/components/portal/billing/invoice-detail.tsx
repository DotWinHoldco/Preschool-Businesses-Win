// @anchor: cca.billing.invoice-detail
// Full invoice view with line items, status, and payment information.

import { cn } from '@/lib/cn'

interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unit_amount_cents: number
  total_cents: number
  category: string
}

interface InvoiceDetailProps {
  invoiceNumber: string
  familyName: string
  periodStart: string
  periodEnd: string
  dueDate: string
  status: string
  lineItems: InvoiceLine[]
  subtotalCents: number
  discountsCents: number
  taxCents: number
  totalCents: number
  paidAt?: string | null
  className?: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function InvoiceDetail({
  invoiceNumber,
  familyName,
  periodStart,
  periodEnd,
  dueDate,
  status,
  lineItems,
  subtotalCents,
  discountsCents,
  taxCents,
  totalCents,
  paidAt,
  className,
}: InvoiceDetailProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)]',
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-border)] p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">
              Invoice {invoiceNumber}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{familyName}</p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize',
                status === 'paid'
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : status === 'overdue'
                    ? 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
              )}
            >
              {status}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Period</p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {formatDate(periodStart)} - {formatDate(periodEnd)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Due Date</p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {formatDate(dueDate)}
            </p>
          </div>
          {paidAt && (
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Paid</p>
              <p className="text-sm font-medium text-[var(--color-success)]">
                {formatDate(paidAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="pb-2 text-left font-semibold text-[var(--color-foreground)]">Description</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-foreground)]">Qty</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-foreground)]">Unit Price</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-foreground)]">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((line) => (
              <tr key={line.id} className="border-b border-[var(--color-border)]/50">
                <td className="py-3 text-[var(--color-foreground)]">
                  <p>{line.description}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] capitalize">{line.category}</p>
                </td>
                <td className="py-3 text-right text-[var(--color-muted-foreground)]">{line.quantity}</td>
                <td className="py-3 text-right text-[var(--color-muted-foreground)]">
                  {formatCurrency(line.unit_amount_cents)}
                </td>
                <td className="py-3 text-right font-medium text-[var(--color-foreground)]">
                  {formatCurrency(line.total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex flex-col items-end gap-1">
          <div className="flex justify-between w-full max-w-[240px] text-sm">
            <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
            <span className="text-[var(--color-foreground)]">{formatCurrency(subtotalCents)}</span>
          </div>
          {discountsCents > 0 && (
            <div className="flex justify-between w-full max-w-[240px] text-sm">
              <span className="text-[var(--color-success)]">Discounts</span>
              <span className="text-[var(--color-success)]">-{formatCurrency(discountsCents)}</span>
            </div>
          )}
          {taxCents > 0 && (
            <div className="flex justify-between w-full max-w-[240px] text-sm">
              <span className="text-[var(--color-muted-foreground)]">Tax</span>
              <span className="text-[var(--color-foreground)]">{formatCurrency(taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between w-full max-w-[240px] border-t border-[var(--color-border)] pt-2 mt-1">
            <span className="text-base font-bold text-[var(--color-foreground)]">Total</span>
            <span className="text-base font-bold text-[var(--color-foreground)]">
              {formatCurrency(totalCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
