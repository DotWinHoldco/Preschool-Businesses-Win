// @anchor: cca.checkin.allergy-banner
// RED banner for life-threatening / severe allergies.
// Staff must tap "Acknowledged" before check-in proceeds.
// Server Component — no interactivity needed in the banner itself.
// The parent page wraps this in a client component for the ack button.
// See CCA_BUILD_BRIEF.md §7

import { cn } from '@/lib/cn'
import { AlertTriangle, Syringe } from 'lucide-react'

export interface AllergyInfo {
  allergen: string
  severity: string
  medication_location: string | null
  epipen_on_site: boolean
}

interface AllergyBannerProps {
  studentName: string
  allergies: AllergyInfo[]
  className?: string
}

export function AllergyBanner({ studentName, allergies, className }: AllergyBannerProps) {
  const lifeThreatening = allergies.filter(
    (a) => a.severity === 'life_threatening',
  )
  const severe = allergies.filter((a) => a.severity === 'severe')
  const critical = [...lifeThreatening, ...severe]

  if (critical.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 p-5',
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-destructive)]" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[var(--color-destructive)]">
            ALLERGY ALERT
          </h3>

          {critical.map((allergy, idx) => (
            <div
              key={idx}
              className={cn(
                'mt-3 rounded-lg bg-[var(--color-destructive)]/5 p-3',
                'border border-[var(--color-destructive)]/30',
              )}
            >
              <p className="font-bold text-[var(--color-foreground)]">
                {studentName} has a{' '}
                <span className="uppercase text-[var(--color-destructive)]">
                  {allergy.severity.replace('_', ' ')}
                </span>{' '}
                allergy to{' '}
                <span className="text-[var(--color-destructive)]">
                  {allergy.allergen}
                </span>
              </p>

              {allergy.epipen_on_site && (
                <div className="mt-2 flex items-center gap-2 text-[var(--color-foreground)]">
                  <Syringe className="h-4 w-4 text-[var(--color-destructive)]" />
                  <span className="text-sm font-semibold">
                    EpiPen is in:{' '}
                    {allergy.medication_location ?? 'Front office'}
                  </span>
                </div>
              )}

              {!allergy.epipen_on_site && allergy.medication_location && (
                <p className="mt-2 text-sm text-[var(--color-foreground)]">
                  Medication location: {allergy.medication_location}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
