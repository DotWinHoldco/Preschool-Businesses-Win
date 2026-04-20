// @anchor: cca.expenses.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { ExpensesPageClient } from '@/components/portal/expenses/expenses-page-client'

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

  // Map server data to the client-friendly shape
  const mappedExpenses = (expenses ?? []).map((exp: Record<string, unknown>) => {
    const cat = exp.expense_categories as Record<string, unknown> | null
    return {
      id: exp.id as string,
      date: exp.date as string,
      vendor: exp.vendor as string,
      category_name: (cat?.name as string) ?? 'Uncategorized',
      amount_cents: (exp.amount_cents as number) ?? 0,
      memo: (exp.memo as string) ?? '',
    }
  })

  const mappedCategories = (categories ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
  }))

  const totalExpenses = mappedExpenses.reduce((s, e) => s + e.amount_cents, 0)

  return (
    <ExpensesPageClient
      initialExpenses={mappedExpenses}
      categories={mappedCategories}
      totalExpensesCents={totalExpenses}
    />
  )
}
