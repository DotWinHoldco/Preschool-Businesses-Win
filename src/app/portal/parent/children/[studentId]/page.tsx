// @anchor: cca.student.parent-detail-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Child Detail | Parent Portal',
  description: 'View your child\'s profile, classroom, and daily activity',
}

export default async function ParentChildDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Verify student belongs to parent's family
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  if (familyIds.length === 0) notFound()

  const { data: studentLink } = await supabase
    .from('student_family_links')
    .select('student_id')
    .eq('student_id', studentId)
    .in('family_id', familyIds)
    .eq('tenant_id', tenantId)
    .limit(1)
    .single()

  if (!studentLink) notFound()

  // Fetch student
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, date_of_birth, photo_path, enrollment_status, enrollment_date')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (!student) notFound()

  // Classroom assignment
  const { data: classroomAssignment } = await supabase
    .from('student_classroom_assignments')
    .select('classroom_id, classrooms(name)')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .is('assigned_to', null)
    .limit(1)
    .single()

  const classroomObj = classroomAssignment?.classrooms as unknown as { name: string } | { name: string }[] | null
  const classroomName = Array.isArray(classroomObj) ? classroomObj[0]?.name ?? 'Unassigned' : classroomObj?.name ?? 'Unassigned'

  // Teacher lookup
  let teacherName = ''
  if (classroomAssignment) {
    const { data: staffAssignment } = await supabase
      .from('classroom_staff_assignments')
      .select('staff_profiles(user_id, user_profiles(first_name, last_name))')
      .eq('classroom_id', classroomAssignment.classroom_id)
      .eq('tenant_id', tenantId)
      .limit(1)
      .single()
    if (staffAssignment?.staff_profiles) {
      const profile = staffAssignment.staff_profiles as unknown as { user_profiles: { first_name: string; last_name: string } | null }
      if (profile?.user_profiles) {
        teacherName = `${profile.user_profiles.first_name ?? ''} ${profile.user_profiles.last_name ?? ''}`.trim()
      }
    }
  }

  // Allergies
  const { data: allergies } = await supabase
    .from('student_allergies')
    .select('allergen, severity')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)

  // Emergency contacts
  const { data: emergencyContacts } = await supabase
    .from('student_emergency_contacts')
    .select('name, relationship, phone_primary, priority_order, can_pickup')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('priority_order', { ascending: true })

  // Compute age
  function computeAge(dob: string): string {
    const birth = new Date(dob)
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    if (now.getDate() < birth.getDate()) months--
    if (months < 0) { years--; months += 12 }
    return `${years} years, ${months} months`
  }

  const age = computeAge(student.date_of_birth)
  const dob = new Date(student.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const enrollmentDate = student.enrollment_date
    ? new Date(student.enrollment_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A'

  // Recent activity — daily reports (published), attendance, check-ins
  const recentActivity: { date: string; type: string; detail: string }[] = []

  const { data: recentReports } = await supabase
    .from('daily_reports')
    .select('id, date, status')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(3)

  for (const report of recentReports ?? []) {
    const { data: entries } = await supabase
      .from('daily_report_entries')
      .select('entry_type, data')
      .eq('report_id', report.id)
      .eq('tenant_id', tenantId)
      .limit(1)
    const summary = entries?.[0]
      ? ((entries[0].data as Record<string, unknown>)?.notes as string
        ?? (entries[0].data as Record<string, unknown>)?.description as string
        ?? `Daily report (${entries[0].entry_type})`)
      : 'Daily report published'
    recentActivity.push({
      date: new Date(report.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: 'Daily Report',
      detail: summary,
    })
  }

  const { data: recentCheckIns } = await supabase
    .from('check_ins')
    .select('checked_in_at, method')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('checked_in_at', { ascending: false })
    .limit(3)

  for (const ci of recentCheckIns ?? []) {
    recentActivity.push({
      date: new Date(ci.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: 'Check-in',
      detail: `Checked in at ${new Date(ci.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (${ci.method})`,
    })
  }

  const { data: recentCheckOuts } = await supabase
    .from('check_outs')
    .select('checked_out_at, pickup_person_name')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('checked_out_at', { ascending: false })
    .limit(3)

  for (const co of recentCheckOuts ?? []) {
    recentActivity.push({
      date: new Date(co.checked_out_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: 'Check-out',
      detail: `Checked out at ${new Date(co.checked_out_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${co.pickup_person_name ? ` by ${co.pickup_person_name}` : ''}`,
    })
  }

  // Sort recent activity by date (most recent first)
  recentActivity.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {student.first_name} {student.last_name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {age} &middot; {classroomName} &middot; {student.enrollment_status}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/portal/parent/children/${studentId}/daily-reports`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Daily Reports
          </a>
          <a
            href={`/portal/parent/children/${studentId}/medical`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Medical Info
          </a>
        </div>
      </div>

      {/* Profile card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Profile
          </h2>
          <dl className="mt-3 space-y-2">
            {[
              ['Date of Birth', dob],
              ['Age', age],
              ['Classroom', classroomName],
              ['Lead Teacher', teacherName || 'N/A'],
              ['Enrolled Since', enrollmentDate],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Allergies */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Allergies & Alerts
          </h2>
          {(allergies ?? []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {(allergies ?? []).map((a) => (
                <div
                  key={a.allergen}
                  className="flex items-center gap-3 rounded-lg p-2"
                  style={{
                    backgroundColor: a.severity === 'life_threatening'
                      ? 'color-mix(in srgb, var(--color-destructive) 10%, transparent)'
                      : 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                  }}
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: a.severity === 'life_threatening' ? 'var(--color-destructive)' : 'var(--color-warning)',
                      color: 'var(--color-primary-foreground)',
                    }}
                  >
                    {a.severity === 'life_threatening' ? 'SEVERE' : a.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{a.allergen}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No known allergies.</p>
          )}
        </div>
      </div>

      {/* Emergency contacts */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Emergency Contacts
        </h2>
        {(emergencyContacts ?? []).length > 0 ? (
          <div className="mt-3 space-y-2">
            {(emergencyContacts ?? []).map((c) => (
              <div key={c.name} className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {c.name} ({c.relationship}) {c.priority_order === 1 && <span className="text-xs" style={{ color: 'var(--color-primary)' }}>(Primary)</span>}
                  </p>
                </div>
                <a href={`tel:${c.phone_primary}`} className="text-sm" style={{ color: 'var(--color-primary)' }}>{c.phone_primary}</a>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No emergency contacts on file.</p>
        )}
      </div>

      {/* Recent activity */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Recent Activity
        </h2>
        {recentActivity.length > 0 ? (
          <div className="mt-3 space-y-3">
            {recentActivity.slice(0, 8).map((activity, i) => (
              <div key={i} className="flex gap-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <span className="w-20 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{activity.date}</span>
                <span
                  className="w-24 rounded-full px-2 py-0.5 text-center text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                >
                  {activity.type}
                </span>
                <span className="flex-1 text-sm" style={{ color: 'var(--color-foreground)' }}>{activity.detail}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No recent activity.</p>
        )}
      </div>
    </div>
  )
}
