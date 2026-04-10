// @anchor: cca.classroom.staff-view-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Classroom View | Staff Portal',
  description: 'Classroom attendance, daily reports, and student roster',
}

export default async function StaffClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params

  const mockClassroom = {
    id: classroomId,
    name: 'Butterfly Room',
    ageRange: '3-4 years',
    capacity: 20,
    checkedIn: 14,
    totalEnrolled: 18,
    ratioRequired: '15:1',
    ratioActual: '7:1',
    ratioCompliant: true,
    staffOnDuty: ['Sarah Johnson (Lead)', 'Maria Garcia (Aide)'],
  }

  const mockStudents = [
    { id: '1', name: 'Sophia Martinez', checkedIn: true, time: '7:15 AM', allergies: ['Peanuts (severe)'], mood: 'happy' },
    { id: '2', name: 'Liam Chen', checkedIn: true, time: '7:32 AM', allergies: [], mood: 'calm' },
    { id: '3', name: 'Emma Johnson', checkedIn: true, time: '7:45 AM', allergies: ['Dairy (mild)'], mood: 'happy' },
    { id: '4', name: 'Noah Williams', checkedIn: true, time: '8:00 AM', allergies: [], mood: 'tired' },
    { id: '5', name: 'Olivia Brown', checkedIn: false, time: null, allergies: ['Eggs (moderate)'], mood: null },
    { id: '6', name: 'Aiden Davis', checkedIn: true, time: '7:50 AM', allergies: [], mood: 'happy' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {mockClassroom.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {mockClassroom.ageRange} &middot; {mockClassroom.checkedIn} of {mockClassroom.totalEnrolled} checked in &middot; Capacity: {mockClassroom.capacity}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/portal/staff/classroom/${classroomId}/attendance`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Take Attendance
          </a>
          <a
            href={`/portal/staff/classroom/${classroomId}/daily-reports`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}
          >
            Daily Reports
          </a>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Checked In</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {mockClassroom.checkedIn} / {mockClassroom.totalEnrolled}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: mockClassroom.ratioCompliant ? 'var(--color-card)' : undefined,
            border: `1px solid ${mockClassroom.ratioCompliant ? 'var(--color-border)' : 'var(--color-destructive)'}`,
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Ratio</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: mockClassroom.ratioCompliant ? 'var(--color-primary)' : 'var(--color-destructive)' }}>
            {mockClassroom.ratioActual}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Required: {mockClassroom.ratioRequired}</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Staff on Duty</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>2</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Absent</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {mockClassroom.totalEnrolled - mockClassroom.checkedIn}
          </p>
        </div>
      </div>

      {/* Staff on duty */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Staff on Duty</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {mockClassroom.staffOnDuty.map((s) => (
            <span
              key={s}
              className="rounded-full px-3 py-1 text-sm"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Who is here board */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Who&apos;s Here
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {mockStudents.map((student) => (
            <div key={student.id} className="flex items-center gap-4 px-4 py-3" style={{ opacity: student.checkedIn ? 1 : 0.5 }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: student.checkedIn ? 'var(--color-primary)' : 'var(--color-muted)',
                  color: student.checkedIn ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                }}
              >
                {student.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{student.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {student.checkedIn ? `Checked in at ${student.time}` : 'Not checked in'}
                </p>
              </div>
              {student.allergies.length > 0 && (
                <div className="flex gap-1">
                  {student.allergies.map((a) => (
                    <span
                      key={a}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: a.includes('severe') ? 'var(--color-destructive)' : 'var(--color-warning)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {student.checkedIn && (
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                >
                  + Report
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          + Meal (All)
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}
        >
          + Nap (All)
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          + Activity
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          + Photo
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
        >
          Publish Reports
        </button>
      </div>
    </div>
  )
}
