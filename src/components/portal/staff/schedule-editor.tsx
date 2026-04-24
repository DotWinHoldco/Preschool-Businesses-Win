'use client'

// @anchor: cca.staff.schedule-editor

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { upsertStaffSchedule } from '@/lib/actions/staff/admin-actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type Day = (typeof DAYS)[number]

export type ScheduleEntry = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  classroom_name?: string
}

export function ScheduleEditor({
  staffId,
  entries,
}: {
  staffId: string
  entries: ScheduleEntry[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState<Day>('monday')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [isWorking, setIsWorking] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const openAdd = () => {
    setDay('monday')
    setStartTime('09:00')
    setEndTime('17:00')
    setIsWorking(true)
    setErr(null)
    setOpen(true)
  }

  const openEdit = (e: ScheduleEntry) => {
    const dow = (DAYS as readonly string[]).includes(e.day_of_week)
      ? (e.day_of_week as Day)
      : 'monday'
    setDay(dow)
    setStartTime((e.start_time || '09:00').slice(0, 5))
    setEndTime((e.end_time || '17:00').slice(0, 5))
    setIsWorking(true)
    setErr(null)
    setOpen(true)
  }

  const submit = () => {
    setErr(null)
    startTransition(async () => {
      const res = await upsertStaffSchedule(staffId, day, startTime, endTime, isWorking)
      if (!res.ok) setErr(res.error ?? 'Failed')
      else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={openAdd}>
          + Add / Update Day
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No schedule entries.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-md p-3 text-sm"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="font-medium capitalize" style={{ color: 'var(--color-foreground)' }}>
                  {e.day_of_week}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {e.start_time} – {e.end_time}
                  {e.classroom_name ? ` · ${e.classroom_name}` : ''}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openEdit(e)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent title="Update Schedule" className="max-w-md">
          <DialogClose onClick={() => setOpen(false)} />
          <div className="space-y-3">
            <label className="block">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Day
              </span>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as Day)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm capitalize"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Start time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                  }}
                />
              </label>
              <label className="block">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  End time
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                  }}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isWorking}
                onChange={(e) => setIsWorking(e.target.checked)}
              />
              <span style={{ color: 'var(--color-foreground)' }}>Working day</span>
            </label>
            {err && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                {err}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={isPending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
