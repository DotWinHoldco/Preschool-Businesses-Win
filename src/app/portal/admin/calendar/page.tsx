// @anchor: cca.calendar.admin-page

import {
  CalendarClient,
  type CalendarEvent,
} from '@/components/portal/calendar/calendar-client'

// Mock events — replace with Supabase fetch when calendar_events table exists
function getMockEvents(): CalendarEvent[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (d: number) => `${y}-${pad(m)}-${pad(d)}`

  return [
    {
      id: 'mock-1',
      title: 'Staff Meeting',
      date: dateStr(Math.min(3, 28)),
      time_start: '08:00',
      time_end: '09:00',
      all_day: false,
      location: 'Conference Room',
      notes: 'Monthly all-hands staff meeting.',
    },
    {
      id: 'mock-2',
      title: 'Parent-Teacher Conference',
      date: dateStr(Math.min(10, 28)),
      time_start: '14:00',
      time_end: '18:00',
      all_day: false,
      location: 'Classrooms',
      notes: 'Individual 15-minute slots with families.',
    },
    {
      id: 'mock-3',
      title: 'Spring Break - No School',
      date: dateStr(Math.min(15, 28)),
      time_start: null,
      time_end: null,
      all_day: true,
      location: null,
      notes: null,
    },
    {
      id: 'mock-4',
      title: 'Fire Drill',
      date: dateStr(Math.min(18, 28)),
      time_start: '10:30',
      time_end: '10:45',
      all_day: false,
      location: 'Front Parking Lot',
      notes: 'Quarterly fire evacuation drill.',
    },
    {
      id: 'mock-5',
      title: 'Chapel Service',
      date: dateStr(Math.min(22, 28)),
      time_start: '09:00',
      time_end: '09:30',
      all_day: false,
      location: 'Sanctuary',
      notes: null,
    },
    {
      id: 'mock-6',
      title: 'Field Day',
      date: dateStr(Math.min(25, 28)),
      time_start: '09:00',
      time_end: '12:00',
      all_day: false,
      location: 'Playground',
      notes: 'Outdoor activities and games for all classes.',
    },
  ]
}

export default function AdminCalendarPage() {
  const events = getMockEvents()

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          School Calendar
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          View and manage school events, closures, and activities.
        </p>
      </div>

      <CalendarClient initialEvents={events} />
    </div>
  )
}
