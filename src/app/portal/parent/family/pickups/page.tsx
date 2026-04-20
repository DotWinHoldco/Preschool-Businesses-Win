// @anchor: cca.family.pickups-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authorized Pickups | Parent Portal',
  description: 'Manage who is authorized to pick up your children',
}

export default async function ParentFamilyPickupsPage() {
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

  // Get students linked to families
  const { data: studentLinks } = familyIds.length > 0
    ? await supabase
        .from('student_family_links')
        .select('student_id')
        .in('family_id', familyIds)
        .eq('tenant_id', tenantId)
    : { data: [] }
  const studentIds = (studentLinks ?? []).map(l => l.student_id)

  // Get student names for display
  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase
        .from('students')
        .select('id, first_name')
        .in('id', studentIds)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    : { data: [] }
  const studentNameMap = new Map((studentsRaw ?? []).map(s => [s.id, s.first_name]))

  // Fetch authorized pickups for these families
  const { data: pickupsRaw } = familyIds.length > 0
    ? await supabase
        .from('authorized_pickups')
        .select('id, student_id, family_id, person_name, relationship, phone, photo_path, photo_verified, government_id_type, government_id_verified_at, valid_from, valid_to')
        .in('family_id', familyIds)
        .eq('tenant_id', tenantId)
    : { data: [] }

  // Group pickups by person_name to consolidate entries for the same person across students
  const pickupMap = new Map<string, {
    id: string
    name: string
    relationship: string
    phone: string | null
    photoOnFile: boolean
    idVerified: boolean
    validFrom: string | null
    validTo: string | null
    children: string[]
    isParent: boolean
  }>()

  for (const p of pickupsRaw ?? []) {
    const childName = studentNameMap.get(p.student_id) ?? 'Unknown'
    const isParent = ['mother', 'father', 'parent', 'mom', 'dad'].includes(p.relationship.toLowerCase())

    if (pickupMap.has(p.person_name)) {
      const existing = pickupMap.get(p.person_name)!
      if (!existing.children.includes(childName)) {
        existing.children.push(childName)
      }
    } else {
      pickupMap.set(p.person_name, {
        id: p.id,
        name: p.person_name,
        relationship: p.relationship,
        phone: p.phone,
        photoOnFile: !!p.photo_path,
        idVerified: !!p.government_id_verified_at,
        validFrom: p.valid_from
          ? new Date(p.valid_from + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : null,
        validTo: p.valid_to
          ? new Date(p.valid_to + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : null,
        children: [childName],
        isParent,
      })
    }
  }

  const pickups = Array.from(pickupMap.values())

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Authorized Pickups
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Only these people may pick up your children. Photo ID verification is required for all non-parents. Unauthorized pickups will be blocked.
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          + Add Authorized Pickup
        </button>
      </div>

      {/* Safety notice */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-destructive) 5%, transparent)', border: '1px solid var(--color-destructive)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-destructive)' }}>
          Child safety is non-negotiable. Any person not on this list will be denied checkout and administration will be alerted immediately.
        </p>
      </div>

      {/* Pickup list */}
      {pickups.length > 0 ? (
        <div className="space-y-4">
          {pickups.map((person) => (
            <div
              key={person.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: person.photoOnFile ? 'var(--color-primary)' : 'var(--color-muted)',
                      color: person.photoOnFile ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                    }}
                  >
                    {person.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      {person.name}
                      {person.isParent && (
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-primary)' }}>(Parent)</span>
                      )}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {person.relationship}{person.phone ? ` \u00B7 ${person.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {person.photoOnFile ? (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                      Photo on File
                    </span>
                  ) : (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-primary-foreground)' }}>
                      No Photo
                    </span>
                  )}
                  {person.idVerified ? (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                      ID Verified
                    </span>
                  ) : (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-primary-foreground)' }}>
                      ID Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Authorized for: </span>
                  <span style={{ color: 'var(--color-foreground)' }}>{person.children.join(', ')}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Valid: </span>
                  <span style={{ color: 'var(--color-foreground)' }}>
                    {person.validFrom ?? 'N/A'} {person.validTo ? `to ${person.validTo}` : '(ongoing)'}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Edit</button>
                {!person.photoOnFile && (
                  <button className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>Upload Photo</button>
                )}
                {!person.isParent && (
                  <button className="text-xs font-medium" style={{ color: 'var(--color-destructive)' }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No authorized pickup persons added yet.
          </p>
        </div>
      )}
    </div>
  )
}
