'use server'

// @anchor: cca.audit.export
// CSV export for audit_log with the same filter set as the page.

import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'

export type AuditExportInput = {
  action?: string
  user?: string
  from?: string
  to?: string
  entity?: string
}

export type CsvResult = { ok: boolean; csv?: string; filename?: string; error?: string }

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function exportAuditCSV(input: AuditExportInput): Promise<CsvResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  let q = supabase
    .from('audit_log')
    .select('created_at, actor_id, action, entity_type, entity_id, before_data, after_data')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (input.action) q = q.eq('action', input.action)
  if (input.user) q = q.eq('actor_id', input.user)
  if (input.entity) q = q.ilike('entity_type', `%${input.entity}%`)
  if (input.from) q = q.gte('created_at', input.from)
  if (input.to) q = q.lte('created_at', input.to)

  const { data, error } = await q
  if (error) return { ok: false, error: error.message }

  const header = ['timestamp', 'actor_id', 'action', 'entity_type', 'entity_id', 'details']
  const lines = [header.map(esc).join(',')]
  for (const r of data ?? []) {
    lines.push(
      [
        r.created_at,
        r.actor_id ?? '',
        r.action ?? '',
        r.entity_type ?? '',
        r.entity_id ?? '',
        r.after_data ?? r.before_data ?? '',
      ]
        .map(esc)
        .join(','),
    )
  }

  return { ok: true, csv: lines.join('\n'), filename: `audit-log.csv` }
}
