// @anchor: cca.analytics.financial-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Financial Analytics | Admin Portal',
  description: 'P&L, cash flow, budget vs actual, and accounts receivable aging',
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function AdminFinancialAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch all invoices for aggregation
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_cents, status, due_date, created_at')
    .eq('tenant_id', tenantId)

  const allInvoices = invoices ?? []

  // Revenue: sum of paid invoices
  const paidInvoices = allInvoices.filter((i) => i.status === 'paid')
  const revenueCents = paidInvoices.reduce((s, i) => s + (i.total_cents ?? 0), 0)

  // Outstanding AR: sum of unpaid invoices
  const unpaidInvoices = allInvoices.filter(
    (i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'void',
  )
  const outstandingCents = unpaidInvoices.reduce(
    (s, i) => s + (i.total_cents ?? 0),
    0,
  )

  // Fetch expenses grouped by category
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount_cents, category, description, created_at')
    .eq('tenant_id', tenantId)

  const allExpenses = expenses ?? []
  const totalExpenseCents = allExpenses.reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0,
  )
  const netIncomeCents = revenueCents - totalExpenseCents

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {}
  for (const e of allExpenses) {
    const cat = e.category || 'Uncategorized'
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (e.amount_cents ?? 0)
  }
  const expenseCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])

  // AR Aging buckets
  const now = new Date()
  const arBuckets = [
    { label: 'Current', minDays: -Infinity, maxDays: 0, cents: 0, count: 0 },
    { label: '1-30 Days', minDays: 1, maxDays: 30, cents: 0, count: 0 },
    { label: '31-60 Days', minDays: 31, maxDays: 60, cents: 0, count: 0 },
    { label: '61-90 Days', minDays: 61, maxDays: 90, cents: 0, count: 0 },
    { label: '90+ Days', minDays: 91, maxDays: Infinity, cents: 0, count: 0 },
  ]
  for (const inv of unpaidInvoices) {
    const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at)
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    for (const bucket of arBuckets) {
      if (daysOverdue >= bucket.minDays && daysOverdue <= bucket.maxDays) {
        bucket.cents += inv.total_cents ?? 0
        bucket.count += 1
        break
      }
    }
  }

  const stats = [
    { label: 'Revenue (Paid)', value: formatCurrency(revenueCents) },
    { label: 'Total Expenses', value: formatCurrency(totalExpenseCents) },
    { label: 'Net Income', value: formatCurrency(netIncomeCents) },
    { label: 'Outstanding AR', value: formatCurrency(outstandingCents) },
  ]

  const hasData = allInvoices.length > 0 || allExpenses.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Financial Analytics
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Profit & loss, cash flow projections, and accounts receivable aging.
        </p>
      </div>

      {!hasData ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>$0</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No financial data yet. Revenue and expense data will appear here once invoices and expenses are recorded.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* P&L */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Profit & Loss
            </h2>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Revenue</p>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>Paid Invoices ({paidInvoices.length})</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(revenueCents)}</span>
              </div>

              {expenseCategories.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-destructive)' }}>Expenses</p>
                  {expenseCategories.map(([category, cents]) => (
                    <div key={category} className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{category}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(cents)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="flex justify-between border-t-2 pt-2" style={{ borderColor: 'var(--color-foreground)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>Net Income</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{formatCurrency(netIncomeCents)}</span>
              </div>
            </div>
          </div>

          {/* AR Aging */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Accounts Receivable Aging
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {arBuckets.map((bucket) => (
                <div key={bucket.label} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(bucket.cents)}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{bucket.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{bucket.count} invoices</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Export P&L (PDF)
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Export to QuickBooks
        </button>
      </div>
    </div>
  )
}
