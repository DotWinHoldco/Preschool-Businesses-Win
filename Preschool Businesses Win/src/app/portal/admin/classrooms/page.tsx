// @anchor: cca.classroom.list-page
// Classroom list with capacity and ratio indicators. Server Component.

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { ClassroomCard, type ClassroomCardData } from '@/components/portal/classrooms/classroom-card'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export default async function ClassroomsPage() {
  const supabase = createAdminClient()

  // Fetch classrooms
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('*')
    .eq('tenant_id', CCA_TENANT_ID)
    .order('name', { ascending: true })

  if (!classrooms) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Classrooms</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Failed to load classrooms.</p>
      </div>
    )
  }

  // Fetch enrollment counts per classroom (active assignments)
  const classroomIds = classrooms.map((c) => c.id)

  const { data: enrollments } = classroomIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('classroom_id')
        .eq('tenant_id', CCA_TENANT_ID)
        .in('classroom_id', classroomIds)
        .is('assigned_to', null)
    : { data: [] }

  const enrollmentMap = new Map<string, number>()
  for (const e of enrollments ?? []) {
    enrollmentMap.set(e.classroom_id, (enrollmentMap.get(e.classroom_id) ?? 0) + 1)
  }

  // Fetch staff counts per classroom (active assignments)
  const { data: staffAssignments } = classroomIds.length > 0
    ? await supabase
        .from('classroom_staff_assignments')
        .select('classroom_id, is_primary, user_id')
        .eq('tenant_id', CCA_TENANT_ID)
        .in('classroom_id', classroomIds)
        .is('assigned_to', null)
    : { data: [] }

  const staffCountMap = new Map<string, number>()
  const leadTeacherMap = new Map<string, string>()
  for (const s of staffAssignments ?? []) {
    staffCountMap.set(s.classroom_id, (staffCountMap.get(s.classroom_id) ?? 0) + 1)
    if (s.is_primary) {
      leadTeacherMap.set(s.classroom_id, s.user_id)
    }
  }

  // Build card data
  const cardData: ClassroomCardData[] = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    age_range_min_months: c.age_range_min_months,
    age_range_max_months: c.age_range_max_months,
    capacity: c.capacity,
    current_enrollment: enrollmentMap.get(c.id) ?? 0,
    ratio_required: c.ratio_required ?? 10,
    staff_count: staffCountMap.get(c.id) ?? 0,
    students_present: enrollmentMap.get(c.id) ?? 0, // Simplified: use enrollment as proxy
    room_number: c.room_number,
    status: c.status,
    lead_teacher_name: null, // Would need a join to user_profiles
  }))

  const activeClassrooms = cardData.filter((c) => c.status === 'active')
  const inactiveClassrooms = cardData.filter((c) => c.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Classrooms</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {activeClassrooms.length} active classroom{activeClassrooms.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/admin/classrooms/new">Add Classroom</Link>
        </Button>
      </div>

      {/* Active classrooms */}
      {activeClassrooms.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Active
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeClassrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                href={`/portal/admin/classrooms/${classroom.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive classrooms */}
      {inactiveClassrooms.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Inactive / Summer Only
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveClassrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                href={`/portal/admin/classrooms/${classroom.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {cardData.length === 0 && (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No classrooms yet. Create your first classroom to get started.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/portal/admin/classrooms/new">Add Classroom</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
