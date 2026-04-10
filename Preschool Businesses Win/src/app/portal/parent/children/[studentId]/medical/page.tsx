// @anchor: cca.medical.parent-page

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

  const mockMedical = {
    childName: 'Sophia Martinez',
    bloodType: 'A+',
    physician: 'Dr. Rebecca Torres',
    physicianPhone: '(555) 456-7890',
    insuranceProvider: 'Blue Cross Blue Shield',
    policyNumber: 'BCB-12345678',
    specialNeeds: null,
    emergencyActionPlan: true,
  }

  const mockAllergies = [
    { allergen: 'Peanuts', severity: 'life_threatening', reaction: 'Anaphylaxis', treatment: 'EpiPen Jr (in nurse office)', epipen: true },
    { allergen: 'Tree Nuts', severity: 'moderate', reaction: 'Hives, swelling', treatment: 'Benadryl', epipen: false },
  ]

  const mockMedications = [
    { name: 'EpiPen Jr', dosage: '0.15mg', frequency: 'As needed', instructions: 'Administer to outer thigh in case of anaphylaxis. Call 911 immediately.', refrigeration: false },
  ]

  const mockImmunizations = [
    { vaccine: 'DTaP', dose: '4th dose', date: 'March 2025', status: 'current' },
    { vaccine: 'IPV (Polio)', dose: '3rd dose', date: 'March 2025', status: 'current' },
    { vaccine: 'MMR', dose: '1st dose', date: 'July 2023', status: 'current' },
    { vaccine: 'Varicella', dose: '1st dose', date: 'July 2023', status: 'current' },
    { vaccine: 'Hep A', dose: '2nd dose', date: 'January 2024', status: 'current' },
    { vaccine: 'Hep B', dose: '3rd dose', date: 'January 2023', status: 'current' },
    { vaccine: 'Flu', dose: 'Annual', date: 'October 2025', status: 'due_soon' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Medical Information — {mockMedical.childName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Keep this information up to date. It is displayed to staff during check-in and meal service.
        </p>
      </div>

      {/* Allergies - prominent */}
      {mockAllergies.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ border: '2px solid var(--color-destructive)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-destructive)' }}>
            Allergies
          </h2>
          <div className="mt-3 space-y-3">
            {mockAllergies.map((a) => (
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
                  {a.epipen && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-destructive)', color: 'var(--color-primary-foreground)' }}>
                      EpiPen On-Site
                    </span>
                  )}
                </div>
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt style={{ color: 'var(--color-muted-foreground)' }}>Reaction</dt>
                    <dd style={{ color: 'var(--color-foreground)' }}>{a.reaction}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--color-muted-foreground)' }}>Treatment</dt>
                    <dd style={{ color: 'var(--color-foreground)' }}>{a.treatment}</dd>
                  </div>
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

      {/* Medical profile */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Medical Profile
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ['Blood Type', mockMedical.bloodType],
            ['Primary Physician', mockMedical.physician],
            ['Physician Phone', mockMedical.physicianPhone],
            ['Insurance', mockMedical.insuranceProvider],
            ['Policy Number', mockMedical.policyNumber],
            ['Emergency Action Plan', mockMedical.emergencyActionPlan ? 'On file' : 'Not uploaded'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
              <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
            </div>
          ))}
        </dl>
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
        {mockMedications.map((med) => (
          <div key={med.name} className="mt-3 rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{med.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {med.dosage} &middot; {med.frequency}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-foreground)' }}>{med.instructions}</p>
          </div>
        ))}
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
              {mockImmunizations.map((imm) => (
                <tr key={`${imm.vaccine}-${imm.dose}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
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
                      {imm.status === 'current' ? 'Current' : 'Due Soon'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
