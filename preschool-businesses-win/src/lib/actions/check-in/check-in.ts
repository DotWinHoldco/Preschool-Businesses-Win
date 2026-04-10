'use server'

// @anchor: cca.checkin.action
// Check-in server action — validates input, checks allergies, creates records.
// See CCA_BUILD_BRIEF.md §7

import { CheckInSchema, type CheckInInput } from '@/lib/schemas/check-in'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTenantId,
  getStudentAllergies,
  getStudentDetails,
  getTodayDateString,
} from './helpers'

export interface CheckInResult {
  success: boolean
  error?: string
  student_name?: string
  classroom_name?: string
  allergies?: Array<{
    allergen: string
    severity: string
    medication_location: string | null
    epipen_on_site: boolean
  }>
  requires_allergy_acknowledgment?: boolean
  check_in_id?: string
}

export async function performCheckIn(
  input: CheckInInput,
): Promise<CheckInResult> {
  // ── Validate with Zod ──────────────────────────────────────────────────
  const parsed = CheckInSchema.safeParse(input)
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

  // ── Fetch allergies ────────────────────────────────────────────────────
  const allergyInfo = await getStudentAllergies(data.student_id)
  const requiresAck =
    allergyInfo.hasSevere || allergyInfo.hasLifeThreatening

  // If severe/life-threatening allergies exist, allergy_acknowledged must be true
  if (requiresAck && !data.allergy_acknowledged) {
    return {
      success: false,
      error: 'Allergy acknowledgment required for this student.',
      requires_allergy_acknowledgment: true,
      student_name:
        student.preferred_name ?? student.first_name,
      classroom_name: student.classroom_name ?? undefined,
      allergies: allergyInfo.allergies.map((a) => ({
        allergen: a.allergen,
        severity: a.severity,
        medication_location: a.medication_location,
        epipen_on_site: a.epipen_on_site,
      })),
    }
  }

  // ── Determine health screening pass ────────────────────────────────────
  const screening = data.health_screening
  const healthPassed = !(
    screening.has_fever ||
    screening.has_rash ||
    screening.has_vomiting ||
    screening.has_diarrhea
  )
  const healthNotes = !healthPassed
    ? [
        screening.has_fever && 'Fever reported',
        screening.has_rash && 'Rash reported',
        screening.has_vomiting && 'Vomiting reported',
        screening.has_diarrhea && 'Diarrhea reported',
        screening.notes,
      ]
        .filter(Boolean)
        .join('; ')
    : screening.notes ?? null

  // ── Create check_in record ─────────────────────────────────────────────
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      checked_in_at: new Date().toISOString(),
      method: data.method,
      temperature_f: data.temperature_f ?? null,
      health_screening_passed: healthPassed,
      health_notes: healthNotes,
      allergy_acknowledged: data.allergy_acknowledged ?? false,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (checkInError || !checkIn) {
    return {
      success: false,
      error: 'Failed to create check-in record. Please try again.',
    }
  }

  // ── Create/update attendance record for today ──────────────────────────
  const todayDate = getTodayDateString()

  const { data: existingAttendance } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('student_id', data.student_id)
    .eq('date', todayDate)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existingAttendance) {
    await supabase
      .from('attendance_records')
      .update({
        status: healthPassed ? 'present' : 'present',
        check_in_id: checkIn.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAttendance.id)
  } else {
    await supabase.from('attendance_records').insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      classroom_id: student.classroom_id,
      date: todayDate,
      status: healthPassed ? 'present' : 'present',
      check_in_id: checkIn.id,
    })
  }

  // ── Write to audit_log ─────────────────────────────────────────────────
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    action: 'check_in',
    entity_type: 'check_in',
    entity_id: checkIn.id,
    after: {
      student_id: data.student_id,
      method: data.method,
      health_screening_passed: healthPassed,
      allergy_acknowledged: data.allergy_acknowledged ?? false,
      health_notes: healthNotes,
    },
  })

  const displayName =
    student.preferred_name ?? student.first_name

  return {
    success: true,
    check_in_id: checkIn.id as string,
    student_name: displayName,
    classroom_name: student.classroom_name ?? undefined,
    allergies: allergyInfo.allergies.length > 0
      ? allergyInfo.allergies.map((a) => ({
          allergen: a.allergen,
          severity: a.severity,
          medication_location: a.medication_location,
          epipen_on_site: a.epipen_on_site,
        }))
      : undefined,
  }
}
