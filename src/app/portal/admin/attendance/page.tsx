// @anchor: cca.attendance.admin-dashboard
// School-wide attendance dashboard — server component loads data, client component
// provides filters, per-classroom breakdown, amend flow, and CSV export.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { AttendanceDashboardClient } from '@/components/portal/attendance/attendance-dashboard-client'

type PageSearchParams = Promise<{ date?: string; classroom_id?: string }>

export default async function AttendanceDashboardPage({
  searchParams,
}: {
  searchParams?: PageSearchParams
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const resolvedSearch = (await searchParams) ?? {}
  const today = new Date().toISOString().split('T')[0]
  const date = resolvedSearch.date || today
  const classroomIdFilter = resolvedSearch.classroom_id || null

  const supabase = await createTenantAdminClient(tenantId)

  const [
    { data: attendanceRows },
    { count: totalEnrolled },
    { data: classrooms },
    { data: students },
  ] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('id, status, student_id, classroom_id')
      .eq('tenant_id', tenantId)
      .eq('date', date),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('enrollment_status', 'active'),
    supabase.from('classrooms').select('id, name').eq('tenant_id', tenantId).order('name'),
    supabase
      .from('students')
      .select('id, first_name, last_name, primary_classroom_id, classroom_id, enrollment_status')
      .eq('tenant_id', tenantId)
      .eq('enrollment_status', 'active')
      .order('last_name'),
  ])

  const studentRows = (students ?? []).map((s) => ({
    id: s.id as string,
    first_name: (s.first_name as string) ?? '',
    last_name: (s.last_name as string) ?? '',
    classroom_id:
      (s.primary_classroom_id as string | null) ?? (s.classroom_id as string | null) ?? null,
  }))

  const classroomEnrollment: Record<string, number> = {}
  for (const s of studentRows) {
    if (s.classroom_id) {
      classroomEnrollment[s.classroom_id] = (classroomEnrollment[s.classroom_id] ?? 0) + 1
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Attendance</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <AttendanceDashboardClient
        initialDate={date}
        initialClassroomId={classroomIdFilter}
        enrolled={totalEnrolled ?? 0}
        records={(attendanceRows ?? []).map((r) => ({
          id: r.id as string,
          student_id: r.student_id as string,
          classroom_id: (r.classroom_id as string | null) ?? null,
          status: r.status as string,
        }))}
        classrooms={(classrooms ?? []).map((c) => ({
          id: c.id as string,
          name: c.name as string,
        }))}
        students={studentRows}
        classroomEnrollment={classroomEnrollment}
      />
    </div>
  )
}
