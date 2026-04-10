// @anchor: cca.cacfp.claim-report
import { cn } from '@/lib/cn'
import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react'

interface ClaimLine {
  meal_type: string
  eligible_count: number
  claimed_count: number
  rate_cents: number
  subtotal_cents: number
}

interface CACFPClaimReportProps {
  claim: {
    id: string
    claim_month: number
    claim_year: number
    status: string
    total_meals_claimed: number
    total_reimbursement_cents: number
    submitted_at: string | null
    paid_at: string | null
    paid_amount_cents: number | null
  }
  lines: ClaimLine[]
  onSubmit?: () => void
  onExport?: () => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; className: string }> = {
  draft: { icon: Clock, label: 'Draft', className: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]' },
  submitted: { icon: CheckCircle, label: 'Submitted', className: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' },
  paid: { icon: CheckCircle, label: 'Paid', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]' },
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  am_snack: 'AM Snack',
  lunch: 'Lunch',
  pm_snack: 'PM Snack',
  supper: 'Supper',
}

export function CACFPClaimReport({ claim, lines, onSubmit, onExport }: CACFPClaimReportProps) {
  const config = statusConfig[claim.status] ?? statusConfig.draft
  const StatusIcon = config.icon

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                CACFP Claim - {MONTH_NAMES[claim.claim_month - 1]} {claim.claim_year}
              </h2>
            </div>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', config.className)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--color-primary)]">
              ${(claim.total_reimbursement_cents / 100).toFixed(2)}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {claim.total_meals_claimed} meals claimed
            </div>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-muted)]">
              <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">Meal Type</th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">Eligible</th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">Claimed</th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">Rate</th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-medium text-[var(--color-foreground)]">
                  {mealTypeLabels[line.meal_type] ?? line.meal_type}
                </td>
                <td className="p-3 text-right text-[var(--color-muted-foreground)]">{line.eligible_count}</td>
                <td className="p-3 text-right text-[var(--color-foreground)]">{line.claimed_count}</td>
                <td className="p-3 text-right text-[var(--color-muted-foreground)]">
                  ${(line.rate_cents / 100).toFixed(2)}
                </td>
                <td className="p-3 text-right font-medium text-[var(--color-foreground)]">
                  ${(line.subtotal_cents / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-muted)]/50">
              <td colSpan={2} className="p-3 font-semibold text-[var(--color-foreground)]">Total</td>
              <td className="p-3 text-right font-semibold text-[var(--color-foreground)]">{claim.total_meals_claimed}</td>
              <td className="p-3" />
              <td className="p-3 text-right font-bold text-[var(--color-primary)]">
                ${(claim.total_reimbursement_cents / 100).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment info */}
      {claim.status === 'paid' && claim.paid_amount_cents !== null && (
        <div className="rounded-[var(--radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                Paid: ${(claim.paid_amount_cents / 100).toFixed(2)}
              </p>
              {claim.paid_at && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Received: {new Date(claim.paid_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {claim.status === 'draft' && onSubmit && (
          <button
            onClick={onSubmit}
            className="rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Submit Claim
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
        )}
      </div>
    </div>
  )
}
