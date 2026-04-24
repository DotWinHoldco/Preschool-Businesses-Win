'use server'

// @anchor: cca.analytics.report-builder
// Runtime custom report runner + saved-report CRUD.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

type Source =
  | 'students'
  | 'families'
  | 'staff_profiles'
  | 'attendance_records'
  | 'invoices'
  | 'enrollment_applications'
  | 'classrooms'
  | 'dfps_standards'

const SOURCE_ALIAS: Record<string, Source> = {
  students: 'students',
  families: 'families',
  staff: 'staff_profiles',
  attendance: 'attendance_records',
  billing: 'invoices',
  enrollment: 'enrollment_applications',
  classrooms: 'classrooms',
  compliance: 'dfps_standards',
}

const DATE_COLUMN: Record<Source, string> = {
  students: 'created_at',
  families: 'created_at',
  staff_profiles: 'created_at',
  attendance_records: 'date',
  invoices: 'created_at',
  enrollment_applications: 'created_at',
  classrooms: 'created_at',
  dfps_standards: 'updated_at',
}

const ReportConfigSchema = z.object({
  name: z.string().max(200).optional(),
  data_source: z.string().min(1),
  date_range: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  group_by: z.string().max(100).optional().nullable(),
  format: z.enum(['table', 'csv']).default('table'),
  filters: z.record(z.string(), z.unknown()).optional(),
})

export type ReportConfig = z.input<typeof ReportConfigSchema>

export type RunReportResult = {
  ok: boolean
  rows?: Array<Record<string, unknown>>
  csv?: string
  filename?: string
  error?: string
}

function sinceDateFor(range: ReportConfig['date_range']): Date | null {
  const d = new Date()
  switch (range) {
    case 'week':
      d.setDate(d.getDate() - 7)
      return d
    case 'month':
      d.setMonth(d.getMonth() - 1)
      return d
    case 'quarter':
      d.setMonth(d.getMonth() - 3)
      return d
    case 'year':
      d.setFullYear(d.getFullYear() - 1)
      return d
    default:
      return null
  }
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function runReport(input: ReportConfig): Promise<RunReportResult> {
  await assertRole('admin')
  const parsed = ReportConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid report config' }
  }

  const sourceKey = parsed.data.data_source.toLowerCase()
  const source = SOURCE_ALIAS[sourceKey]
  if (!source) {
    return { ok: false, error: `Unknown data source: ${parsed.data.data_source}` }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  let q = supabase.from(source).select('*').eq('tenant_id', tenantId).limit(1000)
  const since = sinceDateFor(parsed.data.date_range ?? 'month')
  if (since) {
    const col = DATE_COLUMN[source]
    const val = col === 'date' ? since.toISOString().slice(0, 10) : since.toISOString()
    q = q.gte(col, val)
  }

  if (parsed.data.filters) {
    for (const [k, v] of Object.entries(parsed.data.filters)) {
      if (v === null || v === '' || v === undefined) continue
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        q = q.eq(k, v)
      }
    }
  }

  const { data, error } = await q
  if (error) return { ok: false, error: error.message }

  let rows = (data ?? []) as Array<Record<string, unknown>>

  // Optional grouping — reduce to counts per group key.
  if (parsed.data.group_by && rows.length > 0) {
    const key = parsed.data.group_by
    const counts = new Map<string, number>()
    for (const r of rows) {
      const groupVal = String(r[key] ?? 'null')
      counts.set(groupVal, (counts.get(groupVal) ?? 0) + 1)
    }
    rows = Array.from(counts.entries()).map(([k, n]) => ({ [key]: k, count: n }))
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.report.run',
    entityType: 'report',
    entityId: source,
    after: { rows: rows.length, data_source: source },
  })

  if (parsed.data.format === 'csv') {
    const header = Object.keys(rows[0] ?? {})
    const lines = [header.map(esc).join(',')]
    for (const r of rows) {
      lines.push(header.map((h) => esc(r[h])).join(','))
    }
    return {
      ok: true,
      rows,
      csv: lines.join('\n'),
      filename: `${source}-${parsed.data.date_range}.csv`,
    }
  }

  return { ok: true, rows }
}

const SaveReportSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  data_source: z.string().min(1),
  date_range: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  group_by: z.string().max(100).optional().nullable(),
  format: z.enum(['table', 'csv']).default('table'),
  filters: z.record(z.string(), z.unknown()).optional(),
})

export type SaveReportInput = z.infer<typeof SaveReportSchema>

export async function saveReport(
  input: SaveReportInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await assertRole('admin')
  const parsed = SaveReportSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const payload = {
    tenant_id: tenantId,
    name: parsed.data.name,
    entity_type: parsed.data.data_source,
    columns: [],
    filters: {
      ...(parsed.data.filters ?? {}),
      date_range: parsed.data.date_range,
      group_by: parsed.data.group_by,
      format: parsed.data.format,
    },
    sort: {},
    created_by: actorId,
    is_scheduled: false,
  }

  const { data, error } = await supabase.from('saved_reports').insert(payload).select('id').single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to save' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.report.save',
    entityType: 'saved_report',
    entityId: data.id as string,
    after: { name: parsed.data.name, data_source: parsed.data.data_source },
  })

  revalidatePath('/portal/admin/analytics/reports')
  return { ok: true, id: data.id as string }
}

export async function updateReport(
  id: string,
  input: SaveReportInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await assertRole('admin')
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) return { ok: false, error: 'Invalid id' }
  const parsed = SaveReportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('saved_reports')
    .update({
      name: parsed.data.name,
      entity_type: parsed.data.data_source,
      filters: {
        ...(parsed.data.filters ?? {}),
        date_range: parsed.data.date_range,
        group_by: parsed.data.group_by,
        format: parsed.data.format,
      },
    })
    .eq('id', parsedId.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.report.update',
    entityType: 'saved_report',
    entityId: parsedId.data,
    after: { name: parsed.data.name },
  })

  revalidatePath('/portal/admin/analytics/reports')
  return { ok: true, id: parsedId.data }
}

export async function deleteReport(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertRole('admin')
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('id', parsed.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.report.delete',
    entityType: 'saved_report',
    entityId: parsed.data,
  })

  revalidatePath('/portal/admin/analytics/reports')
  return { ok: true }
}

export async function scheduleReport(
  id: string,
  cron: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertRole('admin')
  const parsed = z
    .object({ id: z.string().uuid(), cron: z.string().min(1).max(200) })
    .safeParse({ id, cron })
  if (!parsed.success) return { ok: false, error: 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Try a "schedule_cron" column first; fall back to stashing in filters.
  let ok = false
  {
    const { error } = await supabase
      .from('saved_reports')
      .update({ is_scheduled: true, schedule_cron: parsed.data.cron })
      .eq('id', parsed.data.id)
      .eq('tenant_id', tenantId)
    if (!error) ok = true
  }
  if (!ok) {
    const { data: existing } = await supabase
      .from('saved_reports')
      .select('filters')
      .eq('id', parsed.data.id)
      .single()
    const filters = (existing?.filters as Record<string, unknown>) ?? {}
    const { error } = await supabase
      .from('saved_reports')
      .update({ is_scheduled: true, filters: { ...filters, schedule_cron: parsed.data.cron } })
      .eq('id', parsed.data.id)
      .eq('tenant_id', tenantId)
    if (error) return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.report.schedule',
    entityType: 'saved_report',
    entityId: parsed.data.id,
    after: { cron: parsed.data.cron },
  })

  revalidatePath('/portal/admin/analytics/reports')
  return { ok: true }
}
