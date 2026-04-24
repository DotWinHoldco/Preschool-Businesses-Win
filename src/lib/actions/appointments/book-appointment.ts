'use server'

// @anchor: cca.appointments.book

import { BookAppointmentSchema, type BookAppointmentInput } from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { computeAvailableSlots } from '@/lib/calendar/availability-calculator'
import { sendBookingConfirmationEmail } from '@/lib/email/appointment-emails'

interface BookResult {
  ok: boolean
  error?: string
  id?: string
  confirmation_token?: string
}

interface AppointmentTypeRow {
  id: string
  tenant_id: string
  name: string
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  min_notice_hours: number
  booking_window_days: number
  max_per_day: number | null
  max_per_slot: number
  assigned_staff: string[] | null
  round_robin: boolean
  location: string | null
  linked_pipeline_stage: string | null
  auto_confirm: boolean
  require_confirmation: boolean
}

/**
 * Public booking action — no auth required.
 * Resolves the tenant via the appointment_type_id (which is tenant-scoped).
 */
export async function bookAppointment(input: BookAppointmentInput): Promise<BookResult> {
  const parsed = BookAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data

  if (data.website && data.website.length > 0) {
    // Honeypot — silently succeed
    return { ok: true, id: 'honeypot' }
  }

  const supabase = createAdminClient()

  const { data: apptType, error: typeError } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('id', data.appointment_type_id)
    .eq('is_active', true)
    .single<AppointmentTypeRow>()

  if (typeError || !apptType) {
    return { ok: false, error: 'Appointment type not found' }
  }

  const tenantId = apptType.tenant_id

  const startAt = new Date(data.start_at)
  const targetDate = new Date(startAt)
  targetDate.setHours(0, 0, 0, 0)

  const slots = await computeAvailableSlots(
    supabase,
    tenantId,
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
    targetDate,
  )

  const match = slots.find((s) => new Date(s.start).getTime() === startAt.getTime())
  if (!match) {
    return { ok: false, error: 'That time slot is no longer available.' }
  }

  const endAt = new Date(startAt.getTime() + apptType.duration_minutes * 60 * 1000)

  let staffUserId = data.staff_user_id ?? match.staff_user_id ?? null

  if (
    apptType.round_robin &&
    !staffUserId &&
    apptType.assigned_staff &&
    apptType.assigned_staff.length > 0
  ) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: counts } = await supabase
      .from('appointments')
      .select('staff_user_id')
      .eq('tenant_id', tenantId)
      .gte('start_at', weekAgo.toISOString())
      .in('staff_user_id', apptType.assigned_staff)

    const countMap = new Map<string, number>()
    apptType.assigned_staff.forEach((s) => countMap.set(s, 0))
    for (const row of counts ?? []) {
      if (row.staff_user_id) {
        countMap.set(row.staff_user_id, (countMap.get(row.staff_user_id) ?? 0) + 1)
      }
    }

    let leastCount = Infinity
    for (const [staff, count] of countMap.entries()) {
      if (count < leastCount) {
        leastCount = count
        staffUserId = staff
      }
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      appointment_type_id: apptType.id,
      booked_by_name: data.booked_by_name,
      booked_by_email: data.booked_by_email,
      booked_by_phone: data.booked_by_phone ?? null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      timezone: data.timezone,
      staff_user_id: staffUserId,
      status: apptType.require_confirmation ? 'pending' : 'confirmed',
      enrollment_application_id: data.application_id ?? null,
      notes: data.notes ?? null,
    })
    .select('id, confirmation_token')
    .single()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? 'Failed to book appointment' }
  }

  // Pipeline integration: if this is an interview for an application, advance the stage.
  if (data.application_id && apptType.linked_pipeline_stage) {
    await supabase
      .from('enrollment_applications')
      .update({
        pipeline_stage: apptType.linked_pipeline_stage,
        interview_scheduled_at: startAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.application_id)
      .eq('tenant_id', tenantId)

    await supabase.from('application_pipeline_steps').insert({
      tenant_id: tenantId,
      application_id: data.application_id,
      step_type: apptType.linked_pipeline_stage,
      status: 'active',
      notes: `Appointment booked for ${startAt.toISOString()}`,
      metadata: { appointment_id: inserted.id },
    })
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: 'anonymous',
    action: 'appointment.book',
    entityType: 'appointment',
    entityId: inserted.id as string,
    after: {
      appointment_type_id: apptType.id,
      start_at: startAt.toISOString(),
      booked_by_email: data.booked_by_email,
    },
  })

  try {
    await sendBookingConfirmationEmail({
      tenantId,
      to: data.booked_by_email,
      bookerName: data.booked_by_name,
      appointmentTypeName: apptType.name,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      location: apptType.location,
      confirmationToken: (inserted.confirmation_token as string) ?? null,
    })
  } catch (err) {
    console.error('[BookAppointment] Confirmation email failed:', err)
  }

  return {
    ok: true,
    id: inserted.id as string,
    confirmation_token: inserted.confirmation_token as string,
  }
}
