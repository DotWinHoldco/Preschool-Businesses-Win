// @anchor: cca.payroll.dashboard
// Payroll dashboard — list of payroll runs, linked to detail pages.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'
import { PayrollRowExport } from '@/components/portal/staff/payroll-row-export'

export default async function PayrollDashboardPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: runs } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_end', { ascending: false })
    .limit(20)

  const payrollRuns = runs ?? []

  const statusVariant = (s: string) => {
    if (s === 'paid') return 'success' as const
    if (s === 'exported') return 'default' as const
    if (s === 'approved') return 'secondary' as const
    return 'outline' as const
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatCurrency(dollars: number | null) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars ?? 0)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Payroll</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Manage payroll runs</p>
        </div>
        <Link
          href="/portal/admin/staff/payroll/run"
          className="inline-flex items-center gap-2 rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          <DollarSign size={16} />
          New Payroll Run
        </Link>
      </div>

      {payrollRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] py-16 text-center">
          <DollarSign size={40} className="mb-3 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            No payroll runs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payrollRuns.map((run) => {
            const status = (run.status as string) ?? 'draft'
            const isCompleted = status === 'approved' || status === 'paid' || status === 'exported'
            return (
              <Card key={run.id as string}>
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <Link
                    href={`/portal/admin/staff/payroll/${run.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <p className="text-sm font-semibold text-[var(--color-foreground)] group-hover:underline">
                      {formatDate(run.period_start as string | null)} &mdash;{' '}
                      {formatDate(run.period_end as string | null)}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{status}</p>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[var(--color-foreground)]">
                        {formatCurrency(run.total_gross as number | null)}
                      </span>
                      {run.total_net != null && (
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Net: {formatCurrency(run.total_net as number)}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                    {isCompleted && <PayrollRowExport runId={run.id as string} />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
