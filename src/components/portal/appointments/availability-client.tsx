'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Plus, X, Clock, Calendar, Save, Copy, AlertCircle, Check, Trash2 } from 'lucide-react'
import {
  setStaffAvailability,
  addAvailabilityOverride,
  removeAvailabilityOverride,
} from '@/lib/actions/appointments/manage-availability'
import type { StaffAvailabilityInput } from '@/lib/schemas/appointment'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: string
}

interface AvailabilityPattern {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  appointment_type_id: string | null
  effective_from: string | null
  effective_to: string | null
}

interface AvailabilityOverride {
  id: string
  user_id: string
  date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
  reason: string | null
}

interface CalendarConnection {
  id: string
  user_id: string
  provider: string
  calendar_name: string | null
  status: string
  last_synced_at: string | null
}

interface AppointmentType {
  id: string
  name: string
}

interface AvailabilityClientProps {
  staff: StaffMember[]
  availabilityPatterns: AvailabilityPattern[]
  overrides: AvailabilityOverride[]
  calendarConnections: CalendarConnection[]
  appointmentTypes: AppointmentType[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Day display order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0) */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
const DAY_NAMES: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

interface TimeSlot {
  start_time: string
  end_time: string
  appointment_type_id: string | null
}

type EditingSlots = Record<number, TimeSlot[]>

/** Convert "09:00" to "9:00 AM", "17:30" to "5:30 PM" */
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${ampm}`
}

/** Normalize time string to HH:MM (strip seconds if present) */
function normalizeTime(t: string): string {
  return t.slice(0, 5)
}

/** Format date string for display: "Mon, Jan 15, 2026" */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Build EditingSlots from server patterns for a given user_id */
function buildSlotsFromPatterns(patterns: AvailabilityPattern[], userId: string): EditingSlots {
  const slots: EditingSlots = {}
  for (const day of DAY_ORDER) {
    slots[day] = []
  }
  for (const p of patterns) {
    if (p.user_id !== userId) continue
    if (!slots[p.day_of_week]) slots[p.day_of_week] = []
    slots[p.day_of_week].push({
      start_time: normalizeTime(p.start_time),
      end_time: normalizeTime(p.end_time),
      appointment_type_id: p.appointment_type_id,
    })
  }
  return slots
}

/** Compare two EditingSlots to determine if there are unsaved changes */
function slotsEqual(a: EditingSlots, b: EditingSlots): boolean {
  for (const day of DAY_ORDER) {
    const aSlots = a[day] ?? []
    const bSlots = b[day] ?? []
    if (aSlots.length !== bSlots.length) return false
    for (let i = 0; i < aSlots.length; i++) {
      if (
        aSlots[i].start_time !== bSlots[i].start_time ||
        aSlots[i].end_time !== bSlots[i].end_time ||
        (aSlots[i].appointment_type_id ?? null) !== (bSlots[i].appointment_type_id ?? null)
      ) {
        return false
      }
    }
  }
  return true
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AvailabilityClient({
  staff,
  availabilityPatterns,
  overrides,
  calendarConnections,
  appointmentTypes,
}: AvailabilityClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Staff selector
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.user_id ?? '')
  const selectedStaff = staff.find((s) => s.user_id === selectedStaffId) ?? null

  // Weekly schedule editing state
  const serverSlots = useMemo(
    () => buildSlotsFromPatterns(availabilityPatterns, selectedStaffId),
    [availabilityPatterns, selectedStaffId],
  )
  const [editingSlots, setEditingSlots] = useState<EditingSlots>(() => serverSlots)

  // Track which day has the inline "Add Hours" form open
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [addStartTime, setAddStartTime] = useState('09:00')
  const [addEndTime, setAddEndTime] = useState('17:00')
  const [addTypeId, setAddTypeId] = useState<string>('')

  // Save status
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Override dialog
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideAvailable, setOverrideAvailable] = useState(false)
  const [overrideStartTime, setOverrideStartTime] = useState('09:00')
  const [overrideEndTime, setOverrideEndTime] = useState('17:00')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideError, setOverrideError] = useState<string | null>(null)

  // Calendar coming-soon dialog
  const [calDialogOpen, setCalDialogOpen] = useState(false)
  const [calDialogProvider, setCalDialogProvider] = useState('')

  const hasUnsavedChanges = !slotsEqual(editingSlots, serverSlots)

  // When staff selection changes, reset editing state
  const handleStaffChange = useCallback(
    (userId: string) => {
      setSelectedStaffId(userId)
      setEditingSlots(buildSlotsFromPatterns(availabilityPatterns, userId))
      setAddingDay(null)
      setSaveError(null)
      setSaveSuccess(false)
    },
    [availabilityPatterns],
  )

  // -------------------------------------------------------------------------
  // Weekly Schedule Actions
  // -------------------------------------------------------------------------

  function handleAddSlot(day: number) {
    setEditingSlots((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        {
          start_time: addStartTime,
          end_time: addEndTime,
          appointment_type_id: addTypeId || null,
        },
      ],
    }))
    setAddingDay(null)
    setAddStartTime('09:00')
    setAddEndTime('17:00')
    setAddTypeId('')
    setSaveSuccess(false)
  }

  function handleRemoveSlot(day: number, index: number) {
    setEditingSlots((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== index),
    }))
    setSaveSuccess(false)
  }

  function handleCopyMondayToWeekdays() {
    const mondaySlots = editingSlots[1] ?? []
    setEditingSlots((prev) => ({
      ...prev,
      2: [...mondaySlots],
      3: [...mondaySlots],
      4: [...mondaySlots],
      5: [...mondaySlots],
    }))
    setSaveSuccess(false)
  }

  function handleSaveSchedule() {
    if (!selectedStaffId) return
    setSaveError(null)
    setSaveSuccess(false)

    const inputs: StaffAvailabilityInput[] = []
    for (const day of DAY_ORDER) {
      for (const slot of editingSlots[day] ?? []) {
        inputs.push({
          user_id: selectedStaffId,
          day_of_week: day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          appointment_type_id: slot.appointment_type_id ?? null,
        })
      }
    }

    startTransition(async () => {
      const result = await setStaffAvailability(inputs)
      if (!result.ok) {
        setSaveError(result.error ?? 'Failed to save schedule')
        return
      }
      setSaveSuccess(true)
      router.refresh()
    })
  }

  // -------------------------------------------------------------------------
  // Override Actions
  // -------------------------------------------------------------------------

  function resetOverrideForm() {
    setOverrideDate('')
    setOverrideAvailable(false)
    setOverrideStartTime('09:00')
    setOverrideEndTime('17:00')
    setOverrideReason('')
    setOverrideError(null)
  }

  function handleAddOverride() {
    if (!selectedStaffId || !overrideDate) return
    setOverrideError(null)

    startTransition(async () => {
      const result = await addAvailabilityOverride({
        user_id: selectedStaffId,
        date: overrideDate,
        is_available: overrideAvailable,
        start_time: overrideAvailable ? overrideStartTime : undefined,
        end_time: overrideAvailable ? overrideEndTime : undefined,
        reason: overrideReason || undefined,
      })
      if (!result.ok) {
        setOverrideError(result.error ?? 'Failed to add override')
        return
      }
      resetOverrideForm()
      setOverrideDialogOpen(false)
      router.refresh()
    })
  }

  function handleRemoveOverride(id: string) {
    startTransition(async () => {
      const result = await removeAvailabilityOverride(id)
      if (!result.ok) return
      router.refresh()
    })
  }

  // -------------------------------------------------------------------------
  // Filtered data for selected staff
  // -------------------------------------------------------------------------

  const staffOverrides = overrides
    .filter((o) => o.user_id === selectedStaffId)
    .sort((a, b) => a.date.localeCompare(b.date))

  const staffConnections = calendarConnections.filter((c) => c.user_id === selectedStaffId)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Staff selector */}
      <div>
        <label
          htmlFor="staff-select"
          className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
        >
          Staff Member
        </label>
        <select
          id="staff-select"
          value={selectedStaffId}
          onChange={(e) => handleStaffChange(e.target.value)}
          className="w-full max-w-xs rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[48px]"
        >
          {staff.length === 0 && <option value="">No active staff</option>}
          {staff.map((s) => (
            <option key={s.user_id} value={s.user_id}>
              {s.first_name} {s.last_name} ({s.role})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule">
        <TabList>
          <Tab value="schedule">
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> Weekly Schedule
            </span>
          </Tab>
          <Tab value="overrides">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Date Overrides
            </span>
          </Tab>
          <Tab value="calendars">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Calendar Connections
            </span>
          </Tab>
        </TabList>

        {/* =============================================================== */}
        {/* Tab 1: Weekly Schedule Editor                                   */}
        {/* =============================================================== */}
        <TabPanel value="schedule">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
            {/* 7-column grid (stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAY_ORDER.map((day) => {
                const slots = editingSlots[day] ?? []
                const isAdding = addingDay === day
                return (
                  <div key={day} className="space-y-2">
                    {/* Day header */}
                    <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                      {DAY_NAMES[day]}
                    </h3>

                    {/* Time blocks */}
                    {slots.length === 0 && !isAdding && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">No hours</p>
                    )}
                    {slots.map((slot, idx) => {
                      const typeName = slot.appointment_type_id
                        ? appointmentTypes.find((t) => t.id === slot.appointment_type_id)?.name
                        : null
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs text-[var(--color-primary)]"
                        >
                          <span className="flex-1 truncate">
                            {formatTime(slot.start_time)} &ndash; {formatTime(slot.end_time)}
                            {typeName && (
                              <span className="block text-[10px] opacity-70 truncate">
                                {typeName}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(day, idx)}
                            className="shrink-0 rounded-full p-0.5 hover:bg-[var(--color-primary)]/20 transition-colors"
                            aria-label={`Remove ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}

                    {/* Inline Add Hours form */}
                    {isAdding ? (
                      <div className="space-y-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-muted)] p-2">
                        <div>
                          <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                            Start
                          </label>
                          <input
                            type="time"
                            value={addStartTime}
                            onChange={(e) => setAddStartTime(e.target.value)}
                            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                            End
                          </label>
                          <input
                            type="time"
                            value={addEndTime}
                            onChange={(e) => setAddEndTime(e.target.value)}
                            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                            Type
                          </label>
                          <select
                            value={addTypeId}
                            onChange={(e) => setAddTypeId(e.target.value)}
                            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          >
                            <option value="">All Types</option>
                            {appointmentTypes.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddSlot(day)}
                            disabled={!addStartTime || !addEndTime}
                            className="text-xs h-7 px-2"
                          >
                            Add
                          </Button>
                          <button
                            type="button"
                            onClick={() => setAddingDay(null)}
                            className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingDay(day)
                          setAddStartTime('09:00')
                          setAddEndTime('17:00')
                          setAddTypeId('')
                        }}
                        className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Plus size={12} /> Add Hours
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Action bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyMondayToWeekdays}
                disabled={isPending}
              >
                <Copy size={14} /> Copy Monday to Weekdays
              </Button>

              <Button
                size="sm"
                onClick={handleSaveSchedule}
                loading={isPending}
                disabled={!hasUnsavedChanges && !saveSuccess}
              >
                <Save size={14} /> Save Schedule
              </Button>

              {hasUnsavedChanges && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
                  <AlertCircle size={14} />
                  Unsaved changes
                </span>
              )}

              {saveSuccess && !hasUnsavedChanges && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                  <Check size={14} />
                  Saved
                </span>
              )}

              {saveError && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-destructive)]">
                  <AlertCircle size={14} />
                  {saveError}
                </span>
              )}
            </div>
          </div>
        </TabPanel>

        {/* =============================================================== */}
        {/* Tab 2: Date Overrides                                           */}
        {/* =============================================================== */}
        <TabPanel value="overrides">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Date Overrides
                {selectedStaff && (
                  <span className="normal-case font-normal">
                    {' '}
                    for {selectedStaff.first_name} {selectedStaff.last_name}
                  </span>
                )}
              </h3>
              <Button
                size="sm"
                onClick={() => {
                  resetOverrideForm()
                  setOverrideDialogOpen(true)
                }}
              >
                <Plus size={14} /> Add Override
              </Button>
            </div>

            {staffOverrides.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No date overrides scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {staffOverrides.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-[var(--color-foreground)] shrink-0">
                        {formatDate(o.date)}
                      </span>
                      {o.is_available ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
                          Custom Hours
                          {o.start_time && o.end_time && (
                            <span className="ml-1">
                              {formatTime(normalizeTime(o.start_time))} &ndash;{' '}
                              {formatTime(normalizeTime(o.end_time))}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]">
                          Blocked
                        </span>
                      )}
                      {o.reason && (
                        <span className="text-xs text-[var(--color-muted-foreground)] truncate">
                          {o.reason}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(o.id)}
                      disabled={isPending}
                      className="shrink-0 rounded-full p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)] transition-colors disabled:opacity-50"
                      aria-label={`Remove override for ${o.date}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>

        {/* =============================================================== */}
        {/* Tab 3: Calendar Connections                                      */}
        {/* =============================================================== */}
        <TabPanel value="calendars">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Calendar Connections
              {selectedStaff && (
                <span className="normal-case font-normal">
                  {' '}
                  for {selectedStaff.first_name} {selectedStaff.last_name}
                </span>
              )}
            </h3>

            {/* Existing connections */}
            {staffConnections.length > 0 && (
              <div className="space-y-2 mb-4">
                {staffConnections.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarProviderIcon provider={c.provider} />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">
                          {c.calendar_name ?? c.provider}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{c.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          c.status === 'active'
                            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {c.last_synced_at
                          ? `Synced ${new Date(c.last_synced_at).toLocaleDateString()}`
                          : 'Never synced'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {staffConnections.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                No calendars connected.
              </p>
            )}

            {/* Connect buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCalDialogProvider('Google Calendar')
                  setCalDialogOpen(true)
                }}
              >
                Connect Google Calendar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCalDialogProvider('Outlook Calendar')
                  setCalDialogOpen(true)
                }}
              >
                Connect Outlook Calendar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCalDialogProvider('CalDAV')
                  setCalDialogOpen(true)
                }}
              >
                Connect CalDAV
              </Button>
            </div>
          </div>
        </TabPanel>
      </Tabs>

      {/* ================================================================= */}
      {/* Add Override Dialog                                                */}
      {/* ================================================================= */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogOverlay onClick={() => setOverrideDialogOpen(false)} />
        <DialogContent
          title="Add Date Override"
          description={
            selectedStaff
              ? `Override availability for ${selectedStaff.first_name} ${selectedStaff.last_name} on a specific date.`
              : 'Override availability on a specific date.'
          }
        >
          <DialogClose onClick={() => setOverrideDialogOpen(false)} />
          <div className="space-y-4">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="override-date"
                className="text-sm font-medium text-[var(--color-foreground)]"
              >
                Date <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <Input
                id="override-date"
                type="date"
                inputSize="sm"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                required
              />
            </div>

            {/* Available toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Availability
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-[var(--color-foreground)]">
                  <input
                    type="radio"
                    name="override-avail"
                    checked={!overrideAvailable}
                    onChange={() => setOverrideAvailable(false)}
                  />
                  Blocked (unavailable all day)
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-[var(--color-foreground)]">
                  <input
                    type="radio"
                    name="override-avail"
                    checked={overrideAvailable}
                    onChange={() => setOverrideAvailable(true)}
                  />
                  Available with custom hours
                </label>
              </div>
            </div>

            {/* Custom hours (when available) */}
            {overrideAvailable && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="override-start"
                    className="text-sm font-medium text-[var(--color-foreground)]"
                  >
                    Start Time
                  </label>
                  <Input
                    id="override-start"
                    type="time"
                    inputSize="sm"
                    value={overrideStartTime}
                    onChange={(e) => setOverrideStartTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="override-end"
                    className="text-sm font-medium text-[var(--color-foreground)]"
                  >
                    End Time
                  </label>
                  <Input
                    id="override-end"
                    type="time"
                    inputSize="sm"
                    value={overrideEndTime}
                    onChange={(e) => setOverrideEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="override-reason"
                className="text-sm font-medium text-[var(--color-foreground)]"
              >
                Reason
              </label>
              <Input
                id="override-reason"
                inputSize="sm"
                placeholder="Optional (e.g. Vacation, Training)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>

            {overrideError && (
              <p className="text-xs text-[var(--color-destructive)]">{overrideError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetOverrideForm()
                  setOverrideDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddOverride}
                loading={isPending}
                disabled={!overrideDate}
              >
                <Save size={14} /> Save Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Calendar Coming Soon Dialog                                        */}
      {/* ================================================================= */}
      <Dialog open={calDialogOpen} onOpenChange={setCalDialogOpen}>
        <DialogOverlay onClick={() => setCalDialogOpen(false)} />
        <DialogContent
          title={`Connect ${calDialogProvider}`}
          description="Calendar integration is coming soon."
        >
          <DialogClose onClick={() => setCalDialogOpen(false)} />
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Connected calendars will automatically block times when staff have existing events.
              This prevents double-booking and keeps appointment availability accurate without
              manual overrides.
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setCalDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helper component for calendar provider icons
// ---------------------------------------------------------------------------

function CalendarProviderIcon({ provider }: { provider: string }) {
  const letter = provider.charAt(0).toUpperCase()
  const colors: Record<string, string> = {
    google: '#4285F4',
    outlook: '#0078D4',
    apple: '#333333',
  }
  const bg = colors[provider.toLowerCase()] ?? 'var(--color-primary)'

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: bg }}
    >
      {letter}
    </div>
  )
}
