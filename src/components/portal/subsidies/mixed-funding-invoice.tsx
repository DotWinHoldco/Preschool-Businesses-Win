// @anchor: cca.subsidy.mixed-funding-invoice
import { DollarSign, Shield, CreditCard } from 'lucide-react'

interface MixedFundingInvoiceProps {
  invoice: {
    family_name: string
    student_name: string
    period: string
    total_tuition_cents: number
    subsidy_covered_cents: number
    family_copay_cents: number
    private_pay_balance_cents: number
    subsidy_agency: string
    case_number: string
  }
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function MixedFundingInvoice({ invoice }: MixedFundingInvoiceProps) {
  const subsidyPct =
    invoice.total_tuition_cents > 0
      ? Math.round((invoice.subsidy_covered_cents / invoice.total_tuition_cents) * 100)
      : 0

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Invoice Breakdown</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {invoice.student_name} - {invoice.family_name} | {invoice.period}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Total tuition */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-[var(--color-foreground)]">Total Tuition</span>
          <span className="text-lg font-bold text-[var(--color-foreground)]">
            {formatCurrency(invoice.total_tuition_cents)}
          </span>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        {/* Subsidy portion */}
        <div className="rounded-[var(--radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="text-sm font-medium text-[var(--color-primary)]">
              Subsidy Coverage ({subsidyPct}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {invoice.subsidy_agency} | Case: {invoice.case_number}
              </p>
            </div>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              -{formatCurrency(invoice.subsidy_covered_cents)}
            </span>
          </div>
        </div>

        {/* Co-pay */}
        {invoice.family_copay_cents > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[var(--color-warning)]" />
              <span className="text-sm text-[var(--color-foreground)]">Family Co-pay</span>
            </div>
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {formatCurrency(invoice.family_copay_cents)}
            </span>
          </div>
        )}

        {/* Private pay balance */}
        {invoice.private_pay_balance_cents > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--color-foreground)]" />
              <span className="text-sm text-[var(--color-foreground)]">Private Pay Balance</span>
            </div>
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {formatCurrency(invoice.private_pay_balance_cents)}
            </span>
          </div>
        )}

        <div className="h-px bg-[var(--color-border)]" />

        {/* Amount due */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Amount Due from Family
          </span>
          <span className="text-xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(invoice.family_copay_cents + invoice.private_pay_balance_cents)}
          </span>
        </div>

        {/* Visual breakdown bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-[var(--color-muted)]">
          <div
            className="bg-[var(--color-primary)] transition-all"
            style={{ width: `${subsidyPct}%` }}
            title={`Subsidy: ${formatCurrency(invoice.subsidy_covered_cents)}`}
          />
          <div
            className="bg-[var(--color-warning)] transition-all"
            style={{
              width: `${invoice.total_tuition_cents > 0 ? Math.round((invoice.family_copay_cents / invoice.total_tuition_cents) * 100) : 0}%`,
            }}
            title={`Co-pay: ${formatCurrency(invoice.family_copay_cents)}`}
          />
          <div
            className="bg-[var(--color-foreground)]/30 transition-all"
            style={{
              width: `${invoice.total_tuition_cents > 0 ? Math.round((invoice.private_pay_balance_cents / invoice.total_tuition_cents) * 100) : 0}%`,
            }}
            title={`Private pay: ${formatCurrency(invoice.private_pay_balance_cents)}`}
          />
        </div>
        <div className="flex gap-4 text-[10px] text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" /> Subsidy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" /> Co-pay
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-foreground)]/30" /> Private pay
          </span>
        </div>
      </div>
    </div>
  )
}
