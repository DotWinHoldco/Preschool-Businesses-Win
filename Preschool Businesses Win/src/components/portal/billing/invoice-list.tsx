// @anchor: cca.billing.invoice-list
// Invoice list with status badges for admin and parent views.

import { cn } from '@/lib/cn'
import { FileText } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  family_name?: string
  period_start: string
  period_end: string
  total_cents: number
  status: string
  due_date: string
}

interface InvoiceListProps {
  invoices: Invoice[]
  basePath: string
  showFamily?: boolean
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  sent: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  paid: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  overdue: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  voided: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] line-through',
  refunded: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
}

export function InvoiceList({ invoices, basePath, showFamily = false, className }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className={cn('rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center', className)}>
        <FileText size={32} className="mx-auto mb-2 text-[var(--color-muted-foreground)]" />
        <p className="text-sm text-[var(--color-muted-foreground)]">No invoices found.</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {invoices.map((invoice) => (
        <a
          key={invoice.id}
          href={`${basePath}/${invoice.id}`}
          className={cn(
            'flex items-center justify-between gap-4 rounded-[var(--radius,0.75rem)]',
            'border border-[var(--color-border)] bg-[var(--color-card)] p-4',
            'hover:shadow-[0_2px_4px_rgba(28,28,40,.06),0_24px_48px_-12px_rgba(37,99,235,.12)]',
            'transition-shadow',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius,0.75rem)*0.5)] bg-[var(--color-muted)]">
              <FileText size={18} className="text-[var(--color-muted-foreground)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                {invoice.invoice_number}
              </p>
              {showFamily && invoice.family_name && (
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {invoice.family_name}
                </p>
              )}
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Due {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-[var(--color-foreground)]">
              {formatCurrency(invoice.total_cents)}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft,
              )}
            >
              {invoice.status}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
