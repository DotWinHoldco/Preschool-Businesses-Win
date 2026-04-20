// @anchor: cca.family.parent-children-page
// Parent view of their children — overview cards with quick actions.
// Real Supabase queries replace placeholder data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Heart, BookOpen, FileText, ChevronRight } from 'lucide-react'

export default async function ParentChildrenPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get families this user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  // Get students linked to those families
  const { data: studentLinks } = familyIds.length > 0
    ? await supabase
        .from('student_family_links')
        .select('student_id')
        .in('family_id', familyIds)
        .eq('tenant_id', tenantId)
    : { data: [] }
  const studentIds = (studentLinks ?? []).map(l => l.student_id)

  // Fetch students
  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth, photo_path, enrollment_status')
        .in('id', studentIds)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    : { data: [] }

  // Classroom assignments with classroom name
  const { data: classroomAssignments } = studentIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('student_id, classrooms(name)')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .is('assigned_to', null)
    : { data: [] }

  // Allergies
  const { data: allergiesRaw } = studentIds.length > 0
    ? await supabase
        .from('student_allergies')
        .select('student_id, allergen, severity')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
    : { data: [] }

  // Today's check-ins
  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckIns } = studentIds.length > 0
    ? await supabase
        .from('check_ins')
        .select('student_id, checked_in_at')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
    : { data: [] }

  // Lead teacher per classroom
  const { data: staffAssignments } = studentIds.length > 0
    ? await supabase
        .from('classroom_staff_assignments')
        .select('classroom_id, staff_profiles(user_id, user_profiles(first_name, last_name))')
        .eq('tenant_id', tenantId)
    : { data: [] }

  function computeAge(dob: string): string {
    const birth = new Date(dob)
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--
    if (years < 1) {
      let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
      if (now.getDate() < birth.getDate()) months--
      return months === 1 ? '1 month' : `${months} months`
    }
    return years === 1 ? '1 year' : `${years} years`
  }

  const children = (studentsRaw ?? []).map(s => {
    const assignment = (classroomAssignments ?? []).find(a => a.student_id === s.id)
    const classroomObj = assignment?.classrooms as unknown as { name: string } | { name: string }[] | null
    const classroomName = Array.isArray(classroomObj) ? classroomObj[0]?.name ?? 'Unassigned' : classroomObj?.name ?? 'Unassigned'
    const studentAllergies = (allergiesRaw ?? [])
      .filter(a => a.student_id === s.id)
      .map(a => a.severity === 'life_threatening' ? `${a.allergen} (severe)` : a.allergen)
    const checkIn = (todayCheckIns ?? []).find(c => c.student_id === s.id)

    // Try to find a teacher for this classroom
    let teacherName = ''
    if (assignment) {
      const classroomId = (assignment as unknown as { classroom_id: string }).classroom_id
      const staff = (staffAssignments ?? []).find(
        sa => sa.classroom_id === classroomId
      )
      if (staff?.staff_profiles) {
        const profile = (staff.staff_profiles as unknown as { user_profiles: { first_name: string; last_name: string } | null })
        if (profile?.user_profiles) {
          teacherName = `${profile.user_profiles.first_name ?? ''} ${profile.user_profiles.last_name ?? ''}`.trim()
        }
      }
    }

    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      age: computeAge(s.date_of_birth),
      classroom: classroomName,
      teacher: teacherName || undefined,
      status: checkIn ? 'checked-in' : 'not-checked-in',
      checkedInAt: checkIn
        ? new Date(checkIn.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : null,
      allergies: studentAllergies,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          My Children
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          View your children&apos;s profiles, daily reports, and medical information.
        </p>
      </div>

      {children.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No children linked to your account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <a key={child.id} href={`/portal/parent/children/${child.id}`} className="block">
              <Card className="h-full transition-transform hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                    >
                      {child.name.charAt(0)}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                  </div>
                  <CardTitle className="mt-2">{child.name}</CardTitle>
                  <CardDescription>
                    {child.age} &middot; {child.classroom}{child.teacher ? ` \u00B7 ${child.teacher}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: child.status === 'checked-in'
                            ? 'var(--color-success, #10B981)'
                            : 'var(--color-muted-foreground)',
                        }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {child.status === 'checked-in'
                          ? `Checked in at ${child.checkedInAt}`
                          : 'Not checked in'}
                      </span>
                    </div>
                    {child.allergies.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart size={12} style={{ color: 'var(--color-destructive, #EF4444)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-destructive, #EF4444)' }}>
                          {child.allergies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                    >
                      <FileText size={10} /> Daily Reports
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                    >
                      <BookOpen size={10} /> Portfolio
                    </span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
