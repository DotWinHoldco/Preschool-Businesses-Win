// @anchor: cca.subsidy.reconciliation
import type { ReactNode } from 'react'
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SubsidyClaim {
  id: string
  agency_name: string
  claim_period_start: string
  claim_period_end: string
  status: string
  total_claimed_cents: number
  total_paid_cents: number | null
}

interface ReconciliationBoardProps {
  claims: SubsidyClaim[]
  totalOutstanding: number
  renderActions?: (claim: SubsidyClaim) => ReactNode
}

const statusConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string }
> = {
  draft: {
    icon: Clock,
    label: 'Draft',
    className: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  },
  submitted: {
    icon: Clock,
    label: 'Submitted',
    className: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
  },
  paid: {
    icon: CheckCircle,
    label: 'Paid',
    className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  },
  partially_paid: {
    icon: AlertTriangle,
    label: 'Partial',
    className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  },
  denied: {
    icon: XCircle,
    label: 'Denied',
    className: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  },
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export function ReconciliationBoard({
  claims,
  totalOutstanding,
  renderActions,
}: ReconciliationBoardProps) {
  const totalClaimed = claims.reduce((s, c) => s + c.total_claimed_cents, 0)
  const totalPaid = claims.reduce((s, c) => s + (c.total_paid_cents ?? 0), 0)
  const pendingClaims = claims.filter((c) => c.status === 'submitted' || c.status === 'draft')

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Total Claimed</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(totalClaimed)}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Total Received</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div
          className={cn(
            'rounded-[var(--radius)] border p-4',
            totalOutstanding > 0
              ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-card)]',
          )}
        >
          <p className="text-xs text-[var(--color-muted-foreground)]">Outstanding</p>
          <p
            className={cn(
              'text-2xl font-bold',
              totalOutstanding > 0
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-foreground)]',
            )}
          >
            {formatCurrency(totalOutstanding)}
          </p>
          {pendingClaims.length > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {pendingClaims.length} claim(s) pending
            </p>
          )}
        </div>
      </div>

      {/* Claims table */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Subsidy Claims</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-muted)]">
              <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                Agency
              </th>
              <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                Period
              </th>
              <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                Status
              </th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">
                Claimed
              </th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">
                Paid
              </th>
              <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">
                Variance
              </th>
              {renderActions && (
                <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => {
              const config = statusConfig[claim.status] ?? statusConfig.draft
              const StatusIcon = config.icon
              const paid = claim.total_paid_cents ?? 0
              const variance = paid - claim.total_claimed_cents

              return (
                <tr key={claim.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3 font-medium text-[var(--color-foreground)]">
                    {claim.agency_name}
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {claim.claim_period_start} - {claim.claim_period_end}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        config.className,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="p-3 text-right text-[var(--color-foreground)]">
                    {formatCurrency(claim.total_claimed_cents)}
                  </td>
                  <td className="p-3 text-right text-[var(--color-foreground)]">
                    {claim.total_paid_cents !== null ? formatCurrency(paid) : '-'}
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right font-medium',
                      variance === 0
                        ? 'text-[var(--color-muted-foreground)]'
                        : variance > 0
                          ? 'text-[var(--color-primary)]'
                          : 'text-[var(--color-destructive)]',
                    )}
                  >
                    {claim.total_paid_cents !== null
                      ? (variance >= 0 ? '+' : '') + formatCurrency(variance)
                      : '-'}
                  </td>
                  {renderActions && (
                    <td className="p-3 text-right">
                      <div className="flex justify-end">{renderActions(claim)}</div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
