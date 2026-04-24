'use server'

// @anchor: cca.attendance.export-csv
// Export attendance records for a date (optionally filtered by classroom) as CSV.

import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

const ExportAttendanceCsvSchema = z.object({
  date: z.string().min(1),
  classroom_id: z.string().uuid().optional(),
})

export type ExportAttendanceCsvInput = z.infer<typeof ExportAttendanceCsvSchema>

export type ExportAttendanceCsvState = {
  ok: boolean
  error?: string
  csv?: string
  filename?: string
  row_count?: number
}

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function exportAttendanceCsv(
  input: ExportAttendanceCsvInput,
): Promise<ExportAttendanceCsvState> {
  await assertRole('admin')

  const parsed = ExportAttendanceCsvSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { date, classroom_id } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  let query = supabase
    .from('attendance_records')
    .select(
      'id, student_id, classroom_id, date, status, check_in_time, check_out_time, notes, students(first_name, last_name), classrooms(name)',
    )
    .eq('tenant_id', tenantId)
    .eq('date', date)

  if (classroom_id) {
    query = query.eq('classroom_id', classroom_id)
  }

  const { data: rows, error } = await query
  if (error) {
    return { ok: false, error: error.message }
  }

  const header = ['Date', 'Student', 'Classroom', 'Status', 'Check-in', 'Check-out', 'Notes'].join(
    ',',
  )

  const lines = (rows ?? []).map((r) => {
    const student = (r.students as { first_name?: string; last_name?: string } | null) ?? null
    const classroom = (r.classrooms as { name?: string } | null) ?? null
    const studentName = student
      ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
      : ''
    return [
      csvEscape(r.date),
      csvEscape(studentName),
      csvEscape(classroom?.name ?? ''),
      csvEscape(r.status),
      csvEscape(r.check_in_time ?? ''),
      csvEscape(r.check_out_time ?? ''),
      csvEscape(r.notes ?? ''),
    ].join(',')
  })

  const csv = [header, ...lines].join('\n')
  const filename = `attendance-${date}${classroom_id ? `-${classroom_id.slice(0, 8)}` : ''}.csv`

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'attendance.exported',
    entityType: 'attendance_export',
    entityId: date,
    after: { date, classroom_id: classroom_id ?? null, row_count: rows?.length ?? 0 },
  })

  return { ok: true, csv, filename, row_count: rows?.length ?? 0 }
}
