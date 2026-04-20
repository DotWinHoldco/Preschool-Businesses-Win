// @anchor: cca.family.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Family Profile | Parent Portal',
  description: 'Manage your family profile, members, and household information',
}

export default async function ParentFamilyPage() {
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

  if (familyIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Family Profile
          </h1>
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No family profile found.
          </p>
        </div>
      </div>
    )
  }

  // Get first family details
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .in('id', familyIds)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .limit(1)
    .single()

  if (!family) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Family Profile
          </h1>
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No family profile found.
          </p>
        </div>
      </div>
    )
  }

  // Family members with user profile details
  const { data: familyMembersRaw } = await supabase
    .from('family_members')
    .select('user_id, relationship_type, relationship_label, is_primary_contact, is_billing_responsible, can_pickup_default, user_profiles(first_name, last_name)')
    .in('family_id', familyIds)
    .eq('tenant_id', tenantId)

  const familyMembers = (familyMembersRaw ?? []).map(m => {
    const profile = m.user_profiles as unknown as { first_name: string | null; last_name: string | null } | null
    return {
      name: profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'Unknown',
      relationship: m.relationship_label ?? m.relationship_type,
      role: m.is_primary_contact ? 'Primary Contact' : 'Contact',
      billing: m.is_billing_responsible,
      canPickup: m.can_pickup_default,
    }
  })

  // Children linked to these families
  const { data: studentLinks } = await supabase
    .from('student_family_links')
    .select('student_id')
    .in('family_id', familyIds)
    .eq('tenant_id', tenantId)
  const studentIds = (studentLinks ?? []).map(l => l.student_id)

  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth, enrollment_status')
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

  const childrenList = (studentsRaw ?? []).map(s => {
    const assignment = (classroomAssignments ?? []).find(a => a.student_id === s.id)
    const classroomObj = assignment?.classrooms as unknown as { name: string } | { name: string }[] | null
    const classroomName = Array.isArray(classroomObj) ? classroomObj[0]?.name ?? 'Unassigned' : classroomObj?.name ?? 'Unassigned'
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      age: computeAge(s.date_of_birth),
      classroom: classroomName,
      status: s.enrollment_status ?? 'Active',
    }
  })

  // Build address string
  const addressParts = [
    family.mailing_address_line1,
    family.mailing_address_line2,
    family.mailing_city ? `${family.mailing_city}, ${family.mailing_state ?? ''} ${family.mailing_zip ?? ''}`.trim() : null,
  ].filter(Boolean)
  const address = addressParts.length > 0 ? addressParts.join(', ') : 'No address on file'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Family Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {family.family_name}
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Edit Family Info
        </button>
      </div>

      {/* Household info */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Household Information
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ['Mailing Address', address],
            ['Billing Email', family.billing_email ?? 'Not specified'],
            ['Billing Phone', family.billing_phone ?? 'Not specified'],
            ['Auto-Pay', family.auto_pay_enabled ? 'Enabled' : 'Disabled'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
              <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Children */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Children
        </h2>
        {childrenList.length > 0 ? (
          <div className="mt-3 space-y-3">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{child.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {child.age} &middot; {child.classroom}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  {child.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No children linked to this family.
          </p>
        )}
      </div>

      {/* Family members */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Family Members
          </h2>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            + Add Member
          </button>
        </div>
        {familyMembers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {member.name}
                    {member.role === 'Primary Contact' && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--color-primary)' }}>(Primary)</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {member.relationship}
                  </p>
                </div>
                <div className="flex gap-2">
                  {member.canPickup && (
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                      Pickup
                    </span>
                  )}
                  {member.billing && (
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
                      Billing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No family members on file.
          </p>
        )}
      </div>

      {/* Authorized pickups link */}
      <a
        href="/portal/parent/family/pickups"
        className="block rounded-xl p-5 transition-shadow hover:shadow-md"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Authorized Pickups
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Manage who is authorized to pick up your children. Photo ID required for non-parents.
            </p>
          </div>
          <span style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>&rarr;</span>
        </div>
      </a>
    </div>
  )
}
