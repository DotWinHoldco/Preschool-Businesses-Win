// @anchor: cca.billing.admin-dashboard
// Billing dashboard — revenue, outstanding, overdue invoices — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceList } from '@/components/portal/billing/invoice-list'
import { BillingActions } from '@/components/portal/billing/billing-actions'
import { Pagination } from '@/components/ui/pagination'
import { parsePagination } from '@/lib/pagination'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export default async function BillingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { page, perPage, offset } = parsePagination(await searchParams)
  const supabase = await createTenantAdminClient(tenantId)
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  // Fetch all invoice data in parallel
  const [{ data: paidInvoices }, { data: outstandingInvoices }, { count: overdueCount }, { data: recentRows, count: invoiceCount }] =
    await Promise.all([
      // Revenue MTD: paid invoices this month
      supabase
        .from('invoices')
        .select('total_cents')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .gte('created_at', monthStart),
      // Outstanding: draft + sent
      supabase
        .from('invoices')
        .select('total_cents')
        .eq('tenant_id', tenantId)
        .in('status', ['draft', 'sent']),
      // Overdue: sent and past due
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'sent')
        .lt('due_date', today),
      // Recent invoices (paginated)
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: false })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1),
    ])

  const revenueMTD = (paidInvoices ?? []).reduce((sum, inv) => sum + (inv.total_cents ?? 0), 0)
  const outstandingTotal = (outstandingInvoices ?? []).reduce((sum, inv) => sum + (inv.total_cents ?? 0), 0)
  const totalOverdue = overdueCount ?? 0

  // Compute collection rate: paid / (paid + outstanding)
  const totalBilled = revenueMTD + outstandingTotal
  const collectedPct = totalBilled > 0 ? Math.round((revenueMTD / totalBilled) * 100) : 0

  // Join family names for recent invoices
  const familyIds = (recentRows ?? []).map((inv) => inv.family_id).filter(Boolean)
  const { data: families } = familyIds.length > 0
    ? await supabase.from('families').select('id, family_name').eq('tenant_id', tenantId).in('id', familyIds)
    : { data: [] as { id: string; family_name: string }[] }

  const familyMap = new Map((families ?? []).map((f) => [f.id, f.family_name]))

  const recentInvoices = (recentRows ?? []).map((inv) => ({
    id: inv.id as string,
    invoice_number: (inv.invoice_number as string) ?? '-',
    family_name: familyMap.get(inv.family_id as string) ?? 'Unknown',
    period_start: inv.period_start as string,
    period_end: inv.period_end as string,
    total_cents: (inv.total_cents as number) ?? 0,
    status: inv.status as string,
    due_date: inv.due_date as string,
  }))

  function fmt(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  return (
    <div className="flex flex-col gap-6">
      <BillingActions />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success)]/10">
              <TrendingUp size={20} className="text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{fmt(revenueMTD)}</p>
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
              <p className="text-xl font-bold text-[var(--color-foreground)]">{fmt(outstandingTotal)}</p>
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
              <p className="text-xl font-bold text-[var(--color-foreground)]">{totalOverdue}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Overdue invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <CheckCircle2 size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">{collectedPct}%</p>
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
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No invoices yet.</p>
          ) : (
            <InvoiceList
              invoices={recentInvoices}
              basePath="/portal/admin/billing/invoices"
              showFamily
            />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} perPage={perPage} total={invoiceCount ?? 0} basePath="/portal/admin/billing" />
    </div>
  )
}
