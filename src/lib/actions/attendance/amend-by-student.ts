'use server'

// @anchor: cca.attendance.amend-by-student
// Upsert an attendance record for a student on a specific date, write audit log.
// Used by the admin attendance dashboard "Amend Attendance" flow.

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { attendanceStatusEnum } from '@/lib/schemas/attendance'

export const AmendByStudentSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string().min(1), // YYYY-MM-DD
  status: attendanceStatusEnum,
  reason: z.string().min(1).max(2000),
  notes: z.string().max(2000).optional(),
})

export type AmendByStudentInput = z.infer<typeof AmendByStudentSchema>

export type AmendByStudentState = {
  ok: boolean
  error?: string
  id?: string
}

export async function amendAttendance(input: AmendByStudentInput): Promise<AmendByStudentState> {
  await assertRole('admin')

  const parsed = AmendByStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { student_id, date, status, reason, notes } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Look up existing record (student + date + tenant)
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('student_id', student_id)
    .eq('date', date)
    .maybeSingle()

  // Get student classroom_id for inserts (required for new rows)
  let classroomId: string | null = null
  if (!existing) {
    const { data: student } = await supabase
      .from('students')
      .select('primary_classroom_id, classroom_id')
      .eq('id', student_id)
      .maybeSingle()
    // Fall back through candidate columns
    classroomId =
      (student?.primary_classroom_id as string | null) ??
      (student?.classroom_id as string | null) ??
      null
  }

  const before = existing
    ? {
        status: existing.status,
        notes: existing.notes,
      }
    : null

  const after = {
    status,
    notes: notes ?? existing?.notes ?? `Amended: ${reason}`,
  }

  let recordId: string
  if (existing) {
    const { data: updated, error } = await supabase
      .from('attendance_records')
      .update({ ...after })
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error || !updated) {
      return { ok: false, error: error?.message ?? 'Failed to update attendance record' }
    }
    recordId = updated.id
  } else {
    const { data: inserted, error } = await supabase
      .from('attendance_records')
      .insert({
        tenant_id: tenantId,
        student_id,
        classroom_id: classroomId,
        date,
        status,
        notes: notes ?? `Amended: ${reason}`,
        recorded_by: actorId,
      })
      .select('id')
      .single()
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? 'Failed to create attendance record' }
    }
    recordId = inserted.id
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'attendance.amended',
    entityType: 'attendance_record',
    entityId: recordId,
    before: before ?? undefined,
    after: { ...after, reason },
  })

  revalidatePath('/portal/admin/attendance')

  return { ok: true, id: recordId }
}
