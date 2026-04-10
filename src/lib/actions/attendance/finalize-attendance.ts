'use server'

// @anchor: cca.attendance.finalize
// Finalize (lock) attendance for a classroom on a given date.
// Once finalized, records can only be changed via amendments.

import { assertRole } from '@/lib/auth/session'
import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { FinalizeAttendanceSchema } from '@/lib/schemas/attendance'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type FinalizeAttendanceState = {
  ok: boolean
  error?: string
  count?: number
}

export async function finalizeAttendance(
  _prev: FinalizeAttendanceState,
  formData: FormData,
): Promise<FinalizeAttendanceState> {
  try {
    await assertRole('lead_teacher')
    const raw = Object.fromEntries(formData.entries())
    const parsed = FinalizeAttendanceSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { classroom_id, date } = parsed.data
    const headerStore = await headers()
    void headerStore

    const supabase = await createTenantServerClient()

    // Finalize all unfinalised records for this classroom + date
    const { data: records, error } = await supabase
      .from('attendance_records')
      .update({
        finalized_at: new Date().toISOString(),
      })
      .eq('classroom_id', classroom_id)
      .eq('date', date)
      .is('finalized_at', null)
      .select('id')

    if (error) {
      return { ok: false, error: error.message }
    }

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    for (const rec of records ?? []) {
      await writeAudit(supabase, {
        tenantId,
        actorId,
        action: 'attendance.finalize',
        entityType: 'attendance_record',
        entityId: rec.id,
        after: { classroom_id, date, finalized_at: new Date().toISOString() },
      })
    }

    return { ok: true, count: records?.length ?? 0 }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
