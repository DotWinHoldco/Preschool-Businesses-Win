'use server'

// @anchor: cca.attendance.record
// Record attendance status for a student on a given date.

import { assertRole } from '@/lib/auth/session'
import { createTenantServerClient } from '@/lib/supabase/server'
import { RecordAttendanceSchema } from '@/lib/schemas/attendance'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

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
    await assertRole('aide')
    const raw = Object.fromEntries(formData.entries())
    const parsed = RecordAttendanceSchema.safeParse({
      ...raw,
      hours_present: raw.hours_present ? Number(raw.hours_present) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
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

    const actorId = await getActorId()
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'attendance.record',
      entityType: 'attendance_record',
      entityId: record.id,
      after: { ...parsed.data },
    })

    return { ok: true, record_id: record.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
