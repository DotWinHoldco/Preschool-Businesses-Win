// @anchor: cca.billing.admin-dashboard
// Billing dashboard — revenue, outstanding, overdue invoices.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceList } from '@/components/portal/billing/invoice-list'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export default async function BillingDashboardPage() {
  // TODO: Fetch billing stats and invoices from Supabase
  const stats = {
    revenue_mtd: 4250000, // cents
    outstanding: 1250000,
    overdue: 350000,
    collected_pct: 87,
  }

  const recentInvoices = [
    { id: '1', invoice_number: 'INV-2026-001', family_name: 'Martinez Family', period_start: '2026-04-01', period_end: '2026-04-30', total_cents: 125000, status: 'sent', due_date: '2026-04-30' },
    { id: '2', invoice_number: 'INV-2026-002', family_name: 'Johnson Family', period_start: '2026-04-01', period_end: '2026-04-30', total_cents: 95000, status: 'paid', due_date: '2026-04-30' },
    { id: '3', invoice_number: 'INV-2026-003', family_name: 'Wilson Family', period_start: '2026-03-01', period_end: '2026-03-31', total_cents: 115000, status: 'overdue', due_date: '2026-03-31' },
  ]

  function fmt(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Revenue and invoice management</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/portal/admin/billing/plans"
            className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium min-h-[44px] inline-flex items-center hover:bg-[var(--color-muted)] transition-colors"
          >
            Plans
          </a>
          <button
            type="button"
            className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
          >
            Generate Invoices
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success)]/10">
              <TrendingUp size={20} className="text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{fmt(stats.revenue_mtd)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Revenue MTD</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
              <DollarSign size={20} className="text-[var(--color-warning)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{fmt(stats.outstanding)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-destructive)]/10">
              <AlertCircle size={20} className="text-[var(--color-destructive)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{fmt(stats.overdue)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <CheckCircle2 size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{stats.collected_pct}%</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Collection rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceList
            invoices={recentInvoices}
            basePath="/portal/admin/billing/invoices"
            showFamily
          />
        </CardContent>
      </Card>
    </div>
  )
}
