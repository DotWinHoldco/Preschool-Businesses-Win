// @anchor: cca.family.authorized-pickups
// List of authorized pickups with photo, verification status, and validity dates.
// Child safety critical — surfaces at check-out and on student detail.

import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AuthorizedPickupData {
  id: string
  person_name: string
  relationship: string
  phone?: string | null
  photo_path?: string | null
  photo_verified?: boolean
  government_id_type?: string | null
  government_id_verified_at?: string | null
  valid_from?: string | null
  valid_to?: string | null
  notes?: string | null
}

export interface AuthorizedPickupListProps {
  pickups: AuthorizedPickupData[]
  studentName: string
  className?: string
}

function isExpired(validTo: string | null | undefined): boolean {
  if (!validTo) return false
  return new Date(validTo) < new Date()
}

function isActive(pickup: AuthorizedPickupData): boolean {
  if (pickup.valid_to && isExpired(pickup.valid_to)) return false
  if (pickup.valid_from && new Date(pickup.valid_from) > new Date()) return false
  return true
}

export function AuthorizedPickupList({
  pickups,
  studentName,
  className,
}: AuthorizedPickupListProps) {
  const active = pickups.filter(isActive)
  const inactive = pickups.filter((p) => !isActive(p))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Authorized Pickups
          <Badge variant="outline" size="sm">
            {active.length} active
          </Badge>
        </CardTitle>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          People authorized to pick up {studentName}
        </p>
      </CardHeader>
      <CardContent>
        {pickups.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No authorized pickups on file. Only parents/guardians linked to
            this student&apos;s family can check out.
          </p>
        ) : (
          <div className="space-y-3">
            {[...active, ...inactive].map((pickup) => {
              const expired = !isActive(pickup)
              return (
                <div
                  key={pickup.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    expired
                      ? 'border-[var(--color-border)] bg-[var(--color-muted)]/30 opacity-60'
                      : 'border-[var(--color-border)]',
                  )}
                >
                  {/* Photo or initials */}
                  {pickup.photo_path ? (
                    <img
                      src={pickup.photo_path}
                      alt={pickup.person_name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-semibold text-[var(--color-muted-foreground)]">
                      {pickup.person_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        {pickup.person_name}
                      </p>
                      {expired && (
                        <Badge variant="danger" size="sm">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {pickup.relationship}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1">
                      {pickup.government_id_verified_at ? (
                        <Badge variant="success" size="sm">
                          ID Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          ID Not Verified
                        </Badge>
                      )}
                      {pickup.photo_verified && (
                        <Badge variant="success" size="sm">
                          Photo on file
                        </Badge>
                      )}
                    </div>

                    {pickup.phone && (
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {pickup.phone}
                      </p>
                    )}

                    {(pickup.valid_from || pickup.valid_to) && (
                      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                        {pickup.valid_from && (
                          <span>
                            From{' '}
                            {new Date(pickup.valid_from).toLocaleDateString()}
                          </span>
                        )}
                        {pickup.valid_to && (
                          <span>
                            {pickup.valid_from ? ' — ' : 'Until '}
                            {new Date(pickup.valid_to).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    )}

                    {pickup.notes && (
                      <p className="mt-1 text-xs italic text-[var(--color-muted-foreground)]">
                        {pickup.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
