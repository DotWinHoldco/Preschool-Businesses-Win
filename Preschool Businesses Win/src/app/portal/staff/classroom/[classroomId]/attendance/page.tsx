// @anchor: cca.attendance.classroom-staff-page

import type { Metadata } from 'next'

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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const mockStudents = [
    { id: '1', name: 'Sophia Martinez', status: 'present' as const, checkInTime: '7:15 AM', checkInBy: 'Mom (QR)' },
    { id: '2', name: 'Liam Chen', status: 'present' as const, checkInTime: '7:32 AM', checkInBy: 'Dad (PIN)' },
    { id: '3', name: 'Emma Johnson', status: 'present' as const, checkInTime: '7:45 AM', checkInBy: 'Mom (QR)' },
    { id: '4', name: 'Noah Williams', status: 'late' as const, checkInTime: '8:45 AM', checkInBy: 'Grandmother (Staff)' },
    { id: '5', name: 'Olivia Brown', status: 'absent' as const, checkInTime: null, checkInBy: null },
    { id: '6', name: 'Aiden Davis', status: 'present' as const, checkInTime: '7:50 AM', checkInBy: 'Dad (QR)' },
    { id: '7', name: 'Isabella Wilson', status: 'excused_absent' as const, checkInTime: null, checkInBy: null },
    { id: '8', name: 'Mason Taylor', status: 'present' as const, checkInTime: '8:10 AM', checkInBy: 'Mom (QR)' },
  ]

  const statusColors: Record<string, string> = {
    present: 'var(--color-primary)',
    late: 'var(--color-warning)',
    absent: 'var(--color-destructive)',
    excused_absent: 'var(--color-muted-foreground)',
  }

  const statusLabels: Record<string, string> = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    excused_absent: 'Excused',
  }

  const summary = {
    present: mockStudents.filter((s) => s.status === 'present').length,
    late: mockStudents.filter((s) => s.status === 'late').length,
    absent: mockStudents.filter((s) => s.status === 'absent').length,
    excused: mockStudents.filter((s) => s.status === 'excused_absent').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Classroom Attendance
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {today} &middot; Classroom ID: {classroomId}
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
              {mockStudents.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{student.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: statusColors[student.status], color: 'var(--color-primary-foreground)' }}
                    >
                      {statusLabels[student.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                    {student.checkInTime || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                    {student.checkInBy || '—'}
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

      {/* Note */}
      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        Attendance records are append-only once finalized. Corrections after finalization create amendment rows.
      </p>
    </div>
  )
}
