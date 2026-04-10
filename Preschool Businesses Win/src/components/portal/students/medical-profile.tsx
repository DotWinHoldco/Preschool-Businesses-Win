// @anchor: cca.medical.profile-display
// Medical profile display section for student detail page.
// Shows physician, insurance, allergies, medications, and emergency action plan.

import { cn } from '@/lib/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AllergyBadge, type AllergySeverity } from './allergy-badge'

export interface MedicalProfileData {
  blood_type?: string | null
  primary_physician_name?: string | null
  primary_physician_phone?: string | null
  insurance_provider?: string | null
  insurance_policy_number?: string | null
  special_needs_notes?: string | null
  emergency_action_plan_path?: string | null
}

export interface AllergyData {
  id: string
  allergen: string
  severity: AllergySeverity
  reaction_description?: string | null
  treatment_protocol?: string | null
  medication_name?: string | null
  medication_location?: string | null
  epipen_on_site: boolean
  notes?: string | null
}

export interface MedicalProfileProps {
  profile: MedicalProfileData | null
  allergies: AllergyData[]
  className?: string
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-sm font-medium text-[var(--color-muted-foreground)] sm:w-48 sm:shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-[var(--color-foreground)]">{value}</dd>
    </div>
  )
}

export function MedicalProfile({
  profile,
  allergies,
  className,
}: MedicalProfileProps) {
  const hasLifeThreatening = allergies.some(
    (a) => a.severity === 'life_threatening',
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Life-threatening allergy banner */}
      {hasLifeThreatening && (
        <div
          className="flex items-center gap-3 rounded-[var(--radius,0.75rem)] border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <svg
            className="h-6 w-6 shrink-0 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Life-Threatening Allergy
            </p>
            <p className="text-sm text-red-700">
              {allergies
                .filter((a) => a.severity === 'life_threatening')
                .map((a) => a.allergen)
                .join(', ')}
              {allergies.some(
                (a) =>
                  a.severity === 'life_threatening' && a.epipen_on_site,
              ) && ' — EpiPen on site'}
            </p>
          </div>
        </div>
      )}

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Allergies
            {allergies.length > 0 && (
              <Badge variant="danger" size="sm">
                {allergies.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allergies.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No known allergies
            </p>
          ) : (
            <div className="space-y-4">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className="rounded-lg border border-[var(--color-border)] p-3"
                >
                  <div className="flex items-center gap-2">
                    <AllergyBadge
                      allergen={allergy.allergen}
                      severity={allergy.severity}
                    />
                    {allergy.epipen_on_site && (
                      <Badge variant="danger" size="sm">
                        EpiPen on site
                      </Badge>
                    )}
                  </div>
                  <dl className="mt-2 space-y-1">
                    <InfoRow
                      label="Reaction"
                      value={allergy.reaction_description}
                    />
                    <InfoRow
                      label="Treatment"
                      value={allergy.treatment_protocol}
                    />
                    <InfoRow
                      label="Medication"
                      value={allergy.medication_name}
                    />
                    <InfoRow
                      label="Location"
                      value={allergy.medication_location}
                    />
                    <InfoRow label="Notes" value={allergy.notes} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical info */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No medical profile on file
            </p>
          ) : (
            <dl className="space-y-2">
              <InfoRow label="Blood type" value={profile.blood_type} />
              <InfoRow
                label="Primary physician"
                value={profile.primary_physician_name}
              />
              <InfoRow
                label="Physician phone"
                value={profile.primary_physician_phone}
              />
              <InfoRow
                label="Insurance provider"
                value={profile.insurance_provider}
              />
              <InfoRow
                label="Policy number"
                value={profile.insurance_policy_number}
              />
              <InfoRow
                label="Special needs"
                value={profile.special_needs_notes}
              />
              {profile.emergency_action_plan_path && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="text-sm font-medium text-[var(--color-muted-foreground)] sm:w-48 sm:shrink-0">
                    Emergency plan
                  </dt>
                  <dd>
                    <a
                      href={profile.emergency_action_plan_path}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View document
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
