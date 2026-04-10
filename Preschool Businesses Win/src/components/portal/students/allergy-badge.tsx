// @anchor: cca.medical.allergy-badge
// Color-coded allergy severity badge.
// Red = life-threatening, orange = severe, yellow = moderate, gray = mild.
// Surfaces allergy info at every critical touchpoint per CCA_BUILD_BRIEF.md.

import { cn } from '@/lib/cn'

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening'

export interface AllergyBadgeProps {
  allergen: string
  severity: AllergySeverity
  showIcon?: boolean
  className?: string
}

const severityConfig: Record<
  AllergySeverity,
  { bg: string; text: string; label: string }
> = {
  life_threatening: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'LIFE-THREATENING',
  },
  severe: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'SEVERE',
  },
  moderate: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'MODERATE',
  },
  mild: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'MILD',
  },
}

export function AllergyBadge({
  allergen,
  severity,
  showIcon = true,
  className,
}: AllergyBadgeProps) {
  const config = severityConfig[severity]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none whitespace-nowrap',
        config.bg,
        config.text,
        className,
      )}
      title={`${allergen} — ${config.label}`}
    >
      {showIcon && (severity === 'life_threatening' || severity === 'severe') && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}
      {allergen}
    </span>
  )
}
