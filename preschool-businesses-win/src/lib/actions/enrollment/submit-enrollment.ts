'use server'

// @anchor: cca.enrollment.submit
// Server action for enrollment application submission.
// Honeypot check → Zod validate → Supabase insert → auto-create lead → return success.

import { EnrollmentSubmitSchema, type EnrollmentSubmitData } from '@/lib/schemas/enrollment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'

interface SubmitResult {
  ok: boolean
  error?: string
  applicationId?: string
}

/**
 * Compute a naive triage score for the application.
 * Full scoring uses classroom capacity data — this is a placeholder.
 */
function computeTriageScore(data: EnrollmentSubmitData): number {
  let score = 50 // Base score

  // Sibling bonus
  if (data.sibling_enrolled) score += 15

  // Faith community bonus
  if (data.faith_community && data.faith_community.trim().length > 0) score += 10

  // Program demand weighting
  if (data.program_type === 'prek') score += 10
  if (data.program_type === 'infant') score += 5

  return Math.min(score, 100)
}

export async function submitEnrollment(
  raw: EnrollmentSubmitData,
): Promise<SubmitResult> {
  // --- Honeypot check ---
  if (raw.website && raw.website.length > 0) {
    // Bot detected — silently succeed to avoid revealing the trap
    return { ok: true, applicationId: 'honeypot' }
  }

  // --- Zod validation ---
  const parsed = EnrollmentSubmitSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  try {
    // --- Insert enrollment application ---
    const triageScore = computeTriageScore(data)

    const { data: app, error: appError } = await supabase
      .from('enrollment_applications')
      .insert({
        tenant_id: tenantId,
        parent_first_name: data.first_name,
        parent_last_name: data.last_name,
        parent_email: data.email,
        parent_phone: data.phone,
        student_first_name: data.child_first_name,
        student_last_name: data.child_last_name,
        student_dob: data.child_dob,
        desired_start_date: data.desired_start_date,
        program_type: data.program_type,
        how_heard: data.how_heard || null,
        faith_community: data.faith_community || null,
        notes: [
          data.notes,
          data.allergies_or_medical ? `Allergies/Medical: ${data.allergies_or_medical}` : '',
          data.special_needs ? `Special needs: ${data.special_needs}` : '',
          data.sibling_enrolled ? `Sibling enrolled: ${data.sibling_name || 'Yes'}` : '',
          `Gender: ${data.gender}`,
          `Schedule: ${data.schedule_preference}`,
          `Relationship: ${data.relationship_to_child}`,
        ]
          .filter(Boolean)
          .join('\n'),
        triage_status: 'new',
        triage_score: triageScore,
      })
      .select('id')
      .single()

    if (appError) {
      console.error('Enrollment insert error:', appError)
      return { ok: false, error: 'Something went wrong. Please try again.' }
    }

    // --- Auto-create enrollment lead ---
    await supabase.from('enrollment_leads').insert({
      tenant_id: tenantId,
      source: 'website',
      source_detail: 'enrollment_form',
      parent_first_name: data.first_name,
      parent_last_name: data.last_name,
      parent_email: data.email,
      parent_phone: data.phone,
      child_name: `${data.child_first_name} ${data.child_last_name}`,
      program_interest: data.program_type,
      status: 'application_received',
      priority: triageScore >= 70 ? 'hot' : triageScore >= 50 ? 'warm' : 'cold',
      notes: `Auto-created from enrollment application ${app.id}`,
    })

    // TODO: Send Resend notification email to director
    // await sendDirectorNotification(data)

    return { ok: true, applicationId: app.id }
  } catch (err) {
    console.error('Enrollment submit error:', err)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}
