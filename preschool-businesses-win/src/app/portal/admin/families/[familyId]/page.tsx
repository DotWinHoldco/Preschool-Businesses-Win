// @anchor: cca.family.detail-page
// Family detail: members, linked students, billing info, authorized pickups.
// Next.js 16: params is a Promise, must await.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FamilyTreeView } from '@/components/portal/families/family-tree-view'
import { AuthorizedPickupList } from '@/components/portal/families/authorized-pickup-list'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const supabase = await createTenantAdminClient()

  // Fetch family
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .eq('tenant_id', CCA_TENANT_ID)
    .single()

  if (!family) notFound()

  // Fetch family members
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('tenant_id', CCA_TENANT_ID)
    .order('is_primary_contact', { ascending: false })

  // Fetch linked students
  const { data: studentLinks } = await supabase
    .from('student_family_links')
    .select('*, students(id, first_name, last_name, date_of_birth, enrollment_status)')
    .eq('family_id', familyId)
    .eq('tenant_id', CCA_TENANT_ID)

  // Fetch authorized pickups for all linked students
  const studentIds = studentLinks?.map(
    (sl) => ((sl as Record<string, unknown>).students as { id: string })?.id,
  ).filter(Boolean) ?? []

  const { data: pickups } = studentIds.length > 0
    ? await supabase
        .from('authorized_pickups')
        .select('*')
        .eq('family_id', familyId)
        .eq('tenant_id', CCA_TENANT_ID)
    : { data: [] }

  // Fetch entity notes
  const { data: notes } = await supabase
    .from('entity_notes')
    .select('*')
    .eq('entity_type', 'family')
    .eq('entity_id', familyId)
    .eq('tenant_id', CCA_TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(20)

  // Map data for components
  const mappedMembers = (members ?? []).map((m) => ({
    id: m.id,
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    relationship_type: m.relationship_type ?? 'other',
    relationship_label: m.relationship_label,
    is_primary_contact: m.is_primary_contact ?? false,
    is_billing_responsible: m.is_billing_responsible ?? false,
    can_pickup_default: m.can_pickup_default ?? true,
    phone: m.phone,
    email: m.email,
  }))

  const mappedStudents = (studentLinks ?? []).map((sl) => {
    const student = (sl as Record<string, unknown>).students as {
      id: string
      first_name: string
      last_name: string
      date_of_birth: string
      enrollment_status: string
    } | null
    return {
      id: student?.id ?? '',
      first_name: student?.first_name ?? '',
      last_name: student?.last_name ?? '',
      date_of_birth: student?.date_of_birth ?? '',
      enrollment_status: student?.enrollment_status ?? 'unknown',
      billing_split_pct: sl.billing_split_pct,
      is_primary_family: sl.is_primary_family,
    }
  })

  const mappedPickups = (pickups ?? []).map((p) => ({
    id: p.id,
    person_name: p.person_name,
    relationship: p.relationship,
    phone: p.phone,
    photo_path: p.photo_path,
    photo_verified: p.photo_verified,
    government_id_type: p.government_id_type,
    government_id_verified_at: p.government_id_verified_at,
    valid_from: p.valid_from,
    valid_to: p.valid_to,
    notes: p.notes,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {family.family_name} Family
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            {family.billing_email && <span>{family.billing_email}</span>}
            {family.billing_phone && (
              <>
                {family.billing_email && <span aria-hidden="true">·</span>}
                <span>{family.billing_phone}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/portal/admin/families">Back to List</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Family tree view */}
          <FamilyTreeView
            familyName={family.family_name}
            members={mappedMembers}
            students={mappedStudents}
          />

          {/* Authorized pickups */}
          {studentIds.length > 0 && (
            <AuthorizedPickupList
              pickups={mappedPickups}
              studentName={
                mappedStudents.length === 1
                  ? `${mappedStudents[0].first_name}`
                  : 'children'
              }
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact & billing */}
          <Card>
            <CardHeader>
              <CardTitle>Contact &amp; Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {family.billing_email && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Billing Email</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">{family.billing_email}</dd>
                  </div>
                )}
                {family.billing_phone && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Billing Phone</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">{family.billing_phone}</dd>
                  </div>
                )}
                {family.mailing_address_line1 && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Mailing Address</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">
                      {family.mailing_address_line1}
                      {family.mailing_address_line2 && <br />}
                      {family.mailing_address_line2}
                      <br />
                      {family.mailing_city && `${family.mailing_city}, `}
                      {family.mailing_state} {family.mailing_zip}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Auto-pay</dt>
                  <dd>
                    <Badge variant={family.auto_pay_enabled ? 'success' : 'outline'} size="sm">
                      {family.auto_pay_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {(!notes || notes.length === 0) ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No notes</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-2 border-[var(--color-border)] pl-3">
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {new Date(note.created_at).toLocaleDateString()} · {note.note_type}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--color-foreground)]">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
