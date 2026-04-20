// @anchor: cca.attendance.classroom-staff-page
// Classroom attendance page — real Supabase data.

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Classroom Attendance | Staff Portal',
  description: 'Record and manage daily attendance for your classroom',
}

export default async function StaffClassroomAttendancePage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Fetch classroom name
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('name')
    .eq('id', classroomId)
    .eq('tenant_id', tenantId)
    .single()

  if (!classroom) notFound()

  // Active students in this classroom
  const { data: studentAssignments } = await supabase
    .from('student_classroom_assignments')
    .select('student_id, students(id, first_name, last_name)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)

  const enrolledStudents = (studentAssignments ?? []).map((sa: Record<string, unknown>) => {
    const s = sa.students as Record<string, unknown> | null
    return {
      id: (s?.id as string) ?? (sa.student_id as string),
      name: `${s?.first_name ?? ''} ${s?.last_name ?? ''}`.trim(),
    }
  })

  // Today's attendance records
  const { data: attendanceRows } = await supabase
    .from('attendance_records')
    .select('student_id, status, check_in_time, check_in_by')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .eq('date', todayStr)

  const attendanceMap = new Map<string, Record<string, unknown>>()
  for (const row of attendanceRows ?? []) {
    const r = row as Record<string, unknown>
    attendanceMap.set(r.student_id as string, r)
  }

  // Merge students with attendance
  const students = enrolledStudents.map((student) => {
    const record = attendanceMap.get(student.id)
    const status = (record?.status as string) ?? 'not_yet'
    const checkInTime = record?.check_in_time as string | null
    const checkInBy = record?.check_in_by as string | null

    return {
      id: student.id,
      name: student.name,
      status,
      checkInTime: checkInTime
        ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : null,
      checkInBy,
    }
  })

  const statusColors: Record<string, string> = {
    present: 'var(--color-primary)',
    late: 'var(--color-warning)',
    absent: 'var(--color-destructive)',
    excused_absent: 'var(--color-muted-foreground)',
    not_yet: 'var(--color-muted)',
  }

  const statusLabels: Record<string, string> = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    excused_absent: 'Excused',
    not_yet: 'Not Yet',
  }

  const summary = {
    present: students.filter((s) => s.status === 'present').length,
    late: students.filter((s) => s.status === 'late').length,
    absent: students.filter((s) => s.status === 'absent').length,
    excused: students.filter((s) => s.status === 'excused_absent').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Classroom Attendance
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {todayLabel} &middot; {classroom.name}
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Finalize Attendance
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Present', value: summary.present, color: 'var(--color-primary)' },
          { label: 'Late', value: summary.late, color: 'var(--color-warning)' },
          { label: 'Absent', value: summary.absent, color: 'var(--color-destructive)' },
          { label: 'Excused', value: summary.excused, color: 'var(--color-muted-foreground)' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance list */}
      {students.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No students in this classroom.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Status', 'Check-in Time', 'Checked in By', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{student.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: statusColors[student.status] ?? 'var(--color-muted)', color: 'var(--color-primary-foreground)' }}
                      >
                        {statusLabels[student.status] ?? 'Not Yet'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {student.checkInTime || '\u2014'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {student.checkInBy || '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {student.status === 'absent' && (
                          <button className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                            Mark Excused
                          </button>
                        )}
                        <button className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        Attendance records are append-only once finalized. Corrections after finalization create amendment rows.
      </p>
    </div>
  )
}
