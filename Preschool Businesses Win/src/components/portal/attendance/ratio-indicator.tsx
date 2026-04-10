// @anchor: cca.attendance.ratio-indicator
// Shows staff-to-student ratio with compliance status.
// Uses Texas DFPS Chapter 746 numbers.
// Server Component — no client interactivity needed.
// See CCA_BUILD_BRIEF.md §8, §39

import { cn } from '@/lib/cn'
import { AlertTriangle, Check, Users } from 'lucide-react'

/**
 * Texas DFPS Chapter 746 ratio requirements.
 * Used as fallback when database lookup is not available.
 */
const DFPS_RATIOS: Array<{
  label: string
  ageMinMonths: number
  ageMaxMonths: number
  maxChildrenPerCaregiver: number
  maxGroupSize: number
}> = [
  { label: '0-11 months', ageMinMonths: 0, ageMaxMonths: 11, maxChildrenPerCaregiver: 4, maxGroupSize: 10 },
  { label: '12-17 months', ageMinMonths: 12, ageMaxMonths: 17, maxChildrenPerCaregiver: 5, maxGroupSize: 13 },
  { label: '18-23 months', ageMinMonths: 18, ageMaxMonths: 23, maxChildrenPerCaregiver: 9, maxGroupSize: 18 },
  { label: '24-35 months', ageMinMonths: 24, ageMaxMonths: 35, maxChildrenPerCaregiver: 11, maxGroupSize: 22 },
  { label: '3 years', ageMinMonths: 36, ageMaxMonths: 47, maxChildrenPerCaregiver: 15, maxGroupSize: 30 },
  { label: '4 years', ageMinMonths: 48, ageMaxMonths: 59, maxChildrenPerCaregiver: 18, maxGroupSize: 35 },
  { label: '5 years', ageMinMonths: 60, ageMaxMonths: 71, maxChildrenPerCaregiver: 22, maxGroupSize: 35 },
  { label: '6+ years', ageMinMonths: 72, ageMaxMonths: 999, maxChildrenPerCaregiver: 26, maxGroupSize: 35 },
]

interface RatioIndicatorProps {
  studentsPresent: number
  staffPresent: number
  /** Required ratio (max children per caregiver) — from classroom config or DFPS table */
  requiredRatio: number
  /** Optional: primary age group label for display */
  ageGroupLabel?: string
  className?: string
}

export function RatioIndicator({
  studentsPresent,
  staffPresent,
  requiredRatio,
  ageGroupLabel,
  className,
}: RatioIndicatorProps) {
  const actualRatio = staffPresent > 0 ? studentsPresent / staffPresent : studentsPresent > 0 ? Infinity : 0
  const isCompliant = actualRatio <= requiredRatio
  const actualRatioDisplay = staffPresent > 0 ? Math.round(actualRatio * 10) / 10 : 'N/A'

  // How many more staff needed (or surplus)
  const staffNeeded = Math.ceil(studentsPresent / requiredRatio)
  const staffSurplus = staffPresent - staffNeeded

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius,0.75rem)] border p-3',
        isCompliant
          ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
          : 'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5',
        className,
      )}
      role="status"
      aria-label={`Ratio ${isCompliant ? 'compliant' : 'violation'}: ${studentsPresent} students, ${staffPresent} staff`}
    >
      <Users
        className={cn(
          'h-5 w-5 shrink-0',
          isCompliant ? 'text-[var(--color-success)]' : 'text-[var(--color-destructive)]',
        )}
      />

      <div className="flex-1 text-sm">
        <span className="font-semibold text-[var(--color-foreground)]">
          {studentsPresent} students / {staffPresent} staff = {actualRatioDisplay}:1
        </span>
        <span className="mx-1.5 text-[var(--color-muted-foreground)]">
          (required: {requiredRatio}:1{ageGroupLabel ? ` for ${ageGroupLabel}` : ''})
        </span>
      </div>

      {isCompliant ? (
        <Check className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="h-5 w-5 text-[var(--color-destructive)]" />
          <span className="text-xs font-bold text-[var(--color-destructive)]">
            NEED {Math.abs(staffSurplus)} MORE STAFF
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Utility: look up the DFPS ratio for a given age in months.
 * For mixed-age classrooms, pass the youngest child's age
 * to get the most restrictive ratio.
 */
export function getDFPSRatio(ageMonths: number) {
  const match = DFPS_RATIOS.find(
    (r) => ageMonths >= r.ageMinMonths && ageMonths <= r.ageMaxMonths,
  )
  return match ?? DFPS_RATIOS[DFPS_RATIOS.length - 1]
}

export { DFPS_RATIOS }
