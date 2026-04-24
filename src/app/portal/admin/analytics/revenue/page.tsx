// @anchor: cca.analytics.revenue-page
// Revenue analytics — last 12 months of invoices + payments with a monthly breakdown.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CsvExportButton } from '@/components/portal/analytics/csv-export-button'
import { exportRevenueCSV } from '@/lib/actions/analytics/export-revenue'

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
function fmtCents(v: number): string {
  return `$${(v / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function RevenueAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - 12)
  const sinceIso = since.toISOString()

  const [invoicesRes, paymentsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, amount_cents, status, due_date, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', sinceIso)
      .limit(5000),
    supabase
      .from('payments')
      .select('id, amount_cents, status, created_at, refunded_at, refund_amount_cents')
      .eq('tenant_id', tenantId)
      .gte('created_at', sinceIso)
      .limit(5000),
  ])

  const invoices = invoicesRes.data ?? []
  const payments = paymentsRes.data ?? []

  const buckets = new Map<
    string,
    { invoiced: number; paid: number; outstanding: number; refund: number }
  >()

  for (const inv of invoices) {
    const key = monthKey(new Date(inv.created_at as string))
    const b = buckets.get(key) ?? { invoiced: 0, paid: 0, outstanding: 0, refund: 0 }
    b.invoiced += Number(inv.amount_cents ?? 0)
    if (inv.status !== 'paid') {
      b.outstanding += Number(inv.amount_cents ?? 0)
    }
    buckets.set(key, b)
  }

  let totalPaidThisYear = 0
  let totalRefund = 0
  const currentYear = new Date().getUTCFullYear()

  for (const p of payments) {
    const created = new Date(p.created_at as string)
    const key = monthKey(created)
    const b = buckets.get(key) ?? { invoiced: 0, paid: 0, outstanding: 0, refund: 0 }
    if (p.status === 'succeeded' || p.status === 'paid') {
      b.paid += Number(p.amount_cents ?? 0)
      if (created.getUTCFullYear() === currentYear) totalPaidThisYear += Number(p.amount_cents ?? 0)
    }
    if (p.refunded_at) {
      const refund = Number(p.refund_amount_cents ?? 0)
      b.refund += refund
      totalRefund += refund
    }
    buckets.set(key, b)
  }

  const months = Array.from(buckets.keys()).sort().reverse()

  // MRR estimate — last full month's paid total
  const mrr = months.length >= 2 ? (buckets.get(months[1])?.paid ?? 0) : 0

  const overdueTotal = invoices
    .filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date as string) < new Date())
    .reduce((sum, i) => sum + Number(i.amount_cents ?? 0), 0)

  const stats = [
    { label: 'MRR (prev. month)', value: fmtCents(mrr) },
    { label: 'Paid This Year', value: fmtCents(totalPaidThisYear) },
    { label: 'Overdue Total', value: fmtCents(overdueTotal) },
    { label: 'Refunds (12mo)', value: fmtCents(totalRefund) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Revenue Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Last 12 months of invoices + payments.
          </p>
        </div>
        <CsvExportButton
          action={exportRevenueCSV}
          label="Export CSV"
          fallbackFilename="revenue.csv"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Monthly Breakdown
          </h2>
        </div>
        {months.length === 0 ? (
          <p className="px-4 pb-6 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No invoices or payments in the last 12 months.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Month', 'Invoiced', 'Paid', 'Outstanding', 'Refunds'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const b = buckets.get(m)!
                return (
                  <tr key={m} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-mono text-xs">{m}</td>
                    <td className="px-4 py-2">{fmtCents(b.invoiced)}</td>
                    <td className="px-4 py-2">{fmtCents(b.paid)}</td>
                    <td className="px-4 py-2">{fmtCents(b.outstanding)}</td>
                    <td className="px-4 py-2">{fmtCents(b.refund)}</td>
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
