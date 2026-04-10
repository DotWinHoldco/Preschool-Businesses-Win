// @anchor: cca.student.card
// Compact student card with photo, name, age, allergy badges, and classroom.
// Used in student lists, classroom rosters, and search results.

import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AllergyBadge, type AllergySeverity } from './allergy-badge'

export interface StudentCardData {
  id: string
  first_name: string
  last_name: string
  preferred_name?: string | null
  date_of_birth: string
  photo_path?: string | null
  enrollment_status: string
  classroom_name?: string | null
  allergies?: Array<{
    allergen: string
    severity: AllergySeverity
  }>
}

export interface StudentCardProps {
  student: StudentCardData
  href?: string
  className?: string
}

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months}mo`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`
}

const statusVariant: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'outline'> = {
  active: 'success',
  enrolled: 'default',
  applied: 'outline',
  waitlisted: 'warning',
  withdrawn: 'danger',
  graduated: 'secondary' as 'default',
}

export function StudentCard({ student, href, className }: StudentCardProps) {
  const age = calculateAge(student.date_of_birth)
  const displayName = student.preferred_name || student.first_name
  const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
  const hasLifeThreatening = student.allergies?.some(
    (a) => a.severity === 'life_threatening',
  )

  const content = (
    <Card
      className={cn(
        'flex items-start gap-4 p-4 transition-colors',
        hasLifeThreatening && 'border-red-200',
        className,
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {student.photo_path ? (
          <img
            src={student.photo_path}
            alt={`${displayName} ${student.last_name}`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-semibold text-[var(--color-muted-foreground)]">
            {initials}
          </div>
        )}
        {hasLifeThreatening && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
            title="Life-threatening allergy"
            aria-label="Life-threatening allergy"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)]">
            {displayName} {student.last_name}
          </h3>
          <Badge
            variant={statusVariant[student.enrollment_status] || 'outline'}
            size="sm"
          >
            {student.enrollment_status}
          </Badge>
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span>{age}</span>
          {student.classroom_name && (
            <>
              <span aria-hidden="true">·</span>
              <span>{student.classroom_name}</span>
            </>
          )}
        </div>

        {/* Allergy badges */}
        {student.allergies && student.allergies.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {student.allergies.map((allergy) => (
              <AllergyBadge
                key={allergy.allergen}
                allergen={allergy.allergen}
                severity={allergy.severity}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  )

  if (href) {
    return (
      <a href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius,0.75rem)]">
        {content}
      </a>
    )
  }

  return content
}
