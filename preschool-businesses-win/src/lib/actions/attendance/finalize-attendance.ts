'use server'

// @anchor: cca.attendance.finalize
// Finalize (lock) attendance for a classroom on a given date.
// Once finalized, records can only be changed via amendments.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { FinalizeAttendanceSchema } from '@/lib/schemas/attendance'

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

    return { ok: true, count: records?.length ?? 0 }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
