// @anchor: cca.classroom.detail-page
// Classroom detail: roster, capacity, ratio badge, staff assignments.
// Next.js 16: params is a Promise, must await.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CapacityGauge } from '@/components/portal/classrooms/capacity-gauge'
import { RatioBadge } from '@/components/portal/classrooms/ratio-badge'
import { ClassroomRosterManager } from '@/components/portal/classrooms/classroom-roster-manager'
import { type AllergySeverity } from '@/components/portal/students/allergy-badge'

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
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { classroomId } = await params
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch classroom
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', classroomId)
    .eq('tenant_id', tenantId)
    .single()

  if (!classroom) notFound()

  // Fetch student assignments (active)
  const { data: studentAssignments } = await supabase
    .from('student_classroom_assignments')
    .select('*, students(id, first_name, last_name, date_of_birth, photo_path, enrollment_status)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .is('assigned_to', null)

  // Fetch staff assignments (active)
  const { data: staffAssignments } = await supabase
    .from('classroom_staff_assignments')
    .select('*, user_profiles(first_name, last_name)')
    .eq('classroom_id', classroomId)
    .eq('tenant_id', tenantId)
    .is('assigned_to', null)

  // Fetch allergies for all roster students
  const studentIds = (studentAssignments ?? [])
    .map((sa) => ((sa as Record<string, unknown>).students as { id: string })?.id)
    .filter(Boolean)

  const { data: allergies } = studentIds.length > 0
    ? await supabase
        .from('student_allergies')
        .select('student_id, allergen, severity')
        .eq('tenant_id', tenantId)
        .in('student_id', studentIds)
    : { data: [] }

  // Fetch all active students for assignment dropdown
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, date_of_birth')
    .eq('tenant_id', tenantId)
    .in('enrollment_status', ['active', 'enrolled'])
    .order('last_name')

  const allergyMap = new Map<string, Array<{ allergen: string; severity: AllergySeverity }>>()
  for (const a of allergies ?? []) {
    const list = allergyMap.get(a.student_id) ?? []
    list.push({ allergen: a.allergen, severity: a.severity as AllergySeverity })
    allergyMap.set(a.student_id, list)
  }

  const rosterData = (studentAssignments ?? []).map((sa) => {
    const student = (sa as Record<string, unknown>).students as {
      id: string; first_name: string; last_name: string; date_of_birth: string; photo_path: string | null; enrollment_status: string
    } | null
    return {
      assignmentId: sa.id,
      studentId: student?.id ?? '',
      firstName: student?.first_name ?? '',
      lastName: student?.last_name ?? '',
      dateOfBirth: student?.date_of_birth ?? '',
      photoPath: student?.photo_path ?? null,
      enrollmentStatus: student?.enrollment_status ?? '',
      programType: sa.program_type ?? 'full_day',
      allergies: student ? (allergyMap.get(student.id) ?? []) : [],
    }
  })

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
          <ClassroomRosterManager
            classroomId={classroomId}
            roster={rosterData}
            availableStudents={(allStudents ?? []).map((s) => ({
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              dateOfBirth: s.date_of_birth,
            }))}
            calculateAge={calculateAge}
          />
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
