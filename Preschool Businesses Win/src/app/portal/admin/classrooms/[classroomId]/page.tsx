// @anchor: cca.classroom.detail-page
// Classroom detail: roster, capacity, ratio badge, staff assignments.
// Next.js 16: params is a Promise, must await.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CapacityGauge } from '@/components/portal/classrooms/capacity-gauge'
import { RatioBadge } from '@/components/portal/classrooms/ratio-badge'
import { AllergyBadge, type AllergySeverity } from '@/components/portal/students/allergy-badge'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

function formatAgeRange(minMonths: number, maxMonths: number): string {
  const formatAge = (months: number): string => {
    if (months < 12) return `${months}mo`
    return `${Math.floor(months / 12)}y`
  }
  return `${formatAge(minMonths)} – ${formatAge(maxMonths)}`
}

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params
  const supabase = createAdminClient()

  // Fetch classroom
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', classroomId)
    .eq('tenant_id', CCA_TENANT_ID)
    .single()

  if (!classroom) notFound()

  // Fetch student assignments (active)
  const { data: studentAssignments } = await supabase
    .from('student_classroom_assignments')
    .select('*, students(id, first_name, last_name, date_of_birth, photo_path, enrollment_status)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', CCA_TENANT_ID)
    .is('assigned_to', null)

  // Fetch staff assignments (active)
  const { data: staffAssignments } = await supabase
    .from('classroom_staff_assignments')
    .select('*, user_profiles(first_name, last_name)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', CCA_TENANT_ID)
    .is('assigned_to', null)

  // Fetch allergies for all roster students
  const studentIds = (studentAssignments ?? [])
    .map((sa) => ((sa as Record<string, unknown>).students as { id: string })?.id)
    .filter(Boolean)

  const { data: allergies } = studentIds.length > 0
    ? await supabase
        .from('student_allergies')
        .select('student_id, allergen, severity')
        .eq('tenant_id', CCA_TENANT_ID)
        .in('student_id', studentIds)
    : { data: [] }

  const allergyMap = new Map<string, Array<{ allergen: string; severity: AllergySeverity }>>()
  for (const a of allergies ?? []) {
    const list = allergyMap.get(a.student_id) ?? []
    list.push({ allergen: a.allergen, severity: a.severity as AllergySeverity })
    allergyMap.set(a.student_id, list)
  }

  const rosterCount = studentAssignments?.length ?? 0
  const staffCount = staffAssignments?.length ?? 0
  const ratioRequired = classroom.ratio_required ?? 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {classroom.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <span>{formatAgeRange(classroom.age_range_min_months, classroom.age_range_max_months)}</span>
            {classroom.room_number && (
              <>
                <span aria-hidden="true">·</span>
                <span>Room {classroom.room_number}</span>
              </>
            )}
            <Badge
              variant={classroom.status === 'active' ? 'success' : 'outline'}
              size="sm"
            >
              {classroom.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/portal/admin/classrooms">Back to List</Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <CapacityGauge current={rosterCount} max={classroom.capacity} label="Enrollment" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Ratio</p>
              <RatioBadge
                studentsPresent={rosterCount}
                staffPresent={staffCount}
                ratioRequired={ratioRequired}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Staff Assigned</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{staffCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Student Roster
                <Badge variant="outline" size="sm">{rosterCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rosterCount === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  No students assigned to this classroom
                </p>
              ) : (
                <div className="space-y-2">
                  {(studentAssignments ?? []).map((sa) => {
                    const student = (sa as Record<string, unknown>).students as {
                      id: string
                      first_name: string
                      last_name: string
                      date_of_birth: string
                      photo_path: string | null
                      enrollment_status: string
                    } | null
                    if (!student) return null
                    const studentAllergies = allergyMap.get(student.id) ?? []
                    const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
                    return (
                      <a
                        key={sa.id}
                        href={`/portal/admin/students/${student.id}`}
                        className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]/50"
                      >
                        {student.photo_path ? (
                          <img src={student.photo_path} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-muted-foreground)]">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {calculateAge(student.date_of_birth)} · {sa.program_type?.replace(/_/g, ' ') ?? 'full day'}
                          </p>
                        </div>
                        {studentAllergies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {studentAllergies.map((a) => (
                              <AllergyBadge key={a.allergen} allergen={a.allergen} severity={a.severity} />
                            ))}
                          </div>
                        )}
                      </a>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff & details sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staffCount === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No staff assigned</p>
              ) : (
                <div className="space-y-2">
                  {(staffAssignments ?? []).map((sa) => {
                    const profile = (sa as Record<string, unknown>).user_profiles as {
                      first_name: string
                      last_name: string
                    } | null
                    return (
                      <div key={sa.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                          {profile ? `${profile.first_name[0]}${profile.last_name[0]}` : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-[var(--color-muted-foreground)] capitalize">
                            {sa.role?.replace(/_/g, ' ') ?? 'staff'}
                          </p>
                        </div>
                        {sa.is_primary && (
                          <Badge variant="default" size="sm">Lead</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Capacity</dt>
                  <dd className="text-sm text-[var(--color-foreground)]">{classroom.capacity} students</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Required Ratio</dt>
                  <dd className="text-sm text-[var(--color-foreground)]">{ratioRequired}:1</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Age Range</dt>
                  <dd className="text-sm text-[var(--color-foreground)]">
                    {formatAgeRange(classroom.age_range_min_months, classroom.age_range_max_months)}
                  </dd>
                </div>
                {classroom.description && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Description</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">{classroom.description}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
