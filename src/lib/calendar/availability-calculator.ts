// @anchor: cca.appointments.availability
// Compute available time slots for a given appointment type on a given date.
// Combines staff availability patterns, date overrides, existing bookings,
// and synced external calendar busy times.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface TimeSlot {
  start: string // ISO datetime
  end: string
  staff_user_id: string | null
}

export interface AppointmentTypeSlotInput {
  appointment_type_id: string
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  min_notice_hours: number
  booking_window_days: number
  max_per_day: number | null
  max_per_slot: number
  assigned_staff: string[] | null
  round_robin: boolean
}

export interface BusyInterval {
  start: Date
  end: Date
}

interface AvailabilityRow {
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  appointment_type_id: string | null
}

interface OverrideRow {
  user_id: string
  date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
}

interface AppointmentRow {
  staff_user_id: string | null
  start_at: string
  end_at: string
  status: string
}

interface CalendarBusyJson {
  start: string
  end: string
}

interface CalendarConnectionRow {
  user_id: string
  synced_busy_times: CalendarBusyJson[] | null
}

function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10))
  const d = new Date(dateStr + 'T00:00:00')
  d.setHours(h, m, 0, 0)
  return d
}

function dayOfWeek(date: Date): number {
  return date.getDay()
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

/**
 * Compute available slots for an appointment type on a specific date.
 * Returns empty array if the date is outside the booking window or fully blocked.
 */
export async function computeAvailableSlots(
  supabase: SupabaseClient,
  tenantId: string,
  apptType: AppointmentTypeSlotInput,
  targetDate: Date,
  nowOverride?: Date,
): Promise<TimeSlot[]> {
  const now = nowOverride ?? new Date()
  const dateStr = targetDate.toISOString().slice(0, 10)

  // Booking window check
  const windowEnd = new Date(now)
  windowEnd.setDate(windowEnd.getDate() + apptType.booking_window_days)
  if (targetDate > windowEnd) return []

  // Past date check
  const endOfTargetDay = new Date(targetDate)
  endOfTargetDay.setHours(23, 59, 59, 999)
  if (endOfTargetDay < now) return []

  const minNoticeMs = apptType.min_notice_hours * 60 * 60 * 1000
  const earliestBookingTime = new Date(now.getTime() + minNoticeMs)

  const targetDow = dayOfWeek(targetDate)
  const staffIds = apptType.assigned_staff ?? []

  // Staff availability patterns (recurring weekly)
  let availabilityQuery = supabase
    .from('staff_availability')
    .select(
      'user_id, day_of_week, start_time, end_time, appointment_type_id, effective_from, effective_to',
    )
    .eq('tenant_id', tenantId)
    .eq('day_of_week', targetDow)
    .lte('effective_from', dateStr)
    .or(`effective_to.is.null,effective_to.gte.${dateStr}`)

  if (staffIds.length > 0) {
    availabilityQuery = availabilityQuery.in('user_id', staffIds)
  }

  const { data: availabilityRows } = await availabilityQuery
  const patterns = (availabilityRows ?? []).filter(
    (a: AvailabilityRow) =>
      a.appointment_type_id === null || a.appointment_type_id === apptType.appointment_type_id,
  )

  if (patterns.length === 0 && staffIds.length > 0) {
    // No availability for this day for assigned staff
    return []
  }

  // If no staff assigned AND no availability patterns, allow tenant-wide default
  // business hours of 9am-5pm as a reasonable fallback.
  let workIntervals: Array<{ user_id: string | null; start: Date; end: Date }> = []
  if (patterns.length === 0) {
    const dStart = parseTimeOnDate(dateStr, '09:00')
    const dEnd = parseTimeOnDate(dateStr, '17:00')
    workIntervals.push({ user_id: null, start: dStart, end: dEnd })
  } else {
    workIntervals = patterns.map((p: AvailabilityRow) => ({
      user_id: p.user_id,
      start: parseTimeOnDate(dateStr, p.start_time),
      end: parseTimeOnDate(dateStr, p.end_time),
    }))
  }

  // Date overrides
  const staffUserIdsForOverrides = workIntervals
    .map((w) => w.user_id)
    .filter((x): x is string => x !== null)
  let overrides: OverrideRow[] = []
  if (staffUserIdsForOverrides.length > 0) {
    const { data: overrideRows } = await supabase
      .from('staff_availability_overrides')
      .select('user_id, date, is_available, start_time, end_time')
      .eq('tenant_id', tenantId)
      .eq('date', dateStr)
      .in('user_id', staffUserIdsForOverrides)
    overrides = overrideRows ?? []
  }

  const blockedUsers = new Set(overrides.filter((o) => !o.is_available).map((o) => o.user_id))
  workIntervals = workIntervals.filter((w) => !(w.user_id && blockedUsers.has(w.user_id)))

  // Apply override custom hours
  for (const ov of overrides) {
    if (ov.is_available && ov.start_time && ov.end_time) {
      const idx = workIntervals.findIndex((w) => w.user_id === ov.user_id)
      const newStart = parseTimeOnDate(dateStr, ov.start_time)
      const newEnd = parseTimeOnDate(dateStr, ov.end_time)
      if (idx >= 0) {
        workIntervals[idx] = { user_id: ov.user_id, start: newStart, end: newEnd }
      } else {
        workIntervals.push({ user_id: ov.user_id, start: newStart, end: newEnd })
      }
    }
  }

  if (workIntervals.length === 0) return []

  // Existing bookings (block matching staff, and respect max_per_day/max_per_slot)
  const startOfDay = new Date(dateStr + 'T00:00:00')
  const endOfDay = new Date(dateStr + 'T23:59:59')

  const { data: existingBookings } = await supabase
    .from('appointments')
    .select('staff_user_id, start_at, end_at, status')
    .eq('tenant_id', tenantId)
    .eq('appointment_type_id', apptType.appointment_type_id)
    .gte('start_at', startOfDay.toISOString())
    .lte('start_at', endOfDay.toISOString())
    .not('status', 'in', '(cancelled_by_parent,cancelled_by_staff)')

  const bookingsToday: AppointmentRow[] = existingBookings ?? []

  if (apptType.max_per_day !== null && bookingsToday.length >= apptType.max_per_day) {
    return []
  }

  // External calendar busy times for these staff
  const busyIntervals: Array<{ user_id: string; intervals: BusyInterval[] }> = []
  if (staffUserIdsForOverrides.length > 0) {
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('user_id, synced_busy_times')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .in('user_id', staffUserIdsForOverrides)

    for (const conn of (connections ?? []) as CalendarConnectionRow[]) {
      const intervals = (conn.synced_busy_times ?? [])
        .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
        .filter((b) => b.end >= startOfDay && b.start <= endOfDay)
      busyIntervals.push({ user_id: conn.user_id, intervals })
    }
  }

  // Slot generation (30-min grain or duration grain, whichever is larger)
  const slotMinutes = Math.max(30, apptType.duration_minutes)
  const durationMs = apptType.duration_minutes * 60 * 1000
  const bufferBeforeMs = apptType.buffer_before_minutes * 60 * 1000
  const bufferAfterMs = apptType.buffer_after_minutes * 60 * 1000

  const slots: TimeSlot[] = []

  for (const work of workIntervals) {
    let cursor = new Date(work.start)
    while (cursor.getTime() + durationMs <= work.end.getTime()) {
      const slotStart = new Date(cursor)
      const slotEnd = new Date(cursor.getTime() + durationMs)
      const slotBlockStart = new Date(slotStart.getTime() - bufferBeforeMs)
      const slotBlockEnd = new Date(slotEnd.getTime() + bufferAfterMs)

      if (slotStart < earliestBookingTime) {
        cursor = new Date(cursor.getTime() + slotMinutes * 60 * 1000)
        continue
      }

      // Check existing bookings (per staff)
      const sameStaffBookings = bookingsToday.filter(
        (b) => work.user_id === null || b.staff_user_id === work.user_id,
      )
      const bookingConflicts = sameStaffBookings.filter((b) =>
        intervalsOverlap(new Date(b.start_at), new Date(b.end_at), slotBlockStart, slotBlockEnd),
      )

      if (apptType.max_per_slot > 0 && bookingConflicts.length >= apptType.max_per_slot) {
        cursor = new Date(cursor.getTime() + slotMinutes * 60 * 1000)
        continue
      }

      // Check external calendar busy
      if (work.user_id) {
        const busy = busyIntervals.find((b) => b.user_id === work.user_id)
        if (busy) {
          const clash = busy.intervals.some((b) =>
            intervalsOverlap(b.start, b.end, slotBlockStart, slotBlockEnd),
          )
          if (clash) {
            cursor = new Date(cursor.getTime() + slotMinutes * 60 * 1000)
            continue
          }
        }
      }

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        staff_user_id: work.user_id,
      })

      cursor = new Date(cursor.getTime() + slotMinutes * 60 * 1000)
    }
  }

  // Deduplicate identical timestamps from multiple staff (offer earliest only)
  const seen = new Set<string>()
  const unique: TimeSlot[] = []
  for (const s of slots.sort((a, b) => a.start.localeCompare(b.start))) {
    if (!seen.has(s.start)) {
      seen.add(s.start)
      unique.push(s)
    }
  }

  return unique
}
