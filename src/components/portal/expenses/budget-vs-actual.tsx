// @anchor: cca.expenses.budget-vs-actual
'use client'

import { cn } from '@/lib/cn'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface BudgetCategory {
  category_name: string
  budget_cents: number
  actual_cents: number
}

interface BudgetVsActualProps {
  categories: BudgetCategory[]
  periodLabel: string
}

export function BudgetVsActual({ categories, periodLabel }: BudgetVsActualProps) {
  const chartData = categories.map((c) => ({
    name: c.category_name.length > 15 ? c.category_name.slice(0, 13) + '...' : c.category_name,
    Budget: c.budget_cents / 100,
    Actual: c.actual_cents / 100,
  }))

  const totalBudget = categories.reduce((s, c) => s + c.budget_cents, 0)
  const totalActual = categories.reduce((s, c) => s + c.actual_cents, 0)
  const variance = totalBudget - totalActual
  const utilizationPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

  const overBudget = categories.filter((c) => c.actual_cents > c.budget_cents && c.budget_cents > 0)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Budget</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            ${(totalBudget / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{periodLabel}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Actual Spend</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            ${(totalActual / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{utilizationPct}% of budget</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Variance</p>
          <div className="flex items-center gap-1">
            {variance >= 0 ? (
              <TrendingDown className="h-5 w-5 text-[var(--color-primary)]" />
            ) : (
              <TrendingUp className="h-5 w-5 text-[var(--color-destructive)]" />
            )}
            <p className={cn('text-2xl font-bold', variance >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-destructive)]')}>
              ${(Math.abs(variance) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {variance >= 0 ? 'Under budget' : 'Over budget'}
          </p>
        </div>
      </div>

      {/* Over-budget warnings */}
      {overBudget.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
            <span className="text-sm font-medium text-[var(--color-warning)]">
              {overBudget.length} {overBudget.length === 1 ? 'category' : 'categories'} over budget
            </span>
          </div>
          <div className="space-y-0.5">
            {overBudget.map((c) => (
              <p key={c.category_name} className="text-xs text-[var(--color-foreground)]">
                {c.category_name}: ${((c.actual_cents - c.budget_cents) / 100).toFixed(2)} over
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Budget vs Actual by Category</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
              <Legend />
              <Bar dataKey="Budget" fill="var(--color-muted-foreground)" opacity={0.3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
