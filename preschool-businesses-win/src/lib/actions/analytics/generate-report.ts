'use server'

// @anchor: cca.analytics.generate-report
// Generate custom analytics reports
// See CCA_BUILD_BRIEF.md §33

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

const GenerateReportSchema = z.object({
  name: z.string().min(1).max(200),
  entity_type: z.enum([
    'students',
    'families',
    'staff',
    'attendance',
    'billing',
    'enrollment',
    'classrooms',
  ]),
  columns: z.array(z.string().max(100)).min(1).max(50),
  filters: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
    .optional(),
  sort: z
    .object({
      column: z.string().max(100),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  date_range: z
    .object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  is_scheduled: z.boolean().default(false),
  schedule_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  schedule_recipients: z.array(z.string().email()).optional(),
})

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>

export async function generateReport(input: GenerateReportInput) {
  await assertRole('admin')

  const parsed = GenerateReportSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Save the report configuration
  const { data: report, error: reportError } = await supabase
    .from('saved_reports')
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      entity_type: parsed.data.entity_type,
      columns: parsed.data.columns,
      filters: parsed.data.filters ?? {},
      sort: parsed.data.sort ?? {},
      created_by: actorId,
      is_scheduled: parsed.data.is_scheduled,
      schedule_frequency: parsed.data.schedule_frequency ?? null,
      schedule_recipients: parsed.data.schedule_recipients ?? null,
      last_run_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (reportError || !report) {
    return { ok: false as const, error: { _form: [reportError?.message ?? 'Failed to create report'] } }
  }

  // Execute the report query based on entity_type
  // This is a simplified query builder; heavy reports should use Supabase Edge Functions
  const results = await executeReportQuery(
    supabase,
    tenantId,
    parsed.data.entity_type,
    parsed.data.columns,
    parsed.data.filters,
    parsed.data.sort,
    parsed.data.date_range,
  )

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'analytics.generate_report',
    entityType: 'saved_report',
    entityId: report.id as string,
    after: { name: parsed.data.name, entity_type: parsed.data.entity_type, row_count: results.length },
  })

  return {
    ok: true as const,
    reportId: report.id as string,
    data: results,
    rowCount: results.length,
  }
}

async function executeReportQuery(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  entityType: string,
  columns: string[],
  filters?: Record<string, unknown>,
  sort?: { column: string; direction: 'asc' | 'desc' },
  dateRange?: { start: string; end: string },
): Promise<Array<Record<string, unknown>>> {
  const columnSelect = columns.join(', ')

  let query = supabase
    .from(entityType)
    .select(columnSelect)
    .eq('tenant_id', tenantId)
    .limit(1000)

  // Apply filters
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string') {
        query = query.eq(key, value)
      } else if (typeof value === 'number') {
        query = query.eq(key, value)
      } else if (typeof value === 'boolean') {
        query = query.eq(key, value)
      }
    }
  }

  // Apply date range
  if (dateRange) {
    query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.column, { ascending: sort.direction === 'asc' })
  }

  const { data, error } = await query

  if (error) {
    console.error('[analytics] Report query error:', error.message)
    return []
  }

  return (data as unknown as Array<Record<string, unknown>>) ?? []
}
