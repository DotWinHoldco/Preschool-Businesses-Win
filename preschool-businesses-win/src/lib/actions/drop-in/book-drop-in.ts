'use server'

// @anchor: cca.dropin.book
// Book a drop-in day for a student
// See CCA_BUILD_BRIEF.md §31

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import {
  BookDropInSchema,
  CancelDropInSchema,
  type BookDropInInput,
  type CancelDropInInput,
} from '@/lib/schemas/drop-in'

export async function bookDropIn(input: BookDropInInput) {
  await assertRole('parent')
  const parsed = BookDropInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Check availability
  const { data: availability, error: availError } = await supabase
    .from('drop_in_availability')
    .select('id, slots_total, rate_cents, half_day_rate_cents, status')
    .eq('classroom_id', parsed.data.classroom_id)
    .eq('date', parsed.data.date)
    .eq('tenant_id', tenantId)
    .single()

  if (availError || !availability) {
    return { ok: false as const, error: { _form: ['No availability found for this date'] } }
  }

  if (availability.status === 'closed' || availability.status === 'full') {
    return { ok: false as const, error: { _form: ['This date is not available for drop-in'] } }
  }

  // Count existing bookings
  const { count } = await supabase
    .from('drop_in_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('classroom_id', parsed.data.classroom_id)
    .eq('date', parsed.data.date)
    .in('status', ['confirmed', 'completed'])
    .eq('tenant_id', tenantId)

  if (count !== null && count >= (availability.slots_total as number)) {
    return { ok: false as const, error: { _form: ['No drop-in slots remaining for this date'] } }
  }

  // Check for duplicate booking (same student, same date, same classroom)
  const { data: existing } = await supabase
    .from('drop_in_bookings')
    .select('id')
    .eq('student_id', parsed.data.student_id)
    .eq('date', parsed.data.date)
    .eq('classroom_id', parsed.data.classroom_id)
    .in('status', ['confirmed', 'completed'])
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existing) {
    return { ok: false as const, error: { _form: ['Student already has a booking for this date'] } }
  }

  // Determine rate
  const isHalfDay = parsed.data.booking_type !== 'full_day'
  const rateCents = isHalfDay
    ? ((availability.half_day_rate_cents as number | null) ?? (availability.rate_cents as number))
    : (availability.rate_cents as number)

  const { data: booking, error: bookError } = await supabase
    .from('drop_in_bookings')
    .insert({
      tenant_id: tenantId,
      student_id: parsed.data.student_id,
      family_id: parsed.data.family_id,
      classroom_id: parsed.data.classroom_id,
      date: parsed.data.date,
      booking_type: parsed.data.booking_type,
      status: 'confirmed',
      booked_at: new Date().toISOString(),
      booked_by: actorId,
      rate_charged_cents: rateCents,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (bookError) {
    return { ok: false as const, error: { _form: [bookError.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'drop_in.book',
    entityType: 'drop_in_booking',
    entityId: booking.id as string,
    after: { student_id: parsed.data.student_id, date: parsed.data.date, booking_type: parsed.data.booking_type },
  })

  return { ok: true as const, bookingId: booking.id as string, rateCents }
}

export async function cancelDropIn(input: CancelDropInInput) {
  await assertRole('parent')
  const parsed = CancelDropInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('drop_in_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: parsed.data.cancel_reason,
    })
    .eq('id', parsed.data.booking_id)
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'drop_in.cancel',
    entityType: 'drop_in_booking',
    entityId: parsed.data.booking_id,
    before: { status: 'confirmed' },
    after: { status: 'cancelled', cancel_reason: parsed.data.cancel_reason },
  })

  return { ok: true as const }
}
