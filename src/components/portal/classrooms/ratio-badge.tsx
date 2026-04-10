// @anchor: cca.classroom.ratio-badge
// Shows current ratio vs required (green/yellow/red).
// Uses Texas DFPS Chapter 746 ratios. Non-compliance is red and critical.

import { cn } from '@/lib/cn'

export interface RatioBadgeProps {
  studentsPresent: number
  staffPresent: number
  ratioRequired: number
  className?: string
}

export function RatioBadge({
  studentsPresent,
  staffPresent,
  ratioRequired,
  className,
}: RatioBadgeProps) {
  const actualRatio = staffPresent > 0 ? studentsPresent / staffPresent : Infinity
  const compliant = actualRatio <= ratioRequired
  const nearLimit = actualRatio > ratioRequired * 0.8 && compliant

  let status: 'green' | 'yellow' | 'red'
  if (!compliant) {
    status = 'red'
  } else if (nearLimit) {
    status = 'yellow'
  } else {
    status = 'green'
  }

  const statusStyles = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }

  const statusIcon = {
    green: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    yellow: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    red: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  }

  const displayRatio = staffPresent > 0 ? `${studentsPresent}:${staffPresent}` : 'N/A'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
        statusStyles[status],
        className,
      )}
      title={`Ratio: ${displayRatio} (required: ${ratioRequired}:1)${!compliant ? ' — NON-COMPLIANT' : ''}`}
      role="status"
      aria-label={`Staff to student ratio: ${displayRatio}. Required: ${ratioRequired} to 1. ${compliant ? 'Compliant' : 'Non-compliant'}`}
    >
      {statusIcon[status]}
      <span>{displayRatio}</span>
      <span className="text-[10px] font-normal opacity-70">
        / {ratioRequired}:1
      </span>
    </span>
  )
}
