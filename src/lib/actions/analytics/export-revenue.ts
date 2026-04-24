'use server'

// @anchor: cca.analytics.export-revenue
// Export last 12 months of invoices + payments as CSV (monthly breakdown).

import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type CsvResult = { ok: boolean; csv?: string; filename?: string; error?: string }

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function monthKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function exportRevenueCSV(): Promise<CsvResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - 12)
  const sinceIso = since.toISOString()

  const [{ data: invoices }, { data: payments }] = await Promise.all([
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

  const buckets = new Map<
    string,
    { invoiced: number; paid: number; outstanding: number; refund: number }
  >()

  for (const inv of invoices ?? []) {
    const key = monthKey(inv.created_at)
    const b = buckets.get(key) ?? { invoiced: 0, paid: 0, outstanding: 0, refund: 0 }
    b.invoiced += Number(inv.amount_cents ?? 0)
    if (inv.status !== 'paid') {
      b.outstanding += Number(inv.amount_cents ?? 0)
    }
    buckets.set(key, b)
  }
  for (const p of payments ?? []) {
    const key = monthKey(p.created_at)
    const b = buckets.get(key) ?? { invoiced: 0, paid: 0, outstanding: 0, refund: 0 }
    if (p.status === 'succeeded' || p.status === 'paid') {
      b.paid += Number(p.amount_cents ?? 0)
    }
    if (p.refunded_at) {
      b.refund += Number(p.refund_amount_cents ?? 0)
    }
    buckets.set(key, b)
  }

  const months = Array.from(buckets.keys()).sort().reverse()
  const header = ['month', 'invoiced_cents', 'paid_cents', 'outstanding_cents', 'refund_cents']
  const lines = [header.map(esc).join(',')]
  for (const m of months) {
    const b = buckets.get(m)!
    lines.push([m, b.invoiced, b.paid, b.outstanding, b.refund].map(esc).join(','))
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.revenue.export_csv',
    entityType: 'analytics',
    entityId: 'revenue',
    after: { months: months.length },
  })

  return { ok: true, csv: lines.join('\n'), filename: `revenue-12mo.csv` }
}
