// @anchor: cca.student.detail-page
// Student detail with tabs: Profile, Medical, Allergies, Family, Notes.
// Next.js 16: params is a Promise, must await.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MedicalProfile } from '@/components/portal/students/medical-profile'
import { AllergyBadge } from '@/components/portal/students/allergy-badge'
import { SectionEditButton } from '@/components/portal/students/section-edit-button'
import type { AllergySeverity } from '@/components/portal/students/allergy-badge'
import type { AllergyData, MedicalProfileData } from '@/components/portal/students/medical-profile'

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months} months`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years} years`
}

const statusVariant: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'outline'> = {
  active: 'success',
  enrolled: 'default',
  applied: 'outline',
  waitlisted: 'warning',
  withdrawn: 'danger',
  graduated: 'outline',
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { studentId } = await params
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  if (!student) notFound()

  // Fetch medical profile
  const { data: medicalProfile } = await supabase
    .from('student_medical_profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  // Fetch allergies
  const { data: allergies } = await supabase
    .from('student_allergies')
    .select('*')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('severity', { ascending: false })

  // Fetch immunizations
  const { data: immunizations } = await supabase
    .from('student_immunizations')
    .select('*')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('administered_date', { ascending: false })

  // Fetch emergency contacts
  const { data: emergencyContacts } = await supabase
    .from('student_emergency_contacts')
    .select('*')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('priority_order', { ascending: true })

  // Fetch classroom assignment
  const { data: classroomAssignment } = await supabase
    .from('student_classroom_assignments')
    .select('*, classrooms(name)')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .is('assigned_to', null)
    .single()

  // Fetch family links
  const { data: familyLinks } = await supabase
    .from('student_family_links')
    .select('*, families(id, family_name)')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)

  // Fetch classrooms for edit dialog
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')

  // Fetch entity notes
  const { data: notes } = await supabase
    .from('entity_notes')
    .select('*')
    .eq('entity_type', 'student')
    .eq('entity_id', studentId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)

  const displayName = student.preferred_name || student.first_name
  const age = calculateAge(student.date_of_birth)
  const hasLifeThreatening = allergies?.some(
    (a) => a.severity === 'life_threatening',
  )

  const classroomName = classroomAssignment
    ? (classroomAssignment as Record<string, unknown>).classrooms
      ? ((classroomAssignment as Record<string, unknown>).classrooms as { name: string }).name
      : null
    : null

  const currentClassroomId = classroomAssignment?.classroom_id ?? null

  return (
    <div className="space-y-6">
      {/* Life-threatening allergy banner */}
      {hasLifeThreatening && (
        <div
          className="flex items-center gap-3 rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <svg
            className="h-6 w-6 shrink-0 text-red-600"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm font-semibold text-red-800">
            Life-threatening allergy:{' '}
            {allergies
              ?.filter((a) => a.severity === 'life_threatening')
              .map((a) => a.allergen)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {student.photo_path ? (
            <img
              src={student.photo_path}
              alt={`${displayName} ${student.last_name}`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-muted)] text-lg font-semibold text-[var(--color-muted-foreground)]">
              {student.first_name[0]}{student.last_name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {displayName} {student.last_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <span>{age}</span>
              <span aria-hidden="true">·</span>
              <span>DOB: {new Date(student.date_of_birth).toLocaleDateString()}</span>
              {classroomName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{classroomName}</span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant={statusVariant[student.enrollment_status] || 'outline'} size="sm">
                {student.enrollment_status}
              </Badge>
              {allergies?.map((a) => (
                <AllergyBadge key={a.id} allergen={a.allergen} severity={a.severity as AllergySeverity} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/portal/admin/students">Back to List</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Profile</CardTitle>
                <SectionEditButton
                  section="overview"
                  studentId={studentId}
                  overview={{
                    id: studentId,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    date_of_birth: student.date_of_birth,
                    gender: student.gender ?? null,
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">First Name</dt>
                  <dd className="text-sm text-[var(--color-foreground)]">{student.first_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Last Name</dt>
                  <dd className="text-sm text-[var(--color-foreground)]">{student.last_name}</dd>
                </div>
                {student.preferred_name && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Preferred Name</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">{student.preferred_name}</dd>
                  </div>
                )}
                {student.gender && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Gender</dt>
                    <dd className="text-sm text-[var(--color-foreground)] capitalize">{student.gender.replace(/_/g, ' ')}</dd>
                  </div>
                )}
                {student.enrollment_date && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Enrollment Date</dt>
                    <dd className="text-sm text-[var(--color-foreground)]">{new Date(student.enrollment_date).toLocaleDateString()}</dd>
                  </div>
                )}
                {student.notes_internal && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-[var(--color-muted-foreground)]">Internal Notes</dt>
                    <dd className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">{student.notes_internal}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Medical & Allergies */}
          <MedicalProfile
            profile={medicalProfile as MedicalProfileData | null}
            allergies={(allergies ?? []).map((a) => ({
              id: a.id,
              allergen: a.allergen,
              severity: a.severity as AllergySeverity,
              reaction_description: a.reaction_description,
              treatment_protocol: a.treatment_protocol,
              medication_name: a.medication_name,
              medication_location: a.medication_location,
              epipen_on_site: a.epipen_on_site ?? false,
              notes: a.notes,
            }))}
            allergiesAction={
              <SectionEditButton
                section="allergies"
                studentId={studentId}
                allergies={(allergies ?? []).map((a) => ({
                  id: a.id,
                  allergen: a.allergen,
                  severity: a.severity,
                }))}
              />
            }
            medicalAction={
              <SectionEditButton
                section="medical"
                studentId={studentId}
                medical={{
                  student_id: studentId,
                  blood_type: medicalProfile?.blood_type ?? null,
                  primary_physician_name: medicalProfile?.primary_physician_name ?? null,
                  primary_physician_phone: medicalProfile?.primary_physician_phone ?? null,
                  insurance_provider: medicalProfile?.insurance_provider ?? null,
                  insurance_policy_number: medicalProfile?.insurance_policy_number ?? null,
                  special_needs_notes: medicalProfile?.special_needs_notes ?? null,
                }}
              />
            }
          />

          {/* Immunizations */}
          <Card>
            <CardHeader>
              <CardTitle>Immunizations</CardTitle>
            </CardHeader>
            <CardContent>
              {(!immunizations || immunizations.length === 0) ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No immunization records on file</p>
              ) : (
                <div className="space-y-2">
                  {immunizations.map((imm) => (
                    <div key={imm.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{imm.vaccine_name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Dose {imm.dose_number} · {new Date(imm.administered_date).toLocaleDateString()}
                          {imm.provider && ` · ${imm.provider}`}
                        </p>
                      </div>
                      {imm.verified_at ? (
                        <Badge variant="success" size="sm">Verified</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Unverified</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Family links */}
          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
            </CardHeader>
            <CardContent>
              {(!familyLinks || familyLinks.length === 0) ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">Not linked to any family</p>
              ) : (
                <div className="space-y-2">
                  {familyLinks.map((link) => {
                    const family = (link as Record<string, unknown>).families as { id: string; family_name: string } | null
                    return (
                      <a
                        key={link.id}
                        href={family ? `/portal/admin/families/${family.id}` : '#'}
                        className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            {family?.family_name ?? 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                            {link.is_primary_family && <span>Primary</span>}
                            {link.billing_split_pct != null && link.billing_split_pct < 100 && (
                              <span>{link.billing_split_pct}% billing</span>
                            )}
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted-foreground)]">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </a>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {(!emergencyContacts || emergencyContacts.length === 0) ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No emergency contacts on file</p>
              ) : (
                <div className="space-y-2">
                  {emergencyContacts.map((ec) => (
                    <div key={ec.id} className="rounded-lg border border-[var(--color-border)] p-3">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">{ec.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{ec.relationship}</p>
                      <p className="text-xs text-[var(--color-foreground)]">{ec.phone_primary}</p>
                      {ec.can_pickup && (
                        <Badge variant="success" size="sm" className="mt-1">Can pickup</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                        {note.visibility === 'staff_only' && (
                          <Badge variant="outline" size="sm" className="ml-1">Staff only</Badge>
                        )}
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
