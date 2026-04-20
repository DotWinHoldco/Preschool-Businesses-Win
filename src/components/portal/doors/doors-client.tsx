'use client'

// @anchor: cca.door.doors-client
// Door control grid with unlock/hold actions and event log

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DoorOpen,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Timer,
  LockOpen,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DoorStatus = 'online' | 'offline' | 'locked' | 'unlocked'

interface DoorData {
  id: string
  name: string
  status: DoorStatus
  lastEvent: string
  heldUnlocked: boolean
}

interface DoorEvent {
  id: string
  doorName: string
  action: string
  actor: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const INITIAL_DOORS: DoorData[] = [
  {
    id: 'd1',
    name: 'Main Entrance',
    status: 'locked',
    lastEvent: '2026-04-20T08:02:00',
    heldUnlocked: false,
  },
  {
    id: 'd2',
    name: 'Side Door',
    status: 'locked',
    lastEvent: '2026-04-20T07:45:00',
    heldUnlocked: false,
  },
  {
    id: 'd3',
    name: 'Back Gate',
    status: 'offline',
    lastEvent: '2026-04-19T17:30:00',
    heldUnlocked: false,
  },
  {
    id: 'd4',
    name: 'Staff Entrance',
    status: 'locked',
    lastEvent: '2026-04-20T07:55:00',
    heldUnlocked: false,
  },
]

const INITIAL_EVENTS: DoorEvent[] = [
  { id: 'e1', doorName: 'Main Entrance', action: 'unlocked', actor: 'Jane Smith', timestamp: '8:02 AM' },
  { id: 'e2', doorName: 'Main Entrance', action: 'locked', actor: 'system', timestamp: '8:02 AM' },
  { id: 'e3', doorName: 'Staff Entrance', action: 'unlocked', actor: 'Tom Wilson', timestamp: '7:55 AM' },
  { id: 'e4', doorName: 'Staff Entrance', action: 'locked', actor: 'system', timestamp: '7:55 AM' },
  { id: 'e5', doorName: 'Side Door', action: 'unlocked', actor: 'Maria Garcia', timestamp: '7:45 AM' },
  { id: 'e6', doorName: 'Side Door', action: 'locked', actor: 'system', timestamp: '7:45 AM' },
  { id: 'e7', doorName: 'Back Gate', action: 'went offline', actor: 'system', timestamp: '5:30 PM (yesterday)' },
  { id: 'e8', doorName: 'Main Entrance', action: 'held unlocked', actor: 'Sarah Johnson', timestamp: '3:00 PM (yesterday)' },
  { id: 'e9', doorName: 'Main Entrance', action: 'locked', actor: 'Sarah Johnson', timestamp: '3:30 PM (yesterday)' },
  { id: 'e10', doorName: 'Staff Entrance', action: 'unlocked', actor: 'Jane Smith', timestamp: '7:00 AM (yesterday)' },
]

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  DoorStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'outline' }
> = {
  locked: { label: 'Locked', variant: 'success' },
  unlocked: { label: 'Unlocked', variant: 'warning' },
  online: { label: 'Online', variant: 'success' },
  offline: { label: 'Offline', variant: 'danger' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DoorsClient() {
  const [doors, setDoors] = useState<DoorData[]>(INITIAL_DOORS)
  const [events, setEvents] = useState<DoorEvent[]>(INITIAL_EVENTS)
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const addEvent = useCallback(
    (doorName: string, action: string) => {
      const now = new Date()
      const timestamp = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const evt: DoorEvent = {
        id: crypto.randomUUID(),
        doorName,
        action,
        actor: 'Admin',
        timestamp,
      }
      setEvents((prev) => [evt, ...prev].slice(0, 10))
    },
    [],
  )

  const handleUnlock10s = useCallback(
    (doorId: string) => {
      const door = doors.find((d) => d.id === doorId)
      if (!door || door.status === 'offline') return

      // Clear existing timer if any
      const existing = timerRefs.current.get(doorId)
      if (existing) clearTimeout(existing)

      setDoors((prev) =>
        prev.map((d) =>
          d.id === doorId
            ? {
                ...d,
                status: 'unlocked' as DoorStatus,
                lastEvent: new Date().toISOString(),
                heldUnlocked: false,
              }
            : d,
        ),
      )
      addEvent(door.name, 'unlocked (10s)')

      const timer = setTimeout(() => {
        setDoors((prev) =>
          prev.map((d) =>
            d.id === doorId && !d.heldUnlocked
              ? {
                  ...d,
                  status: 'locked' as DoorStatus,
                  lastEvent: new Date().toISOString(),
                }
              : d,
          ),
        )
        addEvent(door.name, 'auto-locked')
        timerRefs.current.delete(doorId)
      }, 10000)

      timerRefs.current.set(doorId, timer)
    },
    [doors, addEvent],
  )

  const handleHoldUnlocked = useCallback(
    (doorId: string) => {
      const door = doors.find((d) => d.id === doorId)
      if (!door || door.status === 'offline') return

      // Clear any pending auto-lock
      const existing = timerRefs.current.get(doorId)
      if (existing) {
        clearTimeout(existing)
        timerRefs.current.delete(doorId)
      }

      if (door.heldUnlocked) {
        // Re-lock
        setDoors((prev) =>
          prev.map((d) =>
            d.id === doorId
              ? {
                  ...d,
                  status: 'locked' as DoorStatus,
                  heldUnlocked: false,
                  lastEvent: new Date().toISOString(),
                }
              : d,
          ),
        )
        addEvent(door.name, 'locked')
      } else {
        // Hold unlocked
        setDoors((prev) =>
          prev.map((d) =>
            d.id === doorId
              ? {
                  ...d,
                  status: 'unlocked' as DoorStatus,
                  heldUnlocked: true,
                  lastEvent: new Date().toISOString(),
                }
              : d,
          ),
        )
        addEvent(door.name, 'held unlocked')
      }
    },
    [doors, addEvent],
  )

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Door grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {doors.map((door) => {
          const config = STATUS_CONFIG[door.status]
          const isOffline = door.status === 'offline'
          const isUnlocked = door.status === 'unlocked'
          return (
            <Card
              key={door.id}
              className={cn(isOffline && 'opacity-60')}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        isOffline
                          ? 'bg-[var(--color-muted)]'
                          : isUnlocked
                            ? 'bg-[var(--color-warning)]/10'
                            : 'bg-[var(--color-success)]/10',
                      )}
                    >
                      {isOffline ? (
                        <WifiOff
                          size={20}
                          className="text-[var(--color-muted-foreground)]"
                        />
                      ) : isUnlocked ? (
                        <Unlock
                          size={20}
                          className="text-[var(--color-warning)]"
                        />
                      ) : (
                        <Lock
                          size={20}
                          className="text-[var(--color-success)]"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {door.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Last event: {formatTimestamp(door.lastEvent)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={config.variant}>
                    {door.heldUnlocked ? 'Held Open' : config.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isOffline}
                    onClick={() => handleUnlock10s(door.id)}
                    className="flex-1"
                  >
                    <Timer size={16} />
                    Unlock (10s)
                  </Button>
                  <Button
                    size="sm"
                    variant={door.heldUnlocked ? 'danger' : 'ghost'}
                    disabled={isOffline}
                    onClick={() => handleHoldUnlocked(door.id)}
                    className="flex-1"
                  >
                    {door.heldUnlocked ? (
                      <>
                        <Lock size={16} />
                        Lock
                      </>
                    ) : (
                      <>
                        <LockOpen size={16} />
                        Hold Unlocked
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Event log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText size={18} />
            Event Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-3 rounded-[var(--radius,0.75rem)] px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors"
              >
                <span className="shrink-0 font-medium text-[var(--color-foreground)]">
                  {evt.doorName}
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  {evt.action} by {evt.actor}
                </span>
                <span className="ml-auto shrink-0 text-xs text-[var(--color-muted-foreground)]">
                  {evt.timestamp}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No events yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
