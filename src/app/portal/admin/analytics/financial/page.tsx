// @anchor: cca.analytics.financial-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Financial Analytics | Admin Portal',
  description: 'P&L, cash flow, budget vs actual, and accounts receivable aging',
}

export default function AdminFinancialAnalyticsPage() {
  const mockStats = [
    { label: 'Revenue MTD', value: '$48,320' },
    { label: 'Expenses MTD', value: '$31,450' },
    { label: 'Net Income MTD', value: '$16,870' },
    { label: 'Outstanding AR', value: '$4,280' },
  ]

  const mockPL = [
    { category: 'Tuition Revenue', amount: '$42,800', type: 'revenue' as const },
    { category: 'Drop-in Revenue', amount: '$2,120', type: 'revenue' as const },
    { category: 'Registration Fees', amount: '$1,800', type: 'revenue' as const },
    { category: 'Subsidy Payments', amount: '$1,600', type: 'revenue' as const },
    { category: 'Staff Salaries', amount: '$22,400', type: 'expense' as const },
    { category: 'Facility & Rent', amount: '$4,200', type: 'expense' as const },
    { category: 'Supplies', amount: '$1,850', type: 'expense' as const },
    { category: 'Food & Kitchen', amount: '$1,600', type: 'expense' as const },
    { category: 'Insurance', amount: '$1,400', type: 'expense' as const },
  ]

  const arAging = [
    { bucket: 'Current', amount: '$2,140', count: 8 },
    { bucket: '1-30 Days', amount: '$1,280', count: 4 },
    { bucket: '31-60 Days', amount: '$620', count: 2 },
    { bucket: '61-90 Days', amount: '$240', count: 1 },
  ]

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

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {mockStats.map((stat) => (
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
          Profit & Loss — April 2026
        </h2>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Revenue</p>
          {mockPL.filter((r) => r.type === 'revenue').map((row) => (
            <div key={row.category} className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{row.category}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{row.amount}</span>
            </div>
          ))}
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-destructive)' }}>Expenses</p>
          {mockPL.filter((r) => r.type === 'expense').map((row) => (
            <div key={row.category} className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{row.category}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{row.amount}</span>
            </div>
          ))}
          <div className="flex justify-between border-t-2 pt-2" style={{ borderColor: 'var(--color-foreground)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--color-foreground)' }}>Net Income</span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>$16,870</span>
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
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {arAging.map((bucket) => (
            <div key={bucket.bucket} className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{bucket.amount}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{bucket.bucket}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{bucket.count} invoices</p>
            </div>
          ))}
        </div>
      </div>

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
