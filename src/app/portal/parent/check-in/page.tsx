// @anchor: cca.checkin.parent-page
// Parent QR display page — shows QR codes for each child.
// Large, scannable display. Swipeable if multiple children.
// See CCA_BUILD_BRIEF.md §7

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ParentQRDisplay } from './qr-display'

export const metadata = {
  title: 'Check-In QR Code',
  description: 'Show this QR code to staff when dropping off your child',
}

export default async function ParentCheckInPage() {
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
        .select('student_id, family_id')
        .in('family_id', familyIds)
        .eq('tenant_id', tenantId)
    : { data: [] }
  const studentIds = (studentLinks ?? []).map(l => l.student_id)
  const studentFamilyMap = new Map((studentLinks ?? []).map(l => [l.student_id, l.family_id]))

  // Fetch student info
  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase
        .from('students')
        .select('id, first_name, last_name, photo_path')
        .in('id', studentIds)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    : { data: [] }

  // Classroom assignments
  const { data: classroomAssignments } = studentIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('student_id, classrooms(name)')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .is('assigned_to', null)
    : { data: [] }

  // QR codes — look for active (not expired, not revoked) codes
  const { data: qrCodes } = studentIds.length > 0
    ? await supabase
        .from('student_qr_codes')
        .select('student_id, qr_token, expires_at')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
    : { data: [] }

  const qrMap = new Map((qrCodes ?? []).map(q => [q.student_id, q.qr_token]))

  // Build student data for QR display
  const students = (studentsRaw ?? []).map(s => {
    const assignment = (classroomAssignments ?? []).find(a => a.student_id === s.id)
    const classroomObj = assignment?.classrooms as unknown as { name: string } | { name: string }[] | null
    const classroomName = Array.isArray(classroomObj) ? classroomObj[0]?.name ?? null : classroomObj?.name ?? null
    const qrToken = qrMap.get(s.id)

    // If no QR token exists, generate a deterministic fallback for the display
    // (The actual check-in validation happens server-side via the student_qr_codes table)
    const familyId = studentFamilyMap.get(s.id) ?? 'unknown'
    const displayToken = qrToken ?? `checkin-${tenantId}-${s.id}-${familyId}`

    return {
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      qr_token: displayToken,
      classroom_name: classroomName,
      photo_path: s.photo_path,
    }
  })

  return (
    <div className="mx-auto max-w-md py-8">
      <ParentQRDisplay students={students} />
    </div>
  )
}
