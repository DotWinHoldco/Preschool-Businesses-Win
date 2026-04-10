'use client'

// @anchor: cca.staff.time-clock-widget
// Clock in/out widget with timer display for staff.

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { Clock, Play, Square, Coffee } from 'lucide-react'

interface TimeClockWidgetProps {
  userId: string
  userName: string
  activeEntry?: {
    id: string
    clock_in_at: string
    break_start_at?: string | null
    break_end_at?: string | null
  } | null
  className?: string
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function TimeClockWidget({
  userId,
  userName,
  activeEntry,
  className,
}: TimeClockWidgetProps) {
  const [elapsed, setElapsed] = useState(0)
  const isClockedIn = !!activeEntry
  const isOnBreak = !!activeEntry?.break_start_at && !activeEntry?.break_end_at

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0)
      return
    }

    const clockIn = new Date(activeEntry.clock_in_at).getTime()

    const tick = () => {
      setElapsed(Date.now() - clockIn)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activeEntry])

  const handleClockIn = useCallback(async () => {
    const fd = new FormData()
    fd.set('user_id', userId)
    fd.set('method', 'app')
    await fetch('/api/staff/clock-in', { method: 'POST', body: fd })
    window.location.reload()
  }, [userId])

  const handleClockOut = useCallback(async () => {
    if (!activeEntry) return
    const fd = new FormData()
    fd.set('time_entry_id', activeEntry.id)
    await fetch('/api/staff/clock-out', { method: 'POST', body: fd })
    window.location.reload()
  }, [activeEntry])

  const handleBreak = useCallback(async () => {
    if (!activeEntry) return
    const fd = new FormData()
    fd.set('time_entry_id', activeEntry.id)
    const endpoint = isOnBreak ? '/api/staff/end-break' : '/api/staff/start-break'
    await fetch(endpoint, { method: 'POST', body: fd })
    window.location.reload()
  }, [activeEntry, isOnBreak])

  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6',
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <Clock size={20} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Time Clock</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">{userName}</p>
        </div>
      </div>

      {/* Timer display */}
      <div className="mb-6 text-center">
        <div
          className={cn(
            'text-4xl font-mono font-bold tabular-nums',
            isClockedIn
              ? isOnBreak
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-success)]'
              : 'text-[var(--color-muted-foreground)]',
          )}
        >
          {formatElapsed(elapsed)}
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {isClockedIn
            ? isOnBreak
              ? 'On break'
              : 'Clocked in'
            : 'Not clocked in'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!isClockedIn ? (
          <button
            type="button"
            onClick={handleClockIn}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)]',
              'bg-[var(--color-success)] text-white px-4 py-3 text-sm font-semibold min-h-[48px]',
              'hover:brightness-110 transition-all',
            )}
          >
            <Play size={16} />
            Clock In
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBreak}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)]',
                'border border-[var(--color-border)] px-4 py-3 text-sm font-semibold min-h-[48px]',
                'hover:bg-[var(--color-muted)] transition-all',
                isOnBreak ? 'text-[var(--color-warning)]' : 'text-[var(--color-foreground)]',
              )}
            >
              <Coffee size={16} />
              {isOnBreak ? 'End Break' : 'Break'}
            </button>
            <button
              type="button"
              onClick={handleClockOut}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)]',
                'bg-[var(--color-destructive)] text-white px-4 py-3 text-sm font-semibold min-h-[48px]',
                'hover:brightness-110 transition-all',
              )}
            >
              <Square size={16} />
              Clock Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
