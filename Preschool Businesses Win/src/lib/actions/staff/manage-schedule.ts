'use server'

// @anchor: cca.staff.schedule
// Set weekly schedule for staff members.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { ManageScheduleSchema } from '@/lib/schemas/staff'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export type ScheduleState = {
  ok: boolean
  error?: string
  count?: number
}

export async function setWeeklySchedule(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const entries = raw.entries ? JSON.parse(raw.entries as string) : []

    const parsed = ManageScheduleSchema.safeParse({
      user_id: raw.user_id,
      entries,
      effective_from: raw.effective_from,
      effective_to: raw.effective_to || undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
    const supabase = await createTenantServerClient()

    // Deactivate existing schedule entries for this user from the effective date
    await supabase
      .from('staff_schedules')
      .update({ effective_to: parsed.data.effective_from })
      .eq('user_id', parsed.data.user_id)
      .is('effective_to', null)

    // Insert new schedule entries
    const rows = parsed.data.entries.map((entry) => ({
      tenant_id: tenantId,
      user_id: parsed.data.user_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      classroom_id: entry.classroom_id,
      effective_from: parsed.data.effective_from,
      effective_to: parsed.data.effective_to ?? null,
    }))

    const { error } = await supabase
      .from('staff_schedules')
      .insert(rows)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, count: rows.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
