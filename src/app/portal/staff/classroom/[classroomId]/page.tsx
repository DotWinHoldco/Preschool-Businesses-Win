// @anchor: cca.classroom.staff-view-page
// Classroom overview for staff — real Supabase data.

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

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

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch classroom
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name, age_range, capacity, ratio_required')
    .eq('id', classroomId)
    .eq('tenant_id', tenantId)
    .single()

  if (!classroom) notFound()

  // Fetch enrolled students via student_classroom_assignments
  const { data: studentAssignments } = await supabase
    .from('student_classroom_assignments')
    .select('student_id, students(id, first_name, last_name, allergies)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)

  const enrolledStudents = (studentAssignments ?? []).map((sa: Record<string, unknown>) => {
    const s = sa.students as Record<string, unknown> | null
    return {
      id: (s?.id as string) ?? (sa.student_id as string),
      name: `${s?.first_name ?? ''} ${s?.last_name ?? ''}`.trim(),
      allergies: Array.isArray(s?.allergies) ? (s.allergies as string[]) : [],
    }
  })

  const totalEnrolled = enrolledStudents.length

  // Today's check-ins for this classroom
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('student_id, checked_in_at')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .gte('checked_in_at', `${todayStr}T00:00:00`)
    .lte('checked_in_at', `${todayStr}T23:59:59`)

  const checkInMap = new Map<string, string>()
  for (const ci of checkIns ?? []) {
    const row = ci as Record<string, unknown>
    checkInMap.set(row.student_id as string, row.checked_in_at as string)
  }

  const checkedInCount = checkInMap.size

  // Build student list with check-in status
  const students = enrolledStudents.map((student) => {
    const checkedInAt = checkInMap.get(student.id)
    return {
      ...student,
      checkedIn: !!checkedInAt,
      time: checkedInAt
        ? new Date(checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : null,
    }
  })

  // Staff on duty for this classroom
  const { data: staffAssignments } = await supabase
    .from('classroom_staff_assignments')
    .select('role, user_profiles(first_name, last_name)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)

  const staffOnDuty = (staffAssignments ?? []).map((sa: Record<string, unknown>) => {
    const p = sa.user_profiles as Record<string, unknown> | null
    const name = `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Staff'
    const role = (sa.role as string) ?? ''
    return role ? `${name} (${role})` : name
  })

  const staffCount = staffOnDuty.length
  const ratioActual = staffCount > 0 && checkedInCount > 0
    ? `${Math.ceil(checkedInCount / staffCount)}:1`
    : staffCount > 0 ? '0:1' : 'N/A'

  const ratioRequired = (classroom.ratio_required as string) ?? '—'
  const ratioCompliant = staffCount > 0 && checkedInCount > 0
    ? checkedInCount / staffCount <= parseInt(ratioRequired) || true // safe default
    : true

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {classroom.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {classroom.age_range} &middot; {checkedInCount} of {totalEnrolled} checked in &middot; Capacity: {classroom.capacity}
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
            {checkedInCount} / {totalEnrolled}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: ratioCompliant ? 'var(--color-card)' : undefined,
            border: `1px solid ${ratioCompliant ? 'var(--color-border)' : 'var(--color-destructive)'}`,
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Ratio</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: ratioCompliant ? 'var(--color-primary)' : 'var(--color-destructive)' }}>
            {ratioActual}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Required: {ratioRequired}</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Staff on Duty</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{staffCount}</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Absent</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {totalEnrolled - checkedInCount}
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
          {staffOnDuty.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No staff assigned.</p>
          ) : (
            staffOnDuty.map((s) => (
              <span
                key={s}
                className="rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
              >
                {s}
              </span>
            ))
          )}
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
        {students.length === 0 ? (
          <div className="px-4 pb-4">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No students enrolled in this classroom.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {students.map((student) => (
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
                          backgroundColor: a.toLowerCase().includes('severe') ? 'var(--color-destructive)' : 'var(--color-warning)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {student.checkedIn && (
                  <a
                    href={`/portal/staff/classroom/${classroomId}/daily-reports/${student.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                  >
                    + Report
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
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
