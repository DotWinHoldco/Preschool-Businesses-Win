// @anchor: cca.billing.admin-invoices-list
// Admin invoices list — filter by status + family, paginated from invoices table.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/pagination'
import { parsePagination } from '@/lib/pagination'
import { BillingActions } from '@/components/portal/billing/billing-actions'
import { cn } from '@/lib/cn'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  pending: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  sent: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  paid: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  overdue: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  void: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] line-through',
  voided: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] line-through',
  refunded: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
}

const STATUS_FILTERS = ['all', 'pending', 'paid', 'overdue', 'void'] as const

export default async function AdminInvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const family = typeof params.family === 'string' ? params.family : ''
  const { page, perPage, offset } = parsePagination(params)
  const supabase = await createTenantAdminClient(tenantId)
  const today = new Date().toISOString().split('T')[0]

  // If filtering by family name, resolve matching family IDs first
  let familyIdFilter: string[] | null = null
  if (family) {
    const { data: fams } = await supabase
      .from('families')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('family_name', `%${family}%`)
    familyIdFilter = (fams ?? []).map((f) => f.id as string)
    if (familyIdFilter.length === 0) {
      // Short-circuit: no families match
      return (
        <div className="space-y-6">
          <BillingActions />
          <FilterBar status={status} family={family} />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No families match &ldquo;{family}&rdquo;.
          </p>
        </div>
      )
    }
  }

  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact', head: false })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (status === 'overdue') {
    query = query.in('status', ['sent', 'pending']).lt('due_date', today)
  } else if (status && status !== 'all') {
    // "void" filter should match either stored variant
    if (status === 'void') {
      query = query.in('status', ['void', 'voided'])
    } else {
      query = query.eq('status', status)
    }
  }

  if (familyIdFilter) {
    query = query.in('family_id', familyIdFilter)
  }

  const { data: rows, count } = await query

  const familyIds = Array.from(new Set((rows ?? []).map((r) => r.family_id).filter(Boolean)))
  const { data: families } =
    familyIds.length > 0
      ? await supabase
          .from('families')
          .select('id, family_name')
          .eq('tenant_id', tenantId)
          .in('id', familyIds)
      : { data: [] as { id: string; family_name: string }[] }
  const familyMap = new Map((families ?? []).map((f) => [f.id, f.family_name]))

  const invoices = (rows ?? []).map((r) => {
    const dueDate = r.due_date as string | null
    const rawStatus = (r.status as string) ?? 'draft'
    const displayStatus =
      rawStatus !== 'paid' &&
      rawStatus !== 'void' &&
      rawStatus !== 'voided' &&
      dueDate &&
      dueDate < today
        ? 'overdue'
        : rawStatus
    return {
      id: r.id as string,
      family_name: familyMap.get(r.family_id as string) ?? 'Unknown',
      period_start: r.period_start as string,
      period_end: r.period_end as string,
      total_cents: (r.total_cents as number) ?? 0,
      amount_paid_cents: (r.amount_paid_cents as number) ?? 0,
      status: displayStatus,
      due_date: dueDate,
    }
  })

  return (
    <div className="space-y-6">
      <BillingActions />

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Invoices</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {count ?? 0} invoice{(count ?? 0) === 1 ? '' : 's'}
        </p>
      </div>

      <FilterBar status={status} family={family} />

      {invoices.length === 0 ? (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">No invoices found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)]/40 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">Family</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">Period</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)] text-right">
                  Total
                </th>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)] text-right">
                  Paid
                </th>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">Status</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">Due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/20"
                >
                  <td className="px-4 py-3 text-[var(--color-foreground)]">{inv.family_name}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">
                    {formatCurrency(inv.total_cents)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                    {formatCurrency(inv.amount_paid_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                        STATUS_STYLES[inv.status] ?? STATUS_STYLES.draft,
                      )}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/portal/admin/billing/invoices/${inv.id}`}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        perPage={perPage}
        total={count ?? 0}
        basePath={buildBasePath(status, family)}
      />
    </div>
  )
}

function buildBasePath(status: string, family: string): string {
  const qs = new URLSearchParams()
  if (status && status !== 'all') qs.set('status', status)
  if (family) qs.set('family', family)
  const s = qs.toString()
  return `/portal/admin/billing/invoices${s ? `?${s}` : ''}`
}

function FilterBar({ status, family }: { status: string; family: string }) {
  const current = status || 'all'
  function href(nextStatus: string) {
    const qs = new URLSearchParams()
    if (nextStatus !== 'all') qs.set('status', nextStatus)
    if (family) qs.set('family', family)
    const s = qs.toString()
    return `/portal/admin/billing/invoices${s ? `?${s}` : ''}`
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((s) => (
          <a
            key={s}
            href={href(s)}
            className={cn(
              'inline-flex min-h-[36px] items-center rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize',
              current === s
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]',
            )}
          >
            {s === 'all' ? 'All' : s}
          </a>
        ))}
      </div>
      <form
        action="/portal/admin/billing/invoices"
        method="GET"
        className="flex items-center gap-2"
      >
        {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
        <input
          type="text"
          name="family"
          defaultValue={family}
          placeholder="Search family…"
          className="h-9 min-h-[36px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="inline-flex h-9 min-h-[36px] items-center rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          Search
        </button>
      </form>
    </div>
  )
}
