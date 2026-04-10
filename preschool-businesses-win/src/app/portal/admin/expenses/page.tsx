// @anchor: cca.expenses.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { FinancialDashboard } from '@/components/portal/expenses/financial-dashboard'
import { Receipt, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default async function ExpensesPage() {
  const supabase = await createTenantServerClient()

  // Fetch recent expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_categories(name)')
    .order('date', { ascending: false })
    .limit(20)

  // Fetch expense categories for the entry form
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('id, name, gl_code')
    .eq('is_active', true)
    .order('name')

  // Calculate summary (simplified)
  const totalExpenses = (expenses ?? []).reduce(
    (s: number, e: Record<string, unknown>) => s + ((e.amount_cents as number) ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Expenses</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track expenses, manage budgets, and export to your accounting software
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/admin/expenses/exports"
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </Link>
          <button className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <FinancialDashboard
        summary={{
          revenue_cents: 0,
          expenses_cents: totalExpenses,
          net_income_cents: -totalExpenses,
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
        {(expenses ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No expenses recorded yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-muted)]">
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">Date</th>
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">Vendor</th>
                <th className="p-3 text-left font-medium text-[var(--color-muted-foreground)]">Category</th>
                <th className="p-3 text-right font-medium text-[var(--color-muted-foreground)]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(expenses ?? []).map((exp: Record<string, unknown>) => {
                const cat = exp.expense_categories as Record<string, unknown> | null
                return (
                  <tr key={exp.id as string} className="border-t border-[var(--color-border)]">
                    <td className="p-3 text-[var(--color-muted-foreground)]">{exp.date as string}</td>
                    <td className="p-3 font-medium text-[var(--color-foreground)]">{exp.vendor as string}</td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">{(cat?.name as string) ?? 'Uncategorized'}</td>
                    <td className="p-3 text-right font-medium text-[var(--color-foreground)]">
                      ${((exp.amount_cents as number) / 100).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
