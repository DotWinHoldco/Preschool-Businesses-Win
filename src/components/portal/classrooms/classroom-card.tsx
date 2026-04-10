// @anchor: cca.classroom.card
// Classroom card with name, age range, capacity gauge, and ratio badge.
// Used in classroom list and dashboard.

import { cn } from '@/lib/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CapacityGauge } from './capacity-gauge'
import { RatioBadge } from './ratio-badge'

export interface ClassroomCardData {
  id: string
  name: string
  slug: string
  age_range_min_months: number
  age_range_max_months: number
  capacity: number
  current_enrollment: number
  ratio_required: number
  staff_count: number
  students_present: number
  room_number?: string | null
  status: string
  lead_teacher_name?: string | null
}

export interface ClassroomCardProps {
  classroom: ClassroomCardData
  href?: string
  className?: string
}

function formatAgeRange(minMonths: number, maxMonths: number): string {
  const formatAge = (months: number): string => {
    if (months < 12) return `${months}mo`
    if (months < 24) return `${Math.floor(months / 12)}y ${months % 12}mo`
    return `${Math.floor(months / 12)}y`
  }
  return `${formatAge(minMonths)} – ${formatAge(maxMonths)}`
}

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  inactive: 'outline',
  summer_only: 'warning',
}

export function ClassroomCard({
  classroom,
  href,
  className,
}: ClassroomCardProps) {
  const content = (
    <Card className={cn('transition-colors', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{classroom.name}</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {formatAgeRange(
                classroom.age_range_min_months,
                classroom.age_range_max_months,
              )}
              {classroom.room_number && ` · Room ${classroom.room_number}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={statusVariant[classroom.status] || 'outline'}
              size="sm"
            >
              {classroom.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CapacityGauge
          current={classroom.current_enrollment}
          max={classroom.capacity}
        />

        <div className="flex items-center justify-between">
          <RatioBadge
            studentsPresent={classroom.students_present}
            staffPresent={classroom.staff_count}
            ratioRequired={classroom.ratio_required}
          />
          {classroom.lead_teacher_name && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {classroom.lead_teacher_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <a
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius,0.75rem)]"
      >
        {content}
      </a>
    )
  }

  return content
}
