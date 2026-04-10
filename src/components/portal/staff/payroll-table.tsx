// @anchor: cca.payroll.table
// Payroll run summary table with line items per staff member.

import { cn } from '@/lib/cn'

interface PayrollLineItem {
  id: string
  user_name: string
  regular_hours: number
  overtime_hours: number
  regular_pay: number
  overtime_pay: number
  pto_hours: number
  pto_pay: number
  gross_pay: number
  net_pay: number
}

interface PayrollTableProps {
  periodStart: string
  periodEnd: string
  status: string
  lineItems: PayrollLineItem[]
  totalGross: number
  totalNet: number
  className?: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatHours(hours: number): string {
  return hours.toFixed(1)
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  approved: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  exported: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  paid: 'bg-[var(--color-success)] text-white',
}

export function PayrollTable({
  periodStart,
  periodEnd,
  status,
  lineItems,
  totalGross,
  totalNet,
  className,
}: PayrollTableProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
            Payroll: {periodStart} to {periodEnd}
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {lineItems.length} staff member{lineItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize',
            STATUS_COLORS[status] ?? STATUS_COLORS.draft,
          )}
        >
          {status}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-muted)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-foreground)]">Staff</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">Reg Hrs</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">OT Hrs</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">PTO Hrs</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">Gross</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">Net</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{item.user_name}</td>
                <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">{formatHours(item.regular_hours)}</td>
                <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                  {item.overtime_hours > 0 ? (
                    <span className="text-[var(--color-warning)]">{formatHours(item.overtime_hours)}</span>
                  ) : (
                    formatHours(item.overtime_hours)
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">{formatHours(item.pto_hours)}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">{formatCurrency(item.gross_pay * 100)}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">{formatCurrency(item.net_pay * 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-muted)]/50">
              <td className="px-4 py-3 font-bold text-[var(--color-foreground)]" colSpan={4}>
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-[var(--color-foreground)]">{formatCurrency(totalGross * 100)}</td>
              <td className="px-4 py-3 text-right font-bold text-[var(--color-foreground)]">{formatCurrency(totalNet * 100)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
