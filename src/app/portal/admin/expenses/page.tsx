// @anchor: cca.expenses.admin-page
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ExpensesAdminClient } from '@/components/portal/expenses/expenses-admin-client'

export default async function ExpensesPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [expensesRes, categoriesRes, vendorsRes, approvalsRes, receiptsRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, date, vendor, vendor_id, category_id, amount_cents, description, notes')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('expense_categories')
      .select('id, name, gl_code, is_active')
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase
      .from('vendors')
      .select(
        'id, name, contact_name, email, phone, address, tax_id, default_category_id, payment_terms_days, is_active, notes',
      )
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase
      .from('expense_approvals')
      .select('id, expense_id, status, approver_id, comments, decided_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('expense_receipts')
      .select('id, expense_id, file_path, file_name, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
  ])

  const expenses = (expensesRes.data ?? []).map((e) => ({
    id: e.id as string,
    date: (e.date as string) ?? '',
    vendor: (e.vendor as string) ?? '',
    vendor_id: (e.vendor_id as string) ?? null,
    category_id: (e.category_id as string) ?? null,
    amount_cents: (e.amount_cents as number) ?? 0,
    description: (e.description as string) ?? null,
    notes: (e.notes as string) ?? null,
  }))

  const categories = (categoriesRes.data ?? [])
    .filter((c) => c.is_active !== false)
    .map((c) => ({ id: c.id as string, name: (c.name as string) ?? '' }))

  const vendors = (vendorsRes.data ?? []).map((v) => ({
    id: v.id as string,
    name: (v.name as string) ?? '',
    contact_name: (v.contact_name as string) ?? null,
    email: (v.email as string) ?? null,
    phone: (v.phone as string) ?? null,
    address: (v.address as string) ?? null,
    tax_id: (v.tax_id as string) ?? null,
    default_category_id: (v.default_category_id as string) ?? null,
    payment_terms_days: (v.payment_terms_days as number) ?? null,
    is_active: (v.is_active as boolean) ?? true,
    notes: (v.notes as string) ?? null,
  }))

  const approvals = (approvalsRes.data ?? []).map((a) => ({
    id: a.id as string,
    expense_id: a.expense_id as string,
    status: (a.status as string) ?? 'pending',
    approver_id: (a.approver_id as string) ?? null,
    comments: (a.comments as string) ?? null,
    decided_at: (a.decided_at as string) ?? null,
  }))

  const receipts = (receiptsRes.data ?? []).map((r) => ({
    id: r.id as string,
    expense_id: r.expense_id as string,
    file_path: (r.file_path as string) ?? '',
    file_name: (r.file_name as string) ?? null,
  }))

  return (
    <ExpensesAdminClient
      expenses={expenses}
      categories={categories}
      vendors={vendors}
      approvals={approvals}
      receipts={receipts}
    />
  )
}
