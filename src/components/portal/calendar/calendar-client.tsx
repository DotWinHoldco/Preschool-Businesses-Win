'use client'

// @anchor: cca.calendar.calendar-client
// Full month-view calendar with event creation dialog

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time_start: string | null // HH:MM
  time_end: string | null // HH:MM
  all_day: boolean
  location: string | null
  notes: string | null
}

interface CalendarClientProps {
  initialEvents: CalendarEvent[]
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTimeStart, setFormTimeStart] = useState('')
  const [formTimeEnd, setFormTimeEnd] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLocation, setFormLocation] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{ date: number; inMonth: boolean; dateStr: string }> = []

    // Previous month padding
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

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        inMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    // Next month padding to fill 6 rows
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

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      if (!map.has(event.date)) map.set(event.date, [])
      map.get(event.date)!.push(event)
    }
    return map
  }, [events])

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setCurrentDate(new Date(year, month + direction, 1))
    },
    [year, month],
  )

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const openAddDialog = useCallback((dateStr?: string) => {
    const d = dateStr || new Date().toISOString().split('T')[0]
    setFormTitle('')
    setFormDate(d)
    setFormTimeStart('09:00')
    setFormTimeEnd('10:00')
    setFormAllDay(false)
    setFormLocation('')
    setFormNotes('')
    setSelectedDate(dateStr || null)
    setDialogOpen(true)
  }, [])

  const handleAddEvent = useCallback(() => {
    if (!formTitle.trim() || !formDate) return

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: formTitle.trim(),
      date: formDate,
      time_start: formAllDay ? null : formTimeStart || null,
      time_end: formAllDay ? null : formTimeEnd || null,
      all_day: formAllDay,
      location: formLocation.trim() || null,
      notes: formNotes.trim() || null,
    }

    setEvents((prev) => [...prev, newEvent])
    setDialogOpen(false)
  }, [formTitle, formDate, formTimeStart, formTimeEnd, formAllDay, formLocation, formNotes])

  // Selected date events for the side panel
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
          {/* Day headers */}
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

          {/* Day cells */}
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
                    ...(isSelected
                      ? { ringColor: 'var(--color-primary)' }
                      : {}),
                  }}
                  onClick={() => {
                    setSelectedDate(day.dateStr)
                  }}
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
                      backgroundColor: isToday
                        ? 'var(--color-primary)'
                        : 'transparent',
                      opacity: day.inMonth ? 1 : 0.4,
                    }}
                  >
                    {day.date}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="rounded px-1 py-0.5 text-[10px] font-medium truncate"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        {event.all_day
                          ? event.title
                          : `${event.time_start} ${event.title}`}
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
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--color-foreground)' }}
              >
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                  undefined,
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
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
                  <div
                    key={event.id}
                    className="rounded-lg border p-3"
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
                      {event.notes && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title="Add Event">
          <DialogClose onClick={() => setDialogOpen(false)} />
          <div className="space-y-4">
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
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddEvent}
                disabled={!formTitle.trim() || !formDate}
              >
                Add Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
