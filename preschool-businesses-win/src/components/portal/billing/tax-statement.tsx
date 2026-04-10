// @anchor: cca.billing.tax-statement
// Tax statement display for dependent-care FSA / tax credit claims.

import { cn } from '@/lib/cn'
import { FileText, Download } from 'lucide-react'

interface TaxStatementProps {
  taxYear: number
  familyName: string
  schoolName: string
  schoolAddress: string
  ein?: string
  totalPaidCents: number
  generatedAt: string
  className?: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function TaxStatement({
  taxYear,
  familyName,
  schoolName,
  schoolAddress,
  ein,
  totalPaidCents,
  generatedAt,
  className,
}: TaxStatementProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)]',
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-border)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <FileText size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                {taxYear} Tax Statement
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Dependent Care Statement
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--radius,0.75rem)]',
              'border border-[var(--color-border)] px-3 py-2 text-sm font-medium min-h-[44px]',
              'hover:bg-[var(--color-muted)] transition-colors',
            )}
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Provider info */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
            Care Provider
          </h3>
          <p className="text-sm font-medium text-[var(--color-foreground)]">{schoolName}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{schoolAddress}</p>
          {ein && (
            <p className="text-sm text-[var(--color-muted-foreground)]">EIN: {ein}</p>
          )}
        </div>

        {/* Family info */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
            Family
          </h3>
          <p className="text-sm font-medium text-[var(--color-foreground)]">{familyName}</p>
        </div>

        {/* Total paid */}
        <div className="rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Total child care expenses paid in {taxYear}
          </p>
          <p className="text-3xl font-bold text-[var(--color-foreground)] mt-1">
            {formatCurrency(totalPaidCents)}
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          This statement is provided for informational purposes for your dependent care
          flexible spending account (FSA) or child and dependent care tax credit (Form 2441).
          Please consult your tax advisor for eligibility requirements.
        </p>

        <p className="text-xs text-[var(--color-muted-foreground)]">
          Generated on{' '}
          {new Date(generatedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}
