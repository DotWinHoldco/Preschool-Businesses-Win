'use client'

// @anchor: cca.calendar.calendar-client
// Full month-view calendar with event CRUD (create/edit/delete) via server actions.

import { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/actions/calendar/manage-events'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarEventType =
  | 'closure'
  | 'holiday'
  | 'field_trip'
  | 'special_event'
  | 'parent_night'
  | 'chapel'
  | 'staff_meeting'
  | 'other'

export type CalendarScope = 'school_wide' | 'classroom' | 'staff_only'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_type: CalendarEventType
  date: string // YYYY-MM-DD (local)
  start_at: string // ISO
  end_at: string | null // ISO
  time_start: string | null // HH:MM
  time_end: string | null // HH:MM
  all_day: boolean
  location: string | null
  notes: string | null
  scope: CalendarScope
  classroom_id: string | null
  requires_rsvp: boolean
  requires_permission_slip: boolean
  max_participants: number | null
  cost_per_child_cents: number | null
}

export interface CalendarClassroomOption {
  id: string
  name: string
}

interface CalendarClientProps {
  initialEvents: CalendarEvent[]
  classrooms: CalendarClassroomOption[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// User-facing event-type options (maps to schema enum).
// The user brief requested school_closure/holiday/parent_event/class_event/drill/other;
// the existing DB enum uses closure/holiday/parent_night/field_trip/other (and more).
const EVENT_TYPE_OPTIONS: Array<{ value: CalendarEventType; label: string }> = [
  { value: 'closure', label: 'School Closure' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'parent_night', label: 'Parent Event' },
  { value: 'field_trip', label: 'Class Event / Field Trip' },
  { value: 'special_event', label: 'Drill / Special Event' },
  { value: 'chapel', label: 'Chapel' },
  { value: 'staff_meeting', label: 'Staff Meeting' },
  { value: 'other', label: 'Other' },
]

const SCOPE_OPTIONS: Array<{ value: CalendarScope; label: string }> = [
  { value: 'school_wide', label: 'School-wide' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'staff_only', label: 'Staff only' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildIsoFromDateAndTime(date: string, time: string | null, allDay: boolean): string {
  // For all-day we use start-of-day local; for timed we combine date+time local.
  const [y, m, d] = date.split('-').map(Number)
  if (allDay || !time) {
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString()
  }
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0).toISOString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarClient({ initialEvents, classrooms }: CalendarClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [events] = useState<CalendarEvent[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailEventId, setDetailEventId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEventType, setFormEventType] = useState<CalendarEventType>('other')
  const [formDate, setFormDate] = useState('')
  const [formTimeStart, setFormTimeStart] = useState('')
  const [formTimeEnd, setFormTimeEnd] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLocation, setFormLocation] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formScope, setFormScope] = useState<CalendarScope>('school_wide')
  const [formClassroomId, setFormClassroomId] = useState<string>('')
  const [formRequiresRsvp, setFormRequiresRsvp] = useState(false)
  const [formRequiresPermissionSlip, setFormRequiresPermissionSlip] = useState(false)
  const [formMaxParticipants, setFormMaxParticipants] = useState('')
  const [formCostPerChild, setFormCostPerChild] = useState('') // dollars

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{ date: number; inMonth: boolean; dateStr: string }> = []

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const m = month === 0 ? 12 : month
      const y = month === 0 ? year - 1 : year
      days.push({
        date: d,
        inMonth: false,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        inMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2
      const y = month + 2 > 12 ? year + 1 : year
      days.push({
        date: d,
        inMonth: false,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    return days
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      if (!map.has(event.date)) map.set(event.date, [])
      map.get(event.date)!.push(event)
    }
    return map
  }, [events])

  const detailEvent = useMemo(
    () => (detailEventId ? (events.find((e) => e.id === detailEventId) ?? null) : null),
    [detailEventId, events],
  )

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setCurrentDate(new Date(year, month + direction, 1))
    },
    [year, month],
  )

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormEventType('other')
    setFormTimeStart('09:00')
    setFormTimeEnd('10:00')
    setFormAllDay(false)
    setFormLocation('')
    setFormNotes('')
    setFormScope('school_wide')
    setFormClassroomId('')
    setFormRequiresRsvp(false)
    setFormRequiresPermissionSlip(false)
    setFormMaxParticipants('')
    setFormCostPerChild('')
    setFormError(null)
  }, [])

  const openAddDialog = useCallback(
    (dateStr?: string) => {
      const d = dateStr || new Date().toISOString().split('T')[0]
      resetForm()
      setFormDate(d)
      setSelectedDate(dateStr || null)
      setDialogOpen(true)
    },
    [resetForm],
  )

  const openEditDialog = useCallback((event: CalendarEvent) => {
    setEditingId(event.id)
    setFormTitle(event.title)
    setFormDescription(event.description ?? '')
    setFormEventType(event.event_type)
    setFormDate(event.date)
    setFormTimeStart(event.time_start ?? '09:00')
    setFormTimeEnd(event.time_end ?? '10:00')
    setFormAllDay(event.all_day)
    setFormLocation(event.location ?? '')
    setFormNotes(event.notes ?? '')
    setFormScope(event.scope)
    setFormClassroomId(event.classroom_id ?? '')
    setFormRequiresRsvp(event.requires_rsvp)
    setFormRequiresPermissionSlip(event.requires_permission_slip)
    setFormMaxParticipants(event.max_participants?.toString() ?? '')
    setFormCostPerChild(
      event.cost_per_child_cents != null ? (event.cost_per_child_cents / 100).toFixed(2) : '',
    )
    setFormError(null)
    setDetailEventId(null)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!formTitle.trim() || !formDate) {
      setFormError('Title and date are required')
      return
    }
    if (formScope === 'classroom' && !formClassroomId) {
      setFormError('Pick a classroom for classroom-scoped events')
      return
    }
    setFormError(null)

    const startIso = buildIsoFromDateAndTime(formDate, formTimeStart, formAllDay)
    const endIso = buildIsoFromDateAndTime(
      formDate,
      formAllDay ? null : formTimeEnd || formTimeStart,
      formAllDay,
    )

    const maxP = formMaxParticipants ? parseInt(formMaxParticipants, 10) : undefined
    const costDollars = formCostPerChild ? parseFloat(formCostPerChild) : NaN
    const costCents = Number.isFinite(costDollars) ? Math.round(costDollars * 100) : undefined

    startTransition(async () => {
      if (editingId) {
        const result = await updateCalendarEvent({
          event_id: editingId,
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          event_type: formEventType,
          start_at: startIso,
          end_at: endIso,
          all_day: formAllDay,
          location: formLocation.trim() || undefined,
          scope: formScope,
          classroom_id: formScope === 'classroom' ? formClassroomId : undefined,
          requires_rsvp: formRequiresRsvp,
          max_participants: maxP,
          cost_per_child_cents: costCents,
          notes: formNotes.trim() || undefined,
        })
        if (!result.ok) {
          const errVal = 'error' in result ? result.error : null
          setFormError(typeof errVal === 'string' ? errVal : 'Failed to update event')
          return
        }
      } else {
        const result = await createCalendarEvent({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          event_type: formEventType,
          start_at: startIso,
          end_at: endIso,
          all_day: formAllDay,
          location: formLocation.trim() || undefined,
          scope: formScope,
          classroom_id: formScope === 'classroom' ? formClassroomId : undefined,
          requires_rsvp: formRequiresRsvp,
          requires_permission_slip: formRequiresPermissionSlip,
          max_participants: maxP,
          cost_per_child_cents: costCents,
          notes: formNotes.trim() || undefined,
        })
        if (!result.ok) {
          const errVal = 'error' in result ? result.error : null
          setFormError(typeof errVal === 'string' ? errVal : 'Failed to create event')
          return
        }
      }

      setDialogOpen(false)
      resetForm()
      router.refresh()
    })
  }, [
    formTitle,
    formDate,
    formTimeStart,
    formTimeEnd,
    formAllDay,
    formLocation,
    formNotes,
    formEventType,
    formDescription,
    formScope,
    formClassroomId,
    formRequiresRsvp,
    formRequiresPermissionSlip,
    formMaxParticipants,
    formCostPerChild,
    editingId,
    resetForm,
    router,
  ])

  const handleDelete = useCallback(
    (event: CalendarEvent) => {
      if (typeof window !== 'undefined' && !window.confirm(`Delete "${event.title}"?`)) return
      startTransition(async () => {
        const result = await deleteCalendarEvent(event.id)
        if (!result.ok) {
          setFormError(result.error ?? 'Failed to delete event')
          return
        }
        setDetailEventId(null)
        router.refresh()
      })
    },
    [router],
  )

  const selectedDateEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg p-2 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <h2
            className="text-lg font-semibold min-w-[200px] text-center"
            style={{ color: 'var(--color-foreground)' }}
          >
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="inline-flex items-center justify-center rounded-lg p-2 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <Button size="sm" onClick={() => openAddDialog()}>
          <Plus size={16} />
          Add Event
        </Button>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Calendar grid */}
        <div
          className="flex-1 rounded-lg border overflow-hidden"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-card)',
          }}
        >
          <div className="grid grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium py-2 border-b"
                style={{
                  color: 'var(--color-muted-foreground)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-px"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            {calendarDays.map((day, i) => {
              const dayEvents = eventsByDate.get(day.dateStr) || []
              const isToday = day.dateStr === today
              const isSelected = day.dateStr === selectedDate

              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'min-h-[80px] sm:min-h-[100px] p-1.5 text-left transition-colors',
                    isSelected && 'ring-2 ring-inset',
                  )}
                  style={{
                    backgroundColor: 'var(--color-card)',
                  }}
                  onClick={() => setSelectedDate(day.dateStr)}
                  onDoubleClick={() => openAddDialog(day.dateStr)}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium',
                    )}
                    style={{
                      color: day.inMonth
                        ? isToday
                          ? 'var(--color-primary-foreground)'
                          : 'var(--color-foreground)'
                        : 'var(--color-muted-foreground)',
                      backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                      opacity: day.inMonth ? 1 : 0.4,
                    }}
                  >
                    {day.date}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        className="rounded px-1 py-0.5 text-[10px] font-medium truncate cursor-pointer"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailEventId(event.id)
                        }}
                      >
                        {event.all_day ? event.title : `${event.time_start} ${event.title}`}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p
                        className="text-[10px] px-1"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel: selected date details */}
        {selectedDate && (
          <div
            className="lg:w-[280px] shrink-0 rounded-lg border p-4"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button
                onClick={() => openAddDialog(selectedDate)}
                className="rounded p-1 transition-colors"
                style={{ color: 'var(--color-primary)' }}
                aria-label="Add event on selected date"
              >
                <Plus size={16} />
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p
                className="text-sm py-4 text-center"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                No events on this day.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setDetailEventId(event.id)}
                    className="w-full text-left rounded-lg border p-3 transition-colors hover:bg-[var(--color-muted)]"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {event.title}
                    </p>
                    <div className="mt-1 space-y-1">
                      {event.all_day ? (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <Clock size={10} /> All day
                        </p>
                      ) : (
                        event.time_start && (
                          <p
                            className="text-xs flex items-center gap-1"
                            style={{ color: 'var(--color-muted-foreground)' }}
                          >
                            <Clock size={10} />
                            {event.time_start}
                            {event.time_end ? ` - ${event.time_end}` : ''}
                          </p>
                        )
                      )}
                      {event.location && (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <MapPin size={10} /> {event.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailEvent !== null} onOpenChange={(o) => !o && setDetailEventId(null)}>
        <DialogOverlay onClick={() => setDetailEventId(null)} />
        <DialogContent title={detailEvent?.title ?? 'Event'}>
          <DialogClose onClick={() => setDetailEventId(null)} />
          {detailEvent && (
            <div className="space-y-3">
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {new Date(detailEvent.start_at).toLocaleString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: detailEvent.all_day ? undefined : 'numeric',
                  minute: detailEvent.all_day ? undefined : '2-digit',
                })}
                {!detailEvent.all_day && detailEvent.end_at && (
                  <>
                    {' – '}
                    {new Date(detailEvent.end_at).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </>
                )}
              </div>
              {detailEvent.description && (
                <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  {detailEvent.description}
                </p>
              )}
              <div
                className="text-xs grid grid-cols-2 gap-2"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                <div>Type: {detailEvent.event_type}</div>
                <div>Scope: {detailEvent.scope}</div>
                {detailEvent.location && <div>Location: {detailEvent.location}</div>}
                {detailEvent.max_participants != null && (
                  <div>Max: {detailEvent.max_participants}</div>
                )}
                {detailEvent.cost_per_child_cents != null &&
                  detailEvent.cost_per_child_cents > 0 && (
                    <div>Cost: ${(detailEvent.cost_per_child_cents / 100).toFixed(2)}</div>
                  )}
                {detailEvent.requires_rsvp && <div>RSVP required</div>}
                {detailEvent.requires_permission_slip && <div>Permission slip</div>}
              </div>
              {detailEvent.notes && (
                <p
                  className="text-xs whitespace-pre-wrap"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {detailEvent.notes}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(detailEvent)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => openEditDialog(detailEvent)}
                >
                  <Pencil size={14} /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title={editingId ? 'Edit Event' : 'Add Event'}>
          <DialogClose onClick={() => setDialogOpen(false)} />
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label
                htmlFor="event-title"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Title *
              </label>
              <Input
                id="event-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Event title"
                inputSize="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="event-type"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Type
                </label>
                <Select
                  id="event-type"
                  value={formEventType}
                  onChange={(e) => setFormEventType(e.target.value as CalendarEventType)}
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="event-scope"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Scope
                </label>
                <Select
                  id="event-scope"
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value as CalendarScope)}
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {formScope === 'classroom' && (
              <div>
                <label
                  htmlFor="event-classroom"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Classroom *
                </label>
                <Select
                  id="event-classroom"
                  value={formClassroomId}
                  onChange={(e) => setFormClassroomId(e.target.value)}
                >
                  <option value="">Select classroom...</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label
                htmlFor="event-date"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Date *
              </label>
              <Input
                id="event-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                inputSize="sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="event-allday"
                type="checkbox"
                checked={formAllDay}
                onChange={(e) => setFormAllDay(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <label
                htmlFor="event-allday"
                className="text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                All day
              </label>
            </div>

            {!formAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="event-start"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Start time
                  </label>
                  <Input
                    id="event-start"
                    type="time"
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                    inputSize="sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="event-end"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    End time
                  </label>
                  <Input
                    id="event-end"
                    type="time"
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                    inputSize="sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="event-location"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Location
              </label>
              <Input
                id="event-location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g., Fellowship Hall"
                inputSize="sm"
              />
            </div>

            <div>
              <label
                htmlFor="event-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Description
              </label>
              <textarea
                id="event-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-2 text-sm min-h-[48px]"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
                placeholder="Short description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="event-max"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Max participants
                </label>
                <Input
                  id="event-max"
                  type="number"
                  min="1"
                  value={formMaxParticipants}
                  onChange={(e) => setFormMaxParticipants(e.target.value)}
                  inputSize="sm"
                />
              </div>
              <div>
                <label
                  htmlFor="event-cost"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Cost per child ($)
                </label>
                <Input
                  id="event-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostPerChild}
                  onChange={(e) => setFormCostPerChild(e.target.value)}
                  inputSize="sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={formRequiresRsvp}
                  onChange={(e) => setFormRequiresRsvp(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Requires RSVP
              </label>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={formRequiresPermissionSlip}
                  onChange={(e) => setFormRequiresPermissionSlip(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Requires permission slip
              </label>
            </div>

            <div>
              <label
                htmlFor="event-notes"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Notes
              </label>
              <textarea
                id="event-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-2 text-sm min-h-[48px]"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
                placeholder="Optional internal notes..."
              />
            </div>

            {formError && (
              <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!formTitle.trim() || !formDate || isPending}
                loading={isPending}
              >
                {editingId ? 'Save Changes' : 'Add Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
