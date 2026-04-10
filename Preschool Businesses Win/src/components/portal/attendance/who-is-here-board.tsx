'use client'

// @anchor: cca.attendance.who-is-here
// Real-time board showing all currently checked-in students per classroom.
// Student photo, name, allergy badges, check-in time, who dropped off.
// Absent students shown dimmed. Pull-to-refresh on mobile.
// See CCA_BUILD_BRIEF.md §8

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, RefreshCw, User, UserX } from 'lucide-react'

export interface BoardStudent {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  photo_path: string | null
  checked_in: boolean
  check_in_time: string | null
  dropped_off_by: string | null
  allergies: Array<{
    allergen: string
    severity: string
  }>
}

interface WhoIsHereBoardProps {
  classroomName: string
  students: BoardStudent[]
  onRefresh?: () => Promise<void>
  className?: string
}

export function WhoIsHereBoard({
  classroomName,
  students,
  onRefresh,
  className,
}: WhoIsHereBoardProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  const checkedIn = students.filter((s) => s.checked_in)
  const absent = students.filter((s) => !s.checked_in)

  const displayName = (s: BoardStudent) =>
    s.preferred_name ?? s.first_name

  const formatTime = (iso: string | null) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getSeverityVariant = (severity: string): 'danger' | 'warning' | 'outline' => {
    if (severity === 'life_threatening') return 'danger'
    if (severity === 'severe') return 'danger'
    if (severity === 'moderate') return 'warning'
    return 'outline'
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            {classroomName}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {checkedIn.length} present / {students.length} enrolled
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Checked-in students */}
      {checkedIn.length > 0 && (
        <div className="flex flex-col gap-2">
          {checkedIn.map((s) => (
            <div
              key={s.id}
              className={cn(
                'flex items-center gap-4 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-3',
                'transition-colors',
              )}
            >
              {/* Avatar */}
              {s.photo_path ? (
                <img
                  src={s.photo_path}
                  alt={displayName(s)}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                  <User className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              )}

              {/* Name + details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-foreground)] truncate">
                    {displayName(s)} {s.last_name}
                  </span>
                  {/* Allergy badges */}
                  {s.allergies.map((a, idx) => (
                    <Badge
                      key={idx}
                      variant={getSeverityVariant(a.severity)}
                      size="sm"
                    >
                      {a.severity === 'life_threatening' && (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      {a.allergen}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                  {s.check_in_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(s.check_in_time)}
                    </span>
                  )}
                  {s.dropped_off_by && (
                    <span>
                      by {s.dropped_off_by}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Absent students */}
      {absent.length > 0 && (
        <div className="mt-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Not Checked In ({absent.length})
          </h3>
          <div className="flex flex-col gap-2">
            {absent.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-4 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3',
                  'opacity-60',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)]">
                  <UserX className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-[var(--color-foreground)]">
                    {displayName(s)} {s.last_name}
                  </span>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Absent -- no check-in today
                  </p>
                </div>
                {/* Allergy badges even when absent */}
                {s.allergies.length > 0 && (
                  <div className="flex gap-1">
                    {s.allergies.map((a, idx) => (
                      <Badge
                        key={idx}
                        variant={getSeverityVariant(a.severity)}
                        size="sm"
                      >
                        {a.allergen}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
