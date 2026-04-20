// @anchor: cca.student.list-page
// Student list with search, enrollment status filters.
// Server Component — data fetched server-side, client-side filter via StudentListClient.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { StudentListClient } from '@/components/portal/students/student-list-client'
import type { AllergySeverity } from '@/components/portal/students/allergy-badge'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { status, q } = await searchParams
  const supabase = await createTenantAdminClient(tenantId)

  let query = supabase
    .from('students')
    .select('id, first_name, last_name, preferred_name, date_of_birth, enrollment_status, photo_path, created_at')
    .eq('tenant_id', tenantId)
    .order('last_name', { ascending: true })
    .limit(100)

  if (status && status !== 'all') {
    query = query.eq('enrollment_status', status)
  }

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
  }

  const { data: students } = await query

  // Fetch allergies for all students
  const studentIds = students?.map((s) => s.id) ?? []
  const { data: allergies } = studentIds.length > 0
    ? await supabase
        .from('student_allergies')
        .select('student_id, allergen, severity')
        .eq('tenant_id', tenantId)
        .in('student_id', studentIds)
    : { data: [] }

  // Group allergies by student — serialize to plain object for client component
  const allergyMap: Record<string, Array<{ allergen: string; severity: AllergySeverity }>> = {}
  for (const a of allergies ?? []) {
    const list = allergyMap[a.student_id] ?? []
    list.push({ allergen: a.allergen, severity: a.severity as AllergySeverity })
    allergyMap[a.student_id] = list
  }

  // Fetch classroom assignments
  const { data: assignments } = studentIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('student_id, classroom_id, classrooms(name)')
        .eq('tenant_id', tenantId)
        .in('student_id', studentIds)
        .is('assigned_to', null)
    : { data: [] }

  const classroomMap: Record<string, string> = {}
  for (const a of assignments ?? []) {
    const classroomName = (a as Record<string, unknown>).classrooms
      ? ((a as Record<string, unknown>).classrooms as { name: string }).name
      : null
    if (classroomName) classroomMap[a.student_id] = classroomName
  }

  const statusFilters = ['all', 'active', 'enrolled', 'applied', 'waitlisted', 'withdrawn', 'graduated']
  const currentStatus = status || 'all'

  // Serialize students for client component
  const serializedStudents = (students ?? []).map((s) => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    preferred_name: s.preferred_name,
    date_of_birth: s.date_of_birth,
    enrollment_status: s.enrollment_status,
    photo_path: s.photo_path,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Students</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {students?.length ?? 0} student{(students?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/admin/students/new">Add Student</Link>
        </Button>
      </div>

      {/* Status filter pills (server-side, triggers page reload) */}
      <div className="flex flex-wrap gap-1">
        {statusFilters.map((s) => (
          <a
            key={s}
            href={`/portal/admin/students?status=${s}${q ? `&q=${q}` : ''}`}
            className={`inline-flex min-h-[36px] items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              currentStatus === s
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      {/* Client-side filter + table */}
      <StudentListClient
        students={serializedStudents}
        allergyMap={allergyMap}
        classroomMap={classroomMap}
        serverQuery={q}
      />
    </div>
  )
}
