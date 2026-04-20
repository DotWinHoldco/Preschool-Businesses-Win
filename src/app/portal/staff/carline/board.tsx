'use client'

// @anchor: cca.carline.board
// Carline queue board — shows who is waiting, which children to ready, release button.
// See CCA_BUILD_BRIEF.md §30

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Car, Check, Clock, RefreshCw, User, Users } from 'lucide-react'

interface QueueEntry {
  id: string
  position: number
  pickup_person_name: string
  arrived_at: string
  status: 'waiting' | 'called' | 'released'
  students: Array<{
    id: string
    name: string
    classroom_name: string | null
  }>
}

export function CarlineBoard() {
  // TODO: Replace with real-time Supabase subscription to carline_queue_entries
  const [entries, setEntries] = useState<QueueEntry[]>([
    {
      id: '1',
      position: 1,
      pickup_person_name: 'Sarah Martinez',
      arrived_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'waiting',
      students: [
        { id: 's1', name: 'Sophia Martinez', classroom_name: 'Butterfly Room' },
        { id: 's2', name: 'Lucas Martinez', classroom_name: 'Sunshine Room' },
      ],
    },
    {
      id: '2',
      position: 2,
      pickup_person_name: 'James Thompson',
      arrived_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      status: 'waiting',
      students: [
        { id: 's3', name: 'Emma Thompson', classroom_name: 'Butterfly Room' },
      ],
    },
  ])
  const [releasing, setReleasing] = useState<string | null>(null)

  const handleRelease = useCallback((entryId: string) => {
    setReleasing(entryId)
    // Optimistic local state update — mark as released immediately
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, status: 'released' as const } : e,
      ),
    )
    // Clear the loading indicator on next tick
    requestAnimationFrame(() => setReleasing(null))
    // TODO: Call server action to persist release (triggers check-out)
  }, [])

  const handleRefresh = useCallback(() => {
    // TODO: Manually refetch from Supabase
  }, [])

  const waitingEntries = entries.filter((e) => e.status !== 'released')
  const releasedEntries = entries.filter((e) => e.status === 'released')

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getWaitMinutes = (iso: string) => {
    return Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Carline Queue
          </h1>
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            {waitingEntries.length} {waitingEntries.length === 1 ? 'family' : 'families'} waiting
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Active queue */}
      {waitingEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Car className="h-12 w-12 text-[var(--color-muted-foreground)]" />
          <p className="text-lg text-[var(--color-muted-foreground)]">
            No families in the pickup queue
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {waitingEntries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'rounded-[var(--radius,0.75rem)] border bg-[var(--color-card)] p-4',
                entry.status === 'called'
                  ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                  : 'border-[var(--color-border)]',
              )}
            >
              <div className="flex items-start gap-4">
                {/* Position number */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-bold text-[var(--color-primary-foreground)]">
                  {entry.position}
                </div>

                <div className="flex-1">
                  {/* Pickup person */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <span className="font-semibold text-[var(--color-foreground)]">
                      {entry.pickup_person_name}
                    </span>
                  </div>

                  {/* Students to prepare */}
                  <div className="mt-2 flex flex-col gap-1">
                    {entry.students.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        <Users className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                        <span className="text-[var(--color-foreground)]">{s.name}</span>
                        {s.classroom_name && (
                          <Badge variant="outline" size="sm">
                            {s.classroom_name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Arrival time + wait */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <Clock className="h-3 w-3" />
                    <span>
                      Arrived {formatTime(entry.arrived_at)} ({getWaitMinutes(entry.arrived_at)} min ago)
                    </span>
                  </div>
                </div>

                {/* Release button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRelease(entry.id)}
                  loading={releasing === entry.id}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                  Release
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Released (completed) section */}
      {releasedEntries.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Released Today
          </h2>
          <div className="flex flex-col gap-2">
            {releasedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 opacity-60"
              >
                <Check className="h-5 w-5 text-[var(--color-success)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {entry.pickup_person_name}
                  </span>
                  <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                    {entry.students.map((s) => s.name).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
