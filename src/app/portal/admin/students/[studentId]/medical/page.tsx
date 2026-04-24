// @anchor: cca.medical.student-page
// Student medical detail page — placeholder for Phase 2. Types will be generated from Supabase.
// Next.js 16: params is a Promise, must await

import { createTenantServerClient } from '@/lib/supabase/server'
import { ShieldAlert, Heart, Pill, Syringe, Phone, AlertTriangle } from 'lucide-react'

export default async function StudentMedicalPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createTenantServerClient()

  // Fetch student
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, date_of_birth')
    .eq('id', studentId)
    .single()

  // Fetch medical profile
  const { data: medicalRaw } = await supabase
    .from('student_medical_profiles')
    .select('*')
    .eq('student_id', studentId)
    .single()
  const medical = medicalRaw as Record<string, unknown>

  // Fetch allergies
  const { data: allergies } = await supabase
    .from('student_allergies')
    .select('*')
    .eq('student_id', studentId)
    .order('severity', { ascending: false })

  // Fetch medications
  const { data: medications } = await supabase
    .from('student_medications')
    .select('*')
    .eq('student_id', studentId)

  // Fetch immunizations
  const { data: immunizations } = await supabase
    .from('student_immunizations')
    .select('*')
    .eq('student_id', studentId)
    .order('administered_date', { ascending: false })

  // Fetch emergency contacts
  const { data: emergencyContacts } = await supabase
    .from('student_emergency_contacts')
    .select('*')
    .eq('student_id', studentId)
    .order('priority_order', { ascending: true })

  const hasLifeThreatening = (allergies ?? []).some(
    (a: Record<string, unknown>) => a.severity === 'life_threatening',
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Medical Profile</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {student?.first_name} {student?.last_name} | DOB: {student?.date_of_birth}
        </p>
      </div>

      {/* Life-threatening allergy banner */}
      {hasLifeThreatening && (
        <div className="rounded-[var(--radius)] border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)]/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[var(--color-destructive)]" />
            <div>
              <p className="text-sm font-bold text-[var(--color-destructive)]">
                LIFE-THREATENING ALLERGY
              </p>
              <p className="text-sm text-[var(--color-foreground)]">
                {(allergies ?? [])
                  .filter((a: Record<string, unknown>) => a.severity === 'life_threatening')
                  .map((a: Record<string, unknown>) => a.allergen)
                  .join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Allergies */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Allergies</h2>
            <span className="ml-auto rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
              {allergies?.length ?? 0}
            </span>
          </div>
          {(allergies ?? []).length === 0 ? (
            <div className="p-4 text-sm text-[var(--color-muted-foreground)] text-center">
              No allergies on file
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {(allergies ?? []).map((allergy: Record<string, unknown>) => (
                <div key={allergy.id as string} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {allergy.allergen as string}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        allergy.severity === 'life_threatening'
                          ? 'bg-[var(--color-destructive)] text-white'
                          : allergy.severity === 'severe'
                            ? 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'
                            : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                      }`}
                    >
                      {(allergy.severity as string).replace('_', ' ')}
                    </span>
                  </div>
                  {allergy.treatment_protocol ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Treatment: {String(allergy.treatment_protocol)}
                    </p>
                  ) : null}
                  {allergy.epipen_on_site ? (
                    <p className="text-xs font-medium text-[var(--color-destructive)] mt-0.5">
                      EpiPen on site
                      {allergy.medication_location
                        ? ` - ${String(allergy.medication_location)}`
                        : ''}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical Info */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
            <Heart className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              Medical Information
            </h2>
          </div>
          <div className="p-4 space-y-3 text-sm">
            {medical ? (
              <>
                {Boolean(medical.blood_type) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Blood type</span>
                    <span className="font-medium text-[var(--color-foreground)]">
                      {String(medical.blood_type)}
                    </span>
                  </div>
                )}
                {Boolean(medical.primary_physician_name) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Physician</span>
                    <span className="font-medium text-[var(--color-foreground)]">
                      {String(medical.primary_physician_name)}
                    </span>
                  </div>
                )}
                {Boolean(medical.primary_physician_phone) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Physician phone</span>
                    <span className="font-medium text-[var(--color-foreground)]">
                      {String(medical.primary_physician_phone)}
                    </span>
                  </div>
                )}
                {Boolean(medical.insurance_provider) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Insurance</span>
                    <span className="font-medium text-[var(--color-foreground)]">
                      {String(medical.insurance_provider)}
                    </span>
                  </div>
                )}
                {Boolean(medical.special_needs_notes) && (
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Special needs</span>
                    <p className="mt-0.5 text-[var(--color-foreground)]">
                      {String(medical.special_needs_notes)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--color-muted-foreground)] text-center">
                No medical profile on file
              </p>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
            <Pill className="h-4 w-4 text-[var(--color-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Medications</h2>
          </div>
          {(medications ?? []).length === 0 ? (
            <div className="p-4 text-sm text-[var(--color-muted-foreground)] text-center">
              No medications on file
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {(medications ?? []).map((med: Record<string, unknown>) => (
                <div key={med.id as string} className="p-3">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {med.medication_name as string}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {med.dosage as string} - {med.frequency as string}
                  </p>
                  {med.administration_instructions ? (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {med.administration_instructions as string}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Immunizations */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
            <Syringe className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Immunizations</h2>
          </div>
          {(immunizations ?? []).length === 0 ? (
            <div className="p-4 text-sm text-[var(--color-muted-foreground)] text-center">
              No immunizations on file
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {(immunizations ?? []).map((imm: Record<string, unknown>) => (
                <div key={imm.id as string} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {imm.vaccine_name as string}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Dose {imm.dose_number as number} | {imm.administered_date as string}
                    </p>
                  </div>
                  {imm.verified_at ? (
                    <span className="text-xs text-[var(--color-primary)]">Verified</span>
                  ) : (
                    <span className="text-xs text-[var(--color-warning)]">Unverified</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
          <Phone className="h-4 w-4 text-[var(--color-destructive)]" />
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Emergency Contacts
          </h2>
        </div>
        {(emergencyContacts ?? []).length === 0 ? (
          <div className="p-4 text-sm text-[var(--color-muted-foreground)] text-center">
            No emergency contacts on file
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(emergencyContacts ?? []).map((contact: Record<string, unknown>) => (
              <div key={contact.id as string} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {contact.name as string}
                    <span className="ml-2 text-xs font-normal text-[var(--color-muted-foreground)]">
                      ({contact.relationship as string})
                    </span>
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {contact.phone_primary as string}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contact.can_pickup ? (
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] text-[var(--color-primary)]">
                      Can pickup
                    </span>
                  ) : null}
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    Priority: {contact.priority_order as number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
