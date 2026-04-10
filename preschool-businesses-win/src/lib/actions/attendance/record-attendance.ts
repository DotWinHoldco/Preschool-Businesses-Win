'use server'

// @anchor: cca.attendance.record
// Record attendance status for a student on a given date.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { RecordAttendanceSchema } from '@/lib/schemas/attendance'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export type RecordAttendanceState = {
  ok: boolean
  error?: string
  record_id?: string
}

export async function recordAttendance(
  _prev: RecordAttendanceState,
  formData: FormData,
): Promise<RecordAttendanceState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = RecordAttendanceSchema.safeParse({
      ...raw,
      hours_present: raw.hours_present ? Number(raw.hours_present) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
    const supabase = await createTenantServerClient()

    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert({
        tenant_id: tenantId,
        ...parsed.data,
      })
      .select('id')
      .single()

    if (error || !record) {
      return { ok: false, error: error?.message ?? 'Failed to record attendance' }
    }

    return { ok: true, record_id: record.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
