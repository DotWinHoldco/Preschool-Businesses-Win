// @anchor: cca.staff.my-schedule-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Schedule | Staff Portal',
  description: 'View your weekly schedule, classroom assignments, and shifts',
}

export default function StaffMySchedulePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const mockSchedule = [
    { day: 'Monday', shifts: [{ time: '7:00 AM - 3:00 PM', classroom: 'Butterfly Room', role: 'Lead Teacher' }] },
    { day: 'Tuesday', shifts: [{ time: '7:00 AM - 3:00 PM', classroom: 'Butterfly Room', role: 'Lead Teacher' }] },
    { day: 'Wednesday', shifts: [
      { time: '7:00 AM - 12:00 PM', classroom: 'Butterfly Room', role: 'Lead Teacher' },
      { time: '12:00 PM - 3:00 PM', classroom: 'Sunshine Room', role: 'Floater' },
    ]},
    { day: 'Thursday', shifts: [{ time: '7:00 AM - 3:00 PM', classroom: 'Butterfly Room', role: 'Lead Teacher' }] },
    { day: 'Friday', shifts: [{ time: '7:00 AM - 3:00 PM', classroom: 'Butterfly Room', role: 'Lead Teacher' }] },
  ]

  const mockUpcoming = [
    { date: 'April 10 (Thu)', event: 'Staff Meeting', time: '3:30 - 4:30 PM' },
    { date: 'April 14 (Mon)', event: 'PTO - Approved', time: 'All Day' },
    { date: 'April 18 (Fri)', event: 'Fire Drill', time: '10:00 AM' },
  ]

  const weekStats = {
    scheduledHours: 40,
    workedHours: 24.5,
    overtimeHours: 0,
    ptoRemaining: '48 hrs',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            My Schedule
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Week of April 7 - 11, 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Previous Week
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Next Week
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Request PTO
          </button>
        </div>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Scheduled', value: `${weekStats.scheduledHours} hrs` },
          { label: 'Worked (so far)', value: `${weekStats.workedHours} hrs` },
          { label: 'Overtime', value: `${weekStats.overtimeHours} hrs` },
          { label: 'PTO Remaining', value: weekStats.ptoRemaining },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly schedule */}
      <div className="space-y-3">
        {mockSchedule.map((day) => (
          <div
            key={day.day}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{day.day}</h3>
            <div className="mt-2 space-y-2">
              {day.shifts.map((shift, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-36 text-sm font-mono" style={{ color: 'var(--color-muted-foreground)' }}>{shift.time}</span>
                  <span
                    className="rounded-full px-3 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  >
                    {shift.classroom}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{shift.role}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Upcoming Events
        </h2>
        <div className="mt-3 space-y-3">
          {mockUpcoming.map((event) => (
            <div key={event.event} className="flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <span className="w-28 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{event.date}</span>
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{event.event}</span>
              <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
