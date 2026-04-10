// @anchor: cca.student.list-page
// Student list with search, enrollment status filters.
// Server Component — data fetched server-side.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { AllergyBadge } from '@/components/portal/students/allergy-badge'
import type { AllergySeverity } from '@/components/portal/students/allergy-badge'

const statusVariant: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'outline'> = {
  active: 'success',
  enrolled: 'default',
  applied: 'outline',
  waitlisted: 'warning',
  withdrawn: 'danger',
  graduated: 'outline',
}

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

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

  // Group allergies by student
  const allergyMap = new Map<string, Array<{ allergen: string; severity: AllergySeverity }>>()
  for (const a of allergies ?? []) {
    const list = allergyMap.get(a.student_id) ?? []
    list.push({ allergen: a.allergen, severity: a.severity as AllergySeverity })
    allergyMap.set(a.student_id, list)
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

  const classroomMap = new Map<string, string>()
  for (const a of assignments ?? []) {
    const classroomName = (a as Record<string, unknown>).classrooms
      ? ((a as Record<string, unknown>).classrooms as { name: string }).name
      : null
    if (classroomName) classroomMap.set(a.student_id, classroomName)
  }

  const statusFilters = ['all', 'active', 'enrolled', 'applied', 'waitlisted', 'withdrawn', 'graduated']
  const currentStatus = status || 'all'

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

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" method="get">
          <input type="hidden" name="status" value={currentStatus} />
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search students..."
              className="h-10 w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
            />
          </div>
        </form>

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
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead>Allergies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!students || students.length === 0) ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--color-muted-foreground)]">
                {q ? `No students matching "${q}"` : 'No students found'}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => {
              const studentAllergies = allergyMap.get(student.id) ?? []
              const classroomName = classroomMap.get(student.id)
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/portal/admin/students/${student.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      {student.photo_path ? (
                        <img
                          src={student.photo_path}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-muted-foreground)]">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                      )}
                      <span className="font-medium text-[var(--color-foreground)]">
                        {student.preferred_name || student.first_name} {student.last_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                    {calculateAge(student.date_of_birth)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[student.enrollment_status] || 'outline'} size="sm">
                      {student.enrollment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                    {classroomName || '—'}
                  </TableCell>
                  <TableCell>
                    {studentAllergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {studentAllergies.map((a) => (
                          <AllergyBadge key={a.allergen} allergen={a.allergen} severity={a.severity} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">None</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
