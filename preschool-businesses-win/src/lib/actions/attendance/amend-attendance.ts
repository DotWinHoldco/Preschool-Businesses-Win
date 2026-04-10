'use server'

// @anchor: cca.attendance.amend
// Create an amendment to a finalized attendance record.
// Amendments are append-only — original records are never overwritten.

import { createTenantServerClient } from '@/lib/supabase/server'
import { AmendAttendanceSchema } from '@/lib/schemas/attendance'
import { getTenantId } from '@/lib/actions/get-tenant-id'

export type AmendAttendanceState = {
  ok: boolean
  error?: string
  amendment_id?: string
}

export async function amendAttendance(
  _prev: AmendAttendanceState,
  formData: FormData,
): Promise<AmendAttendanceState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = AmendAttendanceSchema.safeParse({
      ...raw,
      new_hours_present: raw.new_hours_present ? Number(raw.new_hours_present) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { attendance_record_id, reason, new_status, new_hours_present, new_notes } = parsed.data
    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    // Fetch the current record to store as "before" snapshot
    const { data: record, error: fetchErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', attendance_record_id)
      .single()

    if (fetchErr || !record) {
      return { ok: false, error: 'Attendance record not found' }
    }

    // Build "after" snapshot
    const after = {
      ...(new_status !== undefined && { status: new_status }),
      ...(new_hours_present !== undefined && { hours_present: new_hours_present }),
      ...(new_notes !== undefined && { notes: new_notes }),
    }

    // Insert amendment row
    const { data: amendment, error } = await supabase
      .from('attendance_amendments')
      .insert({
        tenant_id: tenantId,
        attendance_record_id,
        reason,
        before: {
          status: record.status,
          hours_present: record.hours_present,
          notes: record.notes,
        },
        after,
        amended_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !amendment) {
      return { ok: false, error: error?.message ?? 'Failed to create amendment' }
    }

    // Update the original record with new values
    if (Object.keys(after).length > 0) {
      await supabase
        .from('attendance_records')
        .update(after)
        .eq('id', attendance_record_id)
    }

    return { ok: true, amendment_id: amendment.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
