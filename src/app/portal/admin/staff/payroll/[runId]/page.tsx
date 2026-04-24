// @anchor: cca.payroll.run-detail
// Detail view of a single payroll run with line-item breakdown + actions.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PayrollDetailActions } from '@/components/portal/staff/payroll-detail-actions'

type Params = Promise<{ runId: string }>

function formatCurrency(dollars: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars ?? 0)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function PayrollRunDetailPage({ params }: { params: Params }) {
  const { runId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const [{ data: run }, { data: lines }] = await Promise.all([
    supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', runId)
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabase
      .from('payroll_line_items')
      .select('*, user_profiles(first_name, last_name, email)')
      .eq('payroll_run_id', runId)
      .eq('tenant_id', tenantId),
  ])

  if (!run) notFound()

  const statusVariant = (s: string) => {
    if (s === 'paid') return 'success' as const
    if (s === 'exported') return 'default' as const
    if (s === 'approved') return 'secondary' as const
    return 'outline' as const
  }

  const lineItems = lines ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal/admin/staff/payroll"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to payroll
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Payroll Run</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {formatDate(run.period_start as string | null)} &mdash;{' '}
              {formatDate(run.period_end as string | null)}
            </p>
          </div>
          <Badge variant={statusVariant((run.status as string) ?? 'draft')}>
            {(run.status as string) ?? 'draft'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items ({lineItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No line items for this run.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-right font-semibold">Reg Hrs</th>
                    <th className="px-4 py-3 text-right font-semibold">OT Hrs</th>
                    <th className="px-4 py-3 text-right font-semibold">Regular</th>
                    <th className="px-4 py-3 text-right font-semibold">OT</th>
                    <th className="px-4 py-3 text-right font-semibold">Gross</th>
                    <th className="px-4 py-3 text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li) => {
                    const prof =
                      (li.user_profiles as {
                        first_name?: string
                        last_name?: string
                        email?: string
                      } | null) ?? null
                    const name = prof
                      ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() ||
                        (prof.email ?? '')
                      : (li.user_id as string)
                    return (
                      <tr key={li.id as string} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                          {Number(li.regular_hours ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                          {Number(li.overtime_hours ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Number(li.regular_pay ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Number(li.overtime_pay ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(Number(li.gross_pay ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(Number(li.net_pay ?? 0))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-muted)]/50">
                    <td className="px-4 py-3 font-bold" colSpan={5}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatCurrency(Number(run.total_gross ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatCurrency(Number(run.total_net ?? 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PayrollDetailActions runId={runId} status={(run.status as string) ?? 'draft'} />
    </div>
  )
}
