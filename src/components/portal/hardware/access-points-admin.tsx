'use client'

// @anchor: cca.door.admin-panel

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, DoorOpen, Battery, Clock, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import {
  createAccessPoint,
  updateAccessPoint,
  deleteAccessPoint,
  logAccessEvent,
} from '@/lib/actions/hardware/access-points'

export type AccessPoint = {
  id: string
  name: string
  location: string | null
  door_type: 'entry' | 'exit' | 'classroom' | 'emergency' | 'playground' | null
  lock_type: 'magnetic' | 'keypad' | 'rfid' | 'badge' | 'manual' | null
  hardware_id: string | null
  current_status: 'locked' | 'unlocked' | 'unknown' | 'offline'
  battery_pct: number | null
  last_event_at: string | null
  is_active: boolean
}

export type AccessEvent = {
  id: string
  event_type: string
  success: boolean
  actor_label: string | null
  denied_reason: string | null
  created_at: string
}

function statusVariant(
  s: AccessPoint['current_status'],
): 'default' | 'secondary' | 'warning' | 'danger' | 'outline' {
  switch (s) {
    case 'locked':
      return 'default'
    case 'unlocked':
      return 'warning'
    case 'offline':
      return 'danger'
    default:
      return 'outline'
  }
}

export function AccessPointsAdmin({
  accessPoints,
  eventsByDoor,
}: {
  accessPoints: AccessPoint[]
  eventsByDoor: Record<string, AccessEvent[]>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<AccessPoint | 'new' | null>(null)
  const [viewEventsFor, setViewEventsFor] = useState<AccessPoint | null>(null)
  const [pending, start] = useTransition()

  function remove(id: string) {
    if (!confirm('Delete this access point?')) return
    start(async () => {
      const res = await deleteAccessPoint({ id })
      if (res.ok) router.refresh()
      else alert(res.error ?? 'Failed')
    })
  }

  function override(id: string, event_type: 'unlock' | 'lock') {
    start(async () => {
      const res = await logAccessEvent({
        access_point_id: id,
        event_type: event_type === 'unlock' ? 'manual_override' : 'lock',
        actor_label: 'Admin manual override',
        success: true,
        denied_reason: null,
      })
      if (res.ok) router.refresh()
      else alert(res.error ?? 'Failed')
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus size={14} />
          Add Access Point
        </Button>
      </div>

      {accessPoints.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <DoorOpen
            size={40}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No access points defined yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Hardware integration is separate — CRUD is manual for now.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {accessPoints.map((ap) => (
            <div
              key={ap.id}
              className="rounded-xl p-4 flex flex-wrap items-center gap-4"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-primary)' }}
              >
                <DoorOpen size={18} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {ap.name}
                  </p>
                  <Badge variant={statusVariant(ap.current_status)}>{ap.current_status}</Badge>
                  {ap.door_type && <Badge variant="outline">{ap.door_type}</Badge>}
                  {!ap.is_active && <Badge variant="secondary">inactive</Badge>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                  {ap.location ?? 'No location'}
                  {ap.lock_type && ` · ${ap.lock_type}`}
                </p>
              </div>
              <div
                className="flex items-center gap-4 text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {ap.battery_pct != null && (
                  <span className="inline-flex items-center gap-1">
                    <Battery size={12} />
                    {ap.battery_pct}%
                  </span>
                )}
                {ap.last_event_at && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(ap.last_event_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => override(ap.id, 'unlock')}
                  disabled={pending}
                >
                  <Unlock size={12} />
                  Unlock
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => override(ap.id, 'lock')}
                  disabled={pending}
                >
                  <Lock size={12} />
                  Lock
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewEventsFor(ap)}>
                  Events
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(ap)}
                  aria-label={`Edit ${ap.name}`}
                  className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(ap.id)}
                  aria-label={`Delete ${ap.name}`}
                  className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccessPointDialog accessPoint={editing} onClose={() => setEditing(null)} />
      <EventsDialog
        accessPoint={viewEventsFor}
        events={viewEventsFor ? (eventsByDoor[viewEventsFor.id] ?? []) : []}
        onClose={() => setViewEventsFor(null)}
      />
    </>
  )
}

function AccessPointDialog({
  accessPoint,
  onClose,
}: {
  accessPoint: AccessPoint | 'new' | null
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isNew = accessPoint === 'new'
  const existing = isNew ? null : (accessPoint as AccessPoint | null)

  const [form, setForm] = useState(() => ({
    name: existing?.name ?? '',
    location: existing?.location ?? '',
    door_type: (existing?.door_type ?? '') as
      | ''
      | 'entry'
      | 'exit'
      | 'classroom'
      | 'emergency'
      | 'playground',
    lock_type: (existing?.lock_type ?? '') as
      | ''
      | 'magnetic'
      | 'keypad'
      | 'rfid'
      | 'badge'
      | 'manual',
    hardware_id: existing?.hardware_id ?? '',
    is_active: existing?.is_active ?? true,
  }))

  const key = existing?.id ?? (isNew ? 'new' : 'closed')
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setForm({
      name: existing?.name ?? '',
      location: existing?.location ?? '',
      door_type: (existing?.door_type ?? '') as typeof form.door_type,
      lock_type: (existing?.lock_type ?? '') as typeof form.lock_type,
      hardware_id: existing?.hardware_id ?? '',
      is_active: existing?.is_active ?? true,
    })
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const payload = {
        name: form.name,
        location: form.location || null,
        door_type: (form.door_type || null) as AccessPoint['door_type'],
        lock_type: (form.lock_type || null) as AccessPoint['lock_type'],
        hardware_id: form.hardware_id || null,
        is_active: form.is_active,
      }
      const res = existing
        ? await updateAccessPoint({ id: existing.id, ...payload })
        : await createAccessPoint(payload)
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onClose()
      router.refresh()
    })
  }

  const open = accessPoint !== null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={existing ? 'Edit Access Point' : 'Add Access Point'}>
        <DialogClose onClick={onClose} />
        <form onSubmit={submit} className="space-y-3">
          <Input
            required
            placeholder="Name (e.g. 'Main entrance')"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.door_type}
              onChange={(e) =>
                setForm((s) => ({ ...s, door_type: e.target.value as typeof form.door_type }))
              }
            >
              <option value="">Door type</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="classroom">Classroom</option>
              <option value="emergency">Emergency</option>
              <option value="playground">Playground</option>
            </Select>
            <Select
              value={form.lock_type}
              onChange={(e) =>
                setForm((s) => ({ ...s, lock_type: e.target.value as typeof form.lock_type }))
              }
            >
              <option value="">Lock type</option>
              <option value="magnetic">Magnetic</option>
              <option value="keypad">Keypad</option>
              <option value="rfid">RFID</option>
              <option value="badge">Badge</option>
              <option value="manual">Manual</option>
            </Select>
          </div>
          <Input
            placeholder="Hardware ID (for integration)"
            value={form.hardware_id}
            onChange={(e) => setForm((s) => ({ ...s, hardware_id: e.target.value }))}
          />
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-foreground)' }}
          >
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
            />
            Active
          </label>
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              {existing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EventsDialog({
  accessPoint,
  events,
  onClose,
}: {
  accessPoint: AccessPoint | null
  events: AccessEvent[]
  onClose: () => void
}) {
  return (
    <Dialog open={!!accessPoint} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent
        title={accessPoint ? `Events: ${accessPoint.name}` : ''}
        description="Last 50 events recorded for this door."
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <DialogClose onClick={onClose} />
        {events.length === 0 ? (
          <p
            className="text-sm py-8 text-center"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            No events logged yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={e.success ? 'default' : 'danger'}>{e.event_type}</Badge>
                  <span style={{ color: 'var(--color-foreground)' }}>
                    {e.actor_label ?? (e.success ? '—' : (e.denied_reason ?? 'denied'))}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
