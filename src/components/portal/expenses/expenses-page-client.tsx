'use client'

import { useState } from 'react'
import { ExpenseActions } from './expense-actions'
import { FinancialDashboard } from './financial-dashboard'

interface ExpenseRow {
  id: string
  date: string
  vendor: string
  category_name: string
  amount_cents: number
  memo: string
}

interface ExpensesPageClientProps {
  initialExpenses: ExpenseRow[]
  categories: { id: string; name: string }[]
  totalExpensesCents: number
}

export function ExpensesPageClient({ initialExpenses, categories }: ExpensesPageClientProps) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses)

  const runningTotal = expenses.reduce((s, e) => s + e.amount_cents, 0)

  function handleAddExpense(expense: ExpenseRow) {
    setExpenses((prev) => [expense, ...prev])
  }

  return (
    <div className="space-y-6">
      <ExpenseActions categories={categories} onAddExpense={handleAddExpense} />

      <FinancialDashboard
        summary={{
          revenue_cents: 0,
          expenses_cents: runningTotal,
          net_income_cents: -runningTotal,
          accounts_receivable_cents: 0,
          revenue_change_pct: 0,
          expenses_change_pct: 0,
        }}
        periodLabel="This Month"
      />

      {/* Expense list */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Recent Expenses</h3>
        </div>
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No expenses recorded yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-muted)]">
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                  Date
                </th>
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                  Vendor
                </th>
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">
                  Category
                </th>
                <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3 text-[var(--color-muted-foreground)]">{exp.date}</td>
                  <td className="p-3 font-medium text-[var(--color-foreground)]">{exp.vendor}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{exp.category_name}</td>
                  <td className="p-3 text-right font-medium text-[var(--color-foreground)]">
                    ${(exp.amount_cents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
