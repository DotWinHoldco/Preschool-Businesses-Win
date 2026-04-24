'use server'

import {
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  UpdateAppointmentNotesSchema,
  type CancelAppointmentInput,
  type RescheduleAppointmentInput,
  type UpdateAppointmentNotesInput,
} from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { computeAvailableSlots } from '@/lib/calendar/availability-calculator'
import { sendAppointmentCancelledEmail } from '@/lib/email/appointment-emails'

type ActionResult = { ok: boolean; id?: string; error?: string }

export async function confirmAppointment(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!appt) return { ok: false, error: 'Appointment not found' }
  if (appt.status !== 'pending')
    return { ok: false, error: 'Only pending appointments can be confirmed' }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.confirm',
    entityType: 'appointment',
    entityId: id,
  })

  return { ok: true, id }
}

export async function cancelAppointment(input: CancelAppointmentInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CancelAppointmentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const { id, reason, cancelled_by } = parsed.data

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, booked_by_name, booked_by_email, start_at, appointment_types(name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!appt) return { ok: false, error: 'Appointment not found' }
  if (appt.status !== 'pending' && appt.status !== 'confirmed') {
    return { ok: false, error: 'Only pending or confirmed appointments can be cancelled' }
  }

  const status = cancelled_by === 'parent' ? 'cancelled_by_parent' : 'cancelled_by_staff'

  const { error } = await supabase
    .from('appointments')
    .update({
      status,
      cancellation_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.cancel',
    entityType: 'appointment',
    entityId: id,
    after: { status, reason },
  })

  try {
    const typeName =
      (appt.appointment_types as unknown as { name: string } | null)?.name ?? 'Appointment'
    await sendAppointmentCancelledEmail({
      tenantId,
      to: appt.booked_by_email as string,
      bookerName: appt.booked_by_name as string,
      appointmentTypeName: typeName,
      startAt: appt.start_at as string,
      reason: reason ?? null,
      cancelledBy: cancelled_by,
    })
  } catch (err) {
    console.error('[CancelAppointment] Cancellation email failed:', err)
  }

  return { ok: true, id }
}

export async function rescheduleAppointment(
  input: RescheduleAppointmentInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = RescheduleAppointmentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const { id, new_start_at, reason } = parsed.data

  const { data: original } = await supabase
    .from('appointments')
    .select('*, appointment_types(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!original) return { ok: false, error: 'Appointment not found' }
  if (original.status !== 'pending' && original.status !== 'confirmed') {
    return { ok: false, error: 'Only pending or confirmed appointments can be rescheduled' }
  }

  const apptType = original.appointment_types as Record<string, unknown>
  const targetDate = new Date(new_start_at.split('T')[0] + 'T00:00:00')

  const slots = await computeAvailableSlots(
    supabase,
    tenantId,
    {
      appointment_type_id: original.appointment_type_id as string,
      duration_minutes: apptType.duration_minutes as number,
      buffer_before_minutes: apptType.buffer_before_minutes as number,
      buffer_after_minutes: apptType.buffer_after_minutes as number,
      min_notice_hours: apptType.min_notice_hours as number,
      booking_window_days: apptType.booking_window_days as number,
      max_per_day: apptType.max_per_day as number | null,
      max_per_slot: apptType.max_per_slot as number,
      assigned_staff: apptType.assigned_staff as string[] | null,
      round_robin: apptType.round_robin as boolean,
    },
    targetDate,
  )

  const matchingSlot = slots.find((s) => s.start === new_start_at)
  if (!matchingSlot) return { ok: false, error: 'Selected time is no longer available' }

  const endAt = new Date(
    new Date(new_start_at).getTime() + (apptType.duration_minutes as number) * 60000,
  ).toISOString()

  const { error: updateErr } = await supabase
    .from('appointments')
    .update({
      status: 'rescheduled',
      cancellation_reason: reason ?? 'Rescheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (updateErr) return { ok: false, error: updateErr.message }

  const { data: newAppt, error: insertErr } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      appointment_type_id: original.appointment_type_id,
      booked_by_user_id: original.booked_by_user_id,
      booked_by_name: original.booked_by_name,
      booked_by_email: original.booked_by_email,
      booked_by_phone: original.booked_by_phone,
      start_at: new_start_at,
      end_at: endAt,
      timezone: original.timezone,
      staff_user_id: matchingSlot.staff_user_id ?? original.staff_user_id,
      status: 'confirmed',
      enrollment_application_id: original.enrollment_application_id,
      notes: original.notes,
      staff_notes: original.staff_notes,
      rescheduled_from_id: id,
      price_cents: original.price_cents,
    })
    .select('id')
    .single()

  if (insertErr || !newAppt)
    return { ok: false, error: insertErr?.message ?? 'Failed to create new appointment' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.reschedule',
    entityType: 'appointment',
    entityId: newAppt.id as string,
    before: { original_id: id, original_start: original.start_at },
    after: { new_start: new_start_at, reason },
  })

  return { ok: true, id: newAppt.id as string }
}

export async function completeAppointment(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, start_at')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!appt) return { ok: false, error: 'Appointment not found' }
  if (appt.status !== 'confirmed')
    return { ok: false, error: 'Only confirmed appointments can be completed' }
  if (new Date(appt.start_at as string) > new Date()) {
    return { ok: false, error: 'Cannot complete a future appointment' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.complete',
    entityType: 'appointment',
    entityId: id,
  })

  return { ok: true, id }
}

export async function markNoShow(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, start_at')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!appt) return { ok: false, error: 'Appointment not found' }
  if (appt.status !== 'confirmed')
    return { ok: false, error: 'Only confirmed appointments can be marked as no-show' }
  if (new Date(appt.start_at as string) > new Date()) {
    return { ok: false, error: 'Cannot mark a future appointment as no-show' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'no_show', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.no_show',
    entityType: 'appointment',
    entityId: id,
  })

  return { ok: true, id }
}

export async function updateAppointmentNotes(
  input: UpdateAppointmentNotesInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateAppointmentNotesSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const { id, staff_notes } = parsed.data

  const { error } = await supabase
    .from('appointments')
    .update({ staff_notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment.update_notes',
    entityType: 'appointment',
    entityId: id,
    after: { staff_notes },
  })

  return { ok: true, id }
}
