// @anchor: cca.staff.my-schedule-page
// Staff weekly schedule and upcoming events — real Supabase data.

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'My Schedule | Staff Portal',
  description: 'View your weekly schedule, classroom assignments, and shifts',
}

export default async function StaffMySchedulePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // --- Weekly schedule ---
  const { data: scheduleRows } = await supabase
    .from('staff_schedules')
    .select('day_of_week, start_time, end_time, classrooms(name), role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // Group schedule by day
  type Shift = { time: string; classroom: string; role: string }
  const scheduleByDay: Record<string, Shift[]> = {}
  for (const day of weekdays) {
    scheduleByDay[day] = []
  }
  for (const row of scheduleRows ?? []) {
    const r = row as Record<string, unknown>
    const dayName = dayNames[r.day_of_week as number] ?? 'Unknown'
    if (!scheduleByDay[dayName]) scheduleByDay[dayName] = []
    const classroom = r.classrooms as Record<string, unknown> | null
    scheduleByDay[dayName].push({
      time: `${r.start_time} - ${r.end_time}`,
      classroom: (classroom?.name as string) ?? 'Unassigned',
      role: (r.role as string) ?? 'Staff',
    })
  }

  const schedule = weekdays.map((day) => ({
    day,
    shifts: scheduleByDay[day] ?? [],
  }))

  // Calculate weekly stats from schedule
  let scheduledHours = 0
  for (const row of scheduleRows ?? []) {
    const r = row as Record<string, unknown>
    const start = r.start_time as string
    const end = r.end_time as string
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number)
      const [eh, em] = end.split(':').map(Number)
      scheduledHours += (eh + em / 60) - (sh + sm / 60)
    }
  }

  // --- Assigned classrooms for event filtering ---
  const { data: assignments } = await supabase
    .from('classroom_staff_assignments')
    .select('classroom_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  const classroomIds = (assignments ?? []).map((a: Record<string, unknown>) => a.classroom_id as string)

  // --- Upcoming events ---
  const now = new Date().toISOString()
  let upcomingQuery = supabase
    .from('calendar_events')
    .select('id, title, start_at, end_at, scope, classroom_id')
    .eq('tenant_id', tenantId)
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(10)

  const { data: eventRows } = await upcomingQuery

  // Filter events: school-wide, staff-only, or in assigned classrooms
  const upcomingEvents = (eventRows ?? []).filter((e: Record<string, unknown>) => {
    const scope = e.scope as string
    if (scope === 'school_wide' || scope === 'staff_only') return true
    if (scope === 'classroom' && classroomIds.includes(e.classroom_id as string)) return true
    return false
  }).map((e: Record<string, unknown>) => {
    const startDate = new Date(e.start_at as string)
    return {
      date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }),
      event: e.title as string,
      time: e.end_at
        ? `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(e.end_at as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }
  })

  // --- Time entries for worked hours this week ---
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('clock_in_at, clock_out_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .gte('clock_in_at', weekStart.toISOString())

  let workedHours = 0
  for (const entry of timeEntries ?? []) {
    const e = entry as Record<string, unknown>
    if (e.clock_in_at && e.clock_out_at) {
      const diff = new Date(e.clock_out_at as string).getTime() - new Date(e.clock_in_at as string).getTime()
      workedHours += diff / 3600000
    }
  }

  const overtimeHours = Math.max(0, workedHours - 40)

  // Week label
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4)
  const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`

  const hasSchedule = schedule.some((d) => d.shifts.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            My Schedule
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {weekLabel}
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
          { label: 'Scheduled', value: `${scheduledHours.toFixed(1)} hrs` },
          { label: 'Worked (so far)', value: `${workedHours.toFixed(1)} hrs` },
          { label: 'Overtime', value: `${overtimeHours.toFixed(1)} hrs` },
          { label: 'PTO Remaining', value: '—' },
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
      {!hasSchedule ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No schedule entries found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((day) => (
            <div
              key={day.day}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{day.day}</h3>
              <div className="mt-2 space-y-2">
                {day.shifts.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Off</p>
                ) : (
                  day.shifts.map((shift, i) => (
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
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming events */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Upcoming Events
        </h2>
        <div className="mt-3 space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No upcoming events.
            </p>
          ) : (
            upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <span className="w-28 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{event.date}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{event.event}</span>
                <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{event.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
