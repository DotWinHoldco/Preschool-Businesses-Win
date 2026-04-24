'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  createDropInSession,
  updateDropInSession,
  deleteDropInSession,
} from '@/lib/actions/drop-in/manage-sessions'
import {
  createDropInPricing,
  updateDropInPricing,
  deleteDropInPricing,
} from '@/lib/actions/drop-in/manage-pricing'
import { cancelDropInBooking } from '@/lib/actions/drop-in/cancel-booking'

const TABS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'slots', label: 'Slots' },
  { key: 'rates', label: 'Rates' },
] as const

type Tab = (typeof TABS)[number]['key']

export interface BookingProp {
  id: string
  student: string
  classroom: string
  type: string
  status: string
}

export interface SessionProp {
  id: string
  classroom_id: string | null
  classroom_name: string
  day_of_week: number | null
  date: string | null
  start_time: string
  end_time: string
  capacity: number
  notes: string | null
  is_active: boolean
}

export interface PricingProp {
  id: string
  classroom_id: string | null
  classroom_name: string
  age_range_label: string
  age_range_min_months: number
  age_range_max_months: number
  full_day_cents: number
  half_day_cents: number
  hourly_cents: number
  is_active: boolean
}

export interface ClassroomProp {
  id: string
  name: string
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDay(dow: number | null, date: string | null): string {
  if (date) return date
  if (dow !== null && dow >= 0 && dow <= 6) return DAY_LABELS[dow]!
  return '—'
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export interface DropInTabsProps {
  activeTab: string
  bookings: BookingProp[]
  sessions: SessionProp[]
  pricing: PricingProp[]
  classrooms: ClassroomProp[]
}

export function DropInTabs({
  activeTab,
  bookings,
  sessions,
  pricing,
  classrooms,
}: DropInTabsProps) {
  const [tab, setTab] = useState<Tab>(activeTab as Tab)
  const [sessionDialog, setSessionDialog] = useState<{
    mode: 'create' | 'edit'
    row?: SessionProp
  } | null>(null)
  const [pricingDialog, setPricingDialog] = useState<{
    mode: 'create' | 'edit'
    row?: PricingProp
  } | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              borderBottom:
                tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-destructive)',
            color: 'var(--color-destructive)',
            backgroundColor: 'var(--color-background)',
          }}
        >
          {error}
        </div>
      )}

      {tab === 'bookings' && (
        <div
          className="rounded-lg border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
        >
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
              Today&apos;s Bookings
            </h3>
          </div>
          {bookings.length === 0 ? (
            <div
              className="p-8 text-center text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              No drop-in bookings scheduled for today.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {b.student}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {b.classroom} · {b.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor:
                          b.status === 'cancelled' ? 'var(--color-muted)' : 'var(--color-primary)',
                        color:
                          b.status === 'cancelled'
                            ? 'var(--color-muted-foreground)'
                            : 'var(--color-primary-foreground)',
                      }}
                    >
                      {b.status}
                    </span>
                    {b.status !== 'cancelled' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          const reason = window.prompt('Cancellation reason?')
                          if (!reason || !reason.trim()) return
                          setError(null)
                          startTransition(async () => {
                            const res = await cancelDropInBooking({
                              booking_id: b.id,
                              cancel_reason: reason.trim(),
                            })
                            if (!res.ok) setError(res.error ?? 'Failed to cancel booking')
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
              Weekly Availability Slots
            </h3>
            <Button
              size="sm"
              onClick={() => setSessionDialog({ mode: 'create' })}
              className="inline-flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
          </div>
          <div
            className="rounded-lg border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            {sessions.length === 0 ? (
              <div
                className="p-8 text-center text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                No drop-in slots configured yet.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {formatDay(s.day_of_week, s.date)} · {s.classroom_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {s.start_time} – {s.end_time} · Capacity {s.capacity}
                        {s.is_active ? '' : ' · inactive'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSessionDialog({ mode: 'edit', row: s })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm('Delete this slot?')) return
                          setError(null)
                          startTransition(async () => {
                            const res = await deleteDropInSession({ id: s.id })
                            if (!res.ok) setError(res.error ?? 'Failed to delete slot')
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
              Rate Rules
            </h3>
            <Button
              size="sm"
              onClick={() => setPricingDialog({ mode: 'create' })}
              className="inline-flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Rate
            </Button>
          </div>
          <div
            className="rounded-lg border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            {pricing.length === 0 ? (
              <div
                className="p-8 text-center text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                No pricing rules configured yet.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {pricing.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {r.age_range_label} · {r.classroom_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Full {formatCents(r.full_day_cents)} · Half {formatCents(r.half_day_cents)}{' '}
                        · {formatCents(r.hourly_cents)}/hr
                        {r.is_active ? '' : ' · inactive'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPricingDialog({ mode: 'edit', row: r })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm('Delete this rate?')) return
                          setError(null)
                          startTransition(async () => {
                            const res = await deleteDropInPricing({ id: r.id })
                            if (!res.ok) setError(res.error ?? 'Failed to delete rate')
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sessionDialog && (
        <Dialog open onOpenChange={(o) => !o && setSessionDialog(null)}>
          <DialogOverlay onClick={() => setSessionDialog(null)} />
          <DialogContent
            title={sessionDialog.mode === 'create' ? 'Add Drop-in Slot' : 'Edit Drop-in Slot'}
          >
            <SessionForm
              classrooms={classrooms}
              initial={sessionDialog.row}
              pending={pending}
              onCancel={() => setSessionDialog(null)}
              onSubmit={(values) => {
                setError(null)
                startTransition(async () => {
                  const res =
                    sessionDialog.mode === 'edit' && sessionDialog.row
                      ? await updateDropInSession({ id: sessionDialog.row.id, ...values })
                      : await createDropInSession(values)
                  if (!res.ok) {
                    setError(res.error ?? 'Failed to save slot')
                  } else {
                    setSessionDialog(null)
                  }
                })
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {pricingDialog && (
        <Dialog open onOpenChange={(o) => !o && setPricingDialog(null)}>
          <DialogOverlay onClick={() => setPricingDialog(null)} />
          <DialogContent
            title={pricingDialog.mode === 'create' ? 'Add Rate Rule' : 'Edit Rate Rule'}
          >
            <PricingForm
              classrooms={classrooms}
              initial={pricingDialog.row}
              pending={pending}
              onCancel={() => setPricingDialog(null)}
              onSubmit={(values) => {
                setError(null)
                startTransition(async () => {
                  const res =
                    pricingDialog.mode === 'edit' && pricingDialog.row
                      ? await updateDropInPricing({ id: pricingDialog.row.id, ...values })
                      : await createDropInPricing(values)
                  if (!res.ok) {
                    setError(res.error ?? 'Failed to save rate')
                  } else {
                    setPricingDialog(null)
                  }
                })
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session form
// ---------------------------------------------------------------------------

interface SessionFormValues {
  classroom_id: string
  day_of_week: number | null
  date: string | null
  start_time: string
  end_time: string
  capacity: number
  notes: string | null
  is_active: boolean
}

function SessionForm({
  classrooms,
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  classrooms: ClassroomProp[]
  initial?: SessionProp
  pending: boolean
  onCancel: () => void
  onSubmit: (v: SessionFormValues) => void
}) {
  const [classroomId, setClassroomId] = useState(initial?.classroom_id ?? classrooms[0]?.id ?? '')
  const [dayOfWeek, setDayOfWeek] = useState<number>(initial?.day_of_week ?? 1)
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? '07:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? '18:00')
  const [capacity, setCapacity] = useState<number>(initial?.capacity ?? 5)
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true)

  const canSubmit = Boolean(classroomId) && capacity > 0 && startTime < endTime

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Classroom
          </label>
          <Select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            {classrooms.length === 0 && <option value="">No classrooms</option>}
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Day of Week
          </label>
          <Select value={String(dayOfWeek)} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Capacity
          </label>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Start Time
          </label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            End Time
          </label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="session-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="session-active"
            className="text-sm"
            style={{ color: 'var(--color-foreground)' }}
          >
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit || pending}
          loading={pending}
          onClick={() =>
            onSubmit({
              classroom_id: classroomId,
              day_of_week: dayOfWeek,
              date: null,
              start_time: startTime,
              end_time: endTime,
              capacity,
              notes: null,
              is_active: isActive,
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pricing form
// ---------------------------------------------------------------------------

interface PricingFormValues {
  classroom_id: string | null
  age_range_label: string
  age_range_min_months: number
  age_range_max_months: number
  full_day_cents: number
  half_day_cents: number
  hourly_cents: number
  is_active: boolean
}

function PricingForm({
  classrooms,
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  classrooms: ClassroomProp[]
  initial?: PricingProp
  pending: boolean
  onCancel: () => void
  onSubmit: (v: PricingFormValues) => void
}) {
  const [classroomId, setClassroomId] = useState<string>(initial?.classroom_id ?? '')
  const [label, setLabel] = useState(initial?.age_range_label ?? '')
  const [minMonths, setMinMonths] = useState<number>(initial?.age_range_min_months ?? 0)
  const [maxMonths, setMaxMonths] = useState<number>(initial?.age_range_max_months ?? 60)
  const [fullDollars, setFullDollars] = useState<number>(
    initial ? initial.full_day_cents / 100 : 75,
  )
  const [halfDollars, setHalfDollars] = useState<number>(
    initial ? initial.half_day_cents / 100 : 45,
  )
  const [hourlyDollars, setHourlyDollars] = useState<number>(
    initial ? initial.hourly_cents / 100 : 12,
  )
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true)

  const canSubmit = label.trim().length > 0 && maxMonths >= minMonths

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Age Range Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Toddlers (12–24m)"
          />
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Min Age (months)
          </label>
          <Input
            type="number"
            min={0}
            value={minMonths}
            onChange={(e) => setMinMonths(Number(e.target.value))}
          />
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Max Age (months)
          </label>
          <Input
            type="number"
            min={0}
            value={maxMonths}
            onChange={(e) => setMaxMonths(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Classroom (optional)
          </label>
          <Select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            <option value="">All classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Full Day ($)
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={fullDollars}
            onChange={(e) => setFullDollars(Number(e.target.value))}
          />
        </div>
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Half Day ($)
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={halfDollars}
            onChange={(e) => setHalfDollars(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            Hourly ($)
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={hourlyDollars}
            onChange={(e) => setHourlyDollars(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="pricing-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="pricing-active"
            className="text-sm"
            style={{ color: 'var(--color-foreground)' }}
          >
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit || pending}
          loading={pending}
          onClick={() =>
            onSubmit({
              classroom_id: classroomId || null,
              age_range_label: label.trim(),
              age_range_min_months: minMonths,
              age_range_max_months: maxMonths,
              full_day_cents: Math.round(fullDollars * 100),
              half_day_cents: Math.round(halfDollars * 100),
              hourly_cents: Math.round(hourlyDollars * 100),
              is_active: isActive,
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  )
}
