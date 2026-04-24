'use server'

// @anchor: cca.appointments.availability.get
// Public server action returning available slots for a tenant's appointment type.

import { createAdminClient } from '@/lib/supabase/admin'
import { computeAvailableSlots, type TimeSlot } from '@/lib/calendar/availability-calculator'

interface AppointmentTypeRow {
  id: string
  tenant_id: string
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function getAvailableSlots(
  appointmentTypeId: string,
  dateIso: string,
): Promise<TimeSlot[]> {
  if (!UUID_RE.test(appointmentTypeId)) return []
  if (!DATE_RE.test(dateIso) || isNaN(Date.parse(dateIso))) return []

  const supabase = createAdminClient()

  const { data: apptType } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('id', appointmentTypeId)
    .eq('is_active', true)
    .single<AppointmentTypeRow>()

  if (!apptType) return []

  const date = new Date(dateIso)
  return computeAvailableSlots(
    supabase,
    apptType.tenant_id,
    {
      appointment_type_id: apptType.id,
      duration_minutes: apptType.duration_minutes,
      buffer_before_minutes: apptType.buffer_before_minutes,
      buffer_after_minutes: apptType.buffer_after_minutes,
      min_notice_hours: apptType.min_notice_hours,
      booking_window_days: apptType.booking_window_days,
      max_per_day: apptType.max_per_day,
      max_per_slot: apptType.max_per_slot,
      assigned_staff: apptType.assigned_staff,
      round_robin: apptType.round_robin,
    },
    date,
  )
}

export async function getAvailableDates(
  appointmentTypeId: string,
  monthStartIso: string,
): Promise<string[]> {
  if (!UUID_RE.test(appointmentTypeId)) return []
  if (!DATE_RE.test(monthStartIso) || isNaN(Date.parse(monthStartIso))) return []

  const supabase = createAdminClient()

  const { data: apptType } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('id', appointmentTypeId)
    .eq('is_active', true)
    .single<AppointmentTypeRow>()

  if (!apptType) return []

  const monthStart = new Date(monthStartIso)
  const available: string[] = []

  // Scan each day in the month (limited by booking_window_days)
  const now = new Date()
  const windowEnd = new Date(now)
  windowEnd.setDate(windowEnd.getDate() + apptType.booking_window_days)

  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

  for (let d = 1; d <= daysInMonth; d += 1) {
    const check = new Date(monthStart.getFullYear(), monthStart.getMonth(), d)
    if (check < now) continue
    if (check > windowEnd) break

    const slots = await computeAvailableSlots(
      supabase,
      apptType.tenant_id,
      {
        appointment_type_id: apptType.id,
        duration_minutes: apptType.duration_minutes,
        buffer_before_minutes: apptType.buffer_before_minutes,
        buffer_after_minutes: apptType.buffer_after_minutes,
        min_notice_hours: apptType.min_notice_hours,
        booking_window_days: apptType.booking_window_days,
        max_per_day: apptType.max_per_day,
        max_per_slot: apptType.max_per_slot,
        assigned_staff: apptType.assigned_staff,
        round_robin: apptType.round_robin,
      },
      check,
    )
    if (slots.length > 0) {
      available.push(check.toISOString().slice(0, 10))
    }
  }

  return available
}
