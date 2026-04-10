// @anchor: cca.expenses.financial-dashboard
import { cn } from '@/lib/cn'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface FinancialSummary {
  revenue_cents: number
  expenses_cents: number
  net_income_cents: number
  accounts_receivable_cents: number
  revenue_change_pct: number
  expenses_change_pct: number
}

interface FinancialDashboardProps {
  summary: FinancialSummary
  periodLabel: string
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function FinancialDashboard({ summary, periodLabel }: FinancialDashboardProps) {
  const netPositive = summary.net_income_cents >= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Financial Overview</h2>
        <span className="text-sm text-[var(--color-muted-foreground)]">{periodLabel}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Revenue</span>
            <DollarSign className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(summary.revenue_cents)}
          </p>
          <div className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            summary.revenue_change_pct >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-destructive)]'
          )}>
            {summary.revenue_change_pct >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(summary.revenue_change_pct)}% vs last period
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Expenses</span>
            <CreditCard className="h-4 w-4 text-[var(--color-accent)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(summary.expenses_cents)}
          </p>
          <div className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            summary.expenses_change_pct <= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-warning)]'
          )}>
            {summary.expenses_change_pct >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(summary.expenses_change_pct)}% vs last period
          </div>
        </div>

        {/* Net Income */}
        <div className={cn(
          'rounded-[var(--radius)] border p-4',
          netPositive
            ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
            : 'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5'
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Net Income</span>
            {netPositive ? (
              <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[var(--color-destructive)]" />
            )}
          </div>
          <p className={cn('text-2xl font-bold', netPositive ? 'text-[var(--color-primary)]' : 'text-[var(--color-destructive)]')}>
            {formatCurrency(summary.net_income_cents)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            {netPositive ? 'Profitable' : 'Operating at a loss'}
          </p>
        </div>

        {/* Accounts Receivable */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Outstanding AR</span>
            <DollarSign className="h-4 w-4 text-[var(--color-warning)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(summary.accounts_receivable_cents)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Unpaid invoices
          </p>
        </div>
      </div>
    </div>
  )
}
