// @anchor: cca.medical.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medical Information | Parent Portal',
  description: 'View and manage your child\'s medical profile, allergies, and immunizations',
}

export default async function ParentChildMedicalPage({
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

  // Fetch student name
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (!student) notFound()

  const childName = `${student.first_name} ${student.last_name}`

  // Medical profile
  const { data: medicalProfile } = await supabase
    .from('student_medical_profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .limit(1)
    .single()

  // Allergies
  const { data: allergies } = await supabase
    .from('student_allergies')
    .select('allergen, severity, reaction_description, treatment_protocol, epipen_on_site')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)

  // Medications
  const { data: medications } = await supabase
    .from('student_medications')
    .select('medication_name, dosage, frequency, administration_instructions, requires_refrigeration')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)

  // Immunizations
  const { data: immunizations } = await supabase
    .from('student_immunizations')
    .select('vaccine_name, dose_number, administered_date, expiry_date')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('administered_date', { ascending: false })

  // Derive immunization status
  const immunizationRows = (immunizations ?? []).map(imm => {
    const now = new Date()
    let status: 'current' | 'due_soon' | 'expired' = 'current'
    if (imm.expiry_date) {
      const expiry = new Date(imm.expiry_date)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (expiry < now) status = 'expired'
      else if (expiry < thirtyDaysFromNow) status = 'due_soon'
    }
    return {
      vaccine: imm.vaccine_name,
      dose: imm.dose_number ? `Dose ${imm.dose_number}` : 'N/A',
      date: imm.administered_date
        ? new Date(imm.administered_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'N/A',
      status,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Medical Information — {childName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Keep this information up to date. It is displayed to staff during check-in and meal service.
        </p>
      </div>

      {/* Allergies - prominent */}
      {(allergies ?? []).length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ border: '2px solid var(--color-destructive)', backgroundColor: 'color-mix(in srgb, var(--color-destructive) 5%, transparent)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-destructive)' }}>
            Allergies
          </h2>
          <div className="mt-3 space-y-3">
            {(allergies ?? []).map((a) => (
              <div key={a.allergen} className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-card)' }}>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: a.severity === 'life_threatening' ? 'var(--color-destructive)' : 'var(--color-warning)',
                      color: 'var(--color-primary-foreground)',
                    }}
                  >
                    {a.severity === 'life_threatening' ? 'LIFE-THREATENING' : a.severity.toUpperCase()}
                  </span>
                  <span className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>{a.allergen}</span>
                  {a.epipen_on_site && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-destructive)', color: 'var(--color-primary-foreground)' }}>
                      EpiPen On-Site
                    </span>
                  )}
                </div>
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {a.reaction_description && (
                    <div>
                      <dt style={{ color: 'var(--color-muted-foreground)' }}>Reaction</dt>
                      <dd style={{ color: 'var(--color-foreground)' }}>{a.reaction_description}</dd>
                    </div>
                  )}
                  {a.treatment_protocol && (
                    <div>
                      <dt style={{ color: 'var(--color-muted-foreground)' }}>Treatment</dt>
                      <dd style={{ color: 'var(--color-foreground)' }}>{a.treatment_protocol}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
          <button
            className="mt-3 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Update Allergies
          </button>
        </div>
      )}

      {(allergies ?? []).length === 0 && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Allergies
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No allergies on record.
          </p>
          <button
            className="mt-3 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Add Allergy
          </button>
        </div>
      )}

      {/* Medical profile */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Medical Profile
        </h2>
        {medicalProfile ? (
          <>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ['Blood Type', medicalProfile.blood_type ?? 'Not specified'],
                ['Primary Physician', medicalProfile.primary_physician_name ?? 'Not specified'],
                ['Physician Phone', medicalProfile.primary_physician_phone ?? 'Not specified'],
                ['Insurance', medicalProfile.insurance_provider ?? 'Not specified'],
                ['Policy Number', medicalProfile.insurance_policy_number ?? 'Not specified'],
                ['Emergency Action Plan', medicalProfile.emergency_action_plan_path ? 'On file' : 'Not uploaded'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
                  <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
                </div>
              ))}
            </dl>
            {medicalProfile.special_needs_notes && (
              <div className="mt-3">
                <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Special Needs</dt>
                <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{medicalProfile.special_needs_notes}</dd>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No medical profile on file. Please add medical information.
          </p>
        )}
        <button
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Edit Medical Profile
        </button>
      </div>

      {/* Medications */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Medications
        </h2>
        {(medications ?? []).length > 0 ? (
          (medications ?? []).map((med) => (
            <div key={med.medication_name} className="mt-3 rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{med.medication_name}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {med.dosage ?? 'No dosage specified'} &middot; {med.frequency ?? 'As needed'}
              </p>
              {med.administration_instructions && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-foreground)' }}>{med.administration_instructions}</p>
              )}
            </div>
          ))
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No medications on record.
          </p>
        )}
        <button
          className="mt-3 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Add Medication
        </button>
      </div>

      {/* Immunizations */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Immunization Records
          </h2>
        </div>
        {immunizationRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Vaccine', 'Dose', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {immunizationRows.map((imm, idx) => (
                  <tr key={`${imm.vaccine}-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{imm.vaccine}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{imm.dose}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{imm.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: imm.status === 'current' ? 'var(--color-primary)' : 'var(--color-warning)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        {imm.status === 'current' ? 'Current' : imm.status === 'due_soon' ? 'Due Soon' : 'Expired'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No immunization records on file.
            </p>
          </div>
        )}
        <div className="p-4">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Upload Immunization Records
          </button>
        </div>
      </div>
    </div>
  )
}
