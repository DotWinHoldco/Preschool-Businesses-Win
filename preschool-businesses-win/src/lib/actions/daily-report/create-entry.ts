'use server'

// @anchor: cca.daily-report.create-entry
// Add an entry to a student's daily report.
// Creates the daily_report row if it does not exist, then inserts an entry.

import { assertRole } from '@/lib/auth/session'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import {
  CreateDailyReportEntrySchema,
  MealDataSchema,
  NapDataSchema,
  DiaperDataSchema,
  ActivityDataSchema,
  MoodDataSchema,
  MilestoneDataSchema,
  NoteDataSchema,
  PhotoDataSchema,
  type DailyReportEntryType,
} from '@/lib/schemas/daily-report'
import { z } from 'zod'

// Map entry_type to its data schema for fine-grained validation
const dataSchemas: Record<DailyReportEntryType, z.ZodSchema> = {
  meal: MealDataSchema,
  nap: NapDataSchema,
  diaper: DiaperDataSchema,
  activity: ActivityDataSchema,
  mood: MoodDataSchema,
  milestone: MilestoneDataSchema,
  note: NoteDataSchema,
  photo: PhotoDataSchema,
}

export type CreateEntryState = {
  ok: boolean
  error?: string
  entry_id?: string
}

export async function createDailyReportEntry(
  _prev: CreateEntryState,
  formData: FormData,
): Promise<CreateEntryState> {
  try {
    await assertRole('aide')
    const raw = Object.fromEntries(formData.entries())

    // Parse top-level fields
    const parsed = CreateDailyReportEntrySchema.safeParse({
      ...raw,
      data: raw.data ? JSON.parse(raw.data as string) : {},
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { report_id, student_id, classroom_id, entry_type, timestamp, data } = parsed.data

    // Validate entry-specific data
    const dataSchema = dataSchemas[entry_type]
    const dataParsed = dataSchema.safeParse(data)
    if (!dataParsed.success) {
      return { ok: false, error: dataParsed.error.issues[0]?.message ?? 'Invalid entry data' }
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    // Ensure daily_report exists for this student + date
    let reportId = report_id
    if (!reportId || reportId === 'auto') {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('student_id', student_id)
        .eq('classroom_id', classroom_id)
        .eq('date', today)
        .single()

      if (existing) {
        reportId = existing.id
      } else {
        const { data: created, error: createErr } = await supabase
          .from('daily_reports')
          .insert({
            tenant_id: tenantId,
            student_id,
            classroom_id,
            date: today,
            status: 'draft',
          })
          .select('id')
          .single()

        if (createErr || !created) {
          return { ok: false, error: 'Failed to create daily report' }
        }
        reportId = created.id
      }
    }

    // Insert entry
    const { data: entry, error } = await supabase
      .from('daily_report_entries')
      .insert({
        tenant_id: tenantId,
        report_id: reportId,
        entry_type,
        timestamp: timestamp ?? new Date().toISOString(),
        data: dataParsed.data,
        entered_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !entry) {
      return { ok: false, error: error?.message ?? 'Failed to create entry' }
    }

    return { ok: true, entry_id: entry.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
