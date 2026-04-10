'use server'

// @anchor: cca.checkin.checkout-action
// Check-out server action — verifies authorized pickup, creates records.
// See CCA_BUILD_BRIEF.md §7

import { CheckOutSchema, type CheckOutInput } from '@/lib/schemas/check-in'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTenantId,
  getStudentDetails,
  getTodayDateString,
} from './helpers'
import { verifyPickupPerson } from './verify-pickup'

export interface CheckOutResult {
  success: boolean
  error?: string
  pickup_authorized?: boolean
  student_name?: string
  checkout_time?: string
  pickup_person_name?: string
  check_out_id?: string
  unauthorized_reason?: string
}

export async function performCheckOut(
  input: CheckOutInput,
): Promise<CheckOutResult> {
  // ── Validate with Zod ──────────────────────────────────────────────────
  const parsed = CheckOutSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  // ── Fetch student details ──────────────────────────────────────────────
  const student = await getStudentDetails(data.student_id)
  if (!student) {
    return { success: false, error: 'Student not found.' }
  }

  // ── Verify pickup person is authorized ─────────────────────────────────
  const verification = await verifyPickupPerson({
    student_id: data.student_id,
    pickup_person_name: data.pickup_person_name,
  })

  const isAuthorized = verification.authorized || data.staff_override === true
  const checkoutTime = new Date().toISOString()

  if (!isAuthorized) {
    // Log the unauthorized attempt to audit
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      action: 'unauthorized_pickup_attempt',
      entity_type: 'check_out',
      entity_id: data.student_id,
      after: {
        student_id: data.student_id,
        pickup_person_name: data.pickup_person_name,
        pickup_person_relationship: data.pickup_person_relationship,
        reason: verification.reason,
      },
    })

    // Create a check_out record marked as unauthorized
    await supabase.from('check_outs').insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      checked_out_at: checkoutTime,
      method: data.method,
      pickup_person_name: data.pickup_person_name,
      pickup_person_relationship: data.pickup_person_relationship,
      pickup_authorized: false,
      photo_match_verified: false,
      staff_override: false,
      notes: `BLOCKED: ${verification.reason}`,
    })

    const displayName =
      student.preferred_name ?? student.first_name

    return {
      success: false,
      pickup_authorized: false,
      student_name: displayName,
      pickup_person_name: data.pickup_person_name,
      unauthorized_reason: verification.reason,
      error: `Pickup not authorized: ${verification.reason}`,
    }
  }

  // ── Create check_out record ────────────────────────────────────────────
  const { data: checkOut, error: checkOutError } = await supabase
    .from('check_outs')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      checked_out_at: checkoutTime,
      method: data.method,
      pickup_person_name: data.pickup_person_name,
      pickup_person_relationship: data.pickup_person_relationship,
      pickup_authorized: true,
      photo_match_verified: data.photo_match_verified ?? false,
      staff_override: data.staff_override ?? false,
      staff_override_reason: data.staff_override_reason ?? null,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (checkOutError || !checkOut) {
    return {
      success: false,
      error: 'Failed to create check-out record. Please try again.',
    }
  }

  // ── Update attendance record ───────────────────────────────────────────
  const todayDate = getTodayDateString()
  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('id, check_in_id')
    .eq('student_id', data.student_id)
    .eq('date', todayDate)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (attendance) {
    // Calculate hours present if we have a check-in time
    let hoursPresent: number | null = null
    if (attendance.check_in_id) {
      const { data: checkInRecord } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('id', attendance.check_in_id)
        .maybeSingle()

      if (checkInRecord?.checked_in_at) {
        const checkedInAt = new Date(checkInRecord.checked_in_at as string)
        const checkedOutAt = new Date(checkoutTime)
        hoursPresent =
          (checkedOutAt.getTime() - checkedInAt.getTime()) /
          (1000 * 60 * 60)
        hoursPresent = Math.round(hoursPresent * 100) / 100
      }
    }

    await supabase
      .from('attendance_records')
      .update({
        check_out_id: checkOut.id,
        hours_present: hoursPresent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attendance.id)
  }

  // ── Write to audit_log ─────────────────────────────────────────────────
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    action: 'check_out',
    entity_type: 'check_out',
    entity_id: checkOut.id,
    after: {
      student_id: data.student_id,
      pickup_person_name: data.pickup_person_name,
      pickup_person_relationship: data.pickup_person_relationship,
      pickup_authorized: true,
      photo_match_verified: data.photo_match_verified ?? false,
      staff_override: data.staff_override ?? false,
    },
  })

  const displayName =
    student.preferred_name ?? student.first_name

  return {
    success: true,
    check_out_id: checkOut.id as string,
    pickup_authorized: true,
    student_name: displayName,
    checkout_time: checkoutTime,
    pickup_person_name: data.pickup_person_name,
  }
}
