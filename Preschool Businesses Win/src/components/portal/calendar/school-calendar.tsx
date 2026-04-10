'use client'

// @anchor: cca.calendar.school-calendar
// Monthly/weekly/agenda calendar view for school events
// See CCA_BUILD_BRIEF.md §36

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/cn'

type ViewMode = 'month' | 'week' | 'agenda'

interface CalendarEvent {
  id: string
  title: string
  event_type: string
  start_at: string
  end_at: string
  all_day: boolean
  scope: string
  classroom_name?: string
  requires_rsvp: boolean
}

interface SchoolCalendarProps {
  events: CalendarEvent[]
  onEventClick?: (eventId: string) => void
  onDateClick?: (date: string) => void
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  closure: 'var(--color-destructive)',
  holiday: 'var(--color-warning)',
  field_trip: 'var(--color-primary)',
  special_event: 'var(--color-secondary, #3B70B0)',
  parent_night: 'var(--color-accent, #F15A50)',
  chapel: 'var(--color-gold-500, #F59E0B)',
  staff_meeting: 'var(--color-muted-foreground)',
  other: 'var(--color-muted-foreground)',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function SchoolCalendar({ events, onEventClick, onDateClick }: SchoolCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const days: Array<{ date: number; inMonth: boolean; dateStr: string }> = []

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      days.push({ date: d, inMonth: false, dateStr: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: d, inMonth: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, inMonth: false, dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    return days
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const dateStr = event.start_at.split('T')[0]
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr)!.push(event)
    }
    return map
  }, [events])

  const navigate = (direction: -1 | 1) => {
    setCurrentDate(new Date(year, month + direction, 1))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded p-1.5 hover:bg-gray-100" aria-label="Previous month">
            <ChevronLeft size={18} style={{ color: 'var(--color-foreground)' }} />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center" style={{ color: 'var(--color-foreground)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={() => navigate(1)} className="rounded p-1.5 hover:bg-gray-100" aria-label="Next month">
            <ChevronRight size={18} style={{ color: 'var(--color-foreground)' }} />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { mode: 'month' as const, icon: LayoutGrid, label: 'Month view' },
            { mode: 'week' as const, icon: Calendar, label: 'Week view' },
            { mode: 'agenda' as const, icon: List, label: 'Agenda view' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn('rounded-md p-1.5 transition-colors')}
              style={{
                backgroundColor: viewMode === mode ? 'var(--color-primary)' : 'transparent',
                color: viewMode === mode ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
              }}
              aria-label={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {viewMode === 'month' && (
        <div className="p-2">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium py-2" style={{ color: 'var(--color-muted-foreground)' }}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--color-border)' }}>
            {daysInMonth.map((day, i) => {
              const dayEvents = eventsByDate.get(day.dateStr) ?? []
              const isToday = day.dateStr === today

              return (
                <div
                  key={i}
                  className="min-h-[80px] p-1 cursor-pointer hover:bg-gray-50"
                  style={{ backgroundColor: 'var(--color-card)' }}
                  onClick={() => onDateClick?.(day.dateStr)}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                      isToday && 'text-white',
                    )}
                    style={{
                      color: day.inMonth ? (isToday ? 'white' : 'var(--color-foreground)') : 'var(--color-muted-foreground)',
                      backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    {day.date}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event.id)
                        }}
                        className="w-full text-left rounded px-1 py-0.5 text-[10px] font-medium text-white truncate"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other }}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] px-1" style={{ color: 'var(--color-muted-foreground)' }}>
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Agenda view */}
      {viewMode === 'agenda' && (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {events.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No events this month.</p>
            </div>
          ) : (
            events
              .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                      {event.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {event.all_day
                        ? new Date(event.start_at).toLocaleDateString()
                        : `${new Date(event.start_at).toLocaleString()} - ${new Date(event.end_at).toLocaleTimeString()}`}
                    </p>
                  </div>
                  {event.requires_rsvp && (
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                      RSVP
                    </span>
                  )}
                </button>
              ))
          )}
        </div>
      )}

      {/* Week view placeholder */}
      {viewMode === 'week' && (
        <div className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Week view displays the current week&apos;s events in a day-by-day layout.
          </p>
        </div>
      )}
    </div>
  )
}
