'use server'

// @anchor: cca.enrollment.submit-system
// System enrollment form submission: creates one form_response, one
// enrollment_application per child, one enrollment_lead, and records the
// initial pipeline step for each application.

import {
  SystemEnrollmentSchema,
  type SystemEnrollmentData,
  type ChildData,
} from '@/lib/schemas/enrollment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { createApplicantAccount } from './create-applicant-account'
import { emitServerConversion } from '@/lib/analytics/emit'

interface SubmitResult {
  ok: boolean
  error?: string
  response_id?: string
  application_ids?: string[]
  magic_link_sent?: boolean
}

function computeTriageScore(data: SystemEnrollmentData, child: ChildData): number {
  let score = 50
  if (data.has_sibling_enrolled) score += 15
  if (data.faith_community && data.faith_community.trim().length > 0) score += 10
  if (data.how_heard === 'referral') score += 10
  if (child.program_type === 'prek') score += 10
  if (child.program_type === 'infant') score += 5
  return Math.min(score, 100)
}

export async function submitSystemEnrollment(raw: SystemEnrollmentData): Promise<SubmitResult> {
  if (raw.website && raw.website.length > 0) {
    return { ok: true, response_id: 'honeypot', application_ids: [] }
  }

  const parsed = SystemEnrollmentSchema.safeParse(raw)
  if (!parsed.success) {
    console.error(
      '[Enrollment] Zod validation failed:',
      JSON.stringify(parsed.error.issues, null, 2),
    )
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { ok: false, error: msg || 'Validation failed' }
  }

  const data = parsed.data

  let responseId: string | undefined

  try {
    const tenantId = await getTenantId()
    const supabase = createAdminClient()
    // Link to the system enrollment form if one is seeded for this tenant
    if (data.form_id) {
      const { data: response } = await supabase
        .from('form_responses')
        .insert({
          tenant_id: tenantId,
          form_id: data.form_id,
          respondent_email: data.parent_email,
          respondent_name: `${data.parent_first_name} ${data.parent_last_name}`,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (response) responseId = response.id as string
    }

    const applicationIds: string[] = []
    const applicationMetadata = {
      parent: {
        address_street: data.parent_address_street ?? '',
        address_city: data.parent_address_city ?? '',
        address_state: data.parent_address_state ?? '',
        address_zip: data.parent_address_zip ?? '',
        occupation: data.parent_occupation,
        work_phone: data.parent_work_phone,
        drivers_license: data.parent_drivers_license,
      },
      other_parent: data.has_other_parent
        ? {
            name: data.other_parent_name,
            same_address: data.other_parent_same_address,
            address_street: data.other_parent_address_street ?? '',
            address_city: data.other_parent_address_city ?? '',
            address_state: data.other_parent_address_state ?? '',
            address_zip: data.other_parent_address_zip ?? '',
            occupation: data.other_parent_occupation,
            work_phone: data.other_parent_work_phone,
            drivers_license: data.other_parent_drivers_license,
          }
        : null,
      parent_signature: data.parent_signature,
      family_name: data.family_name,
      how_heard: data.how_heard,
      how_heard_other: data.how_heard_other,
      referral_family_name: data.referral_family_name,
      faith_community: data.faith_community,
      has_sibling_enrolled: data.has_sibling_enrolled,
      sibling_name: data.sibling_name,
      parent_goals: data.parent_goals,
      anything_else: data.anything_else,
      payment_intent_id: data.payment_intent_id,
    }

    for (let i = 0; i < data.children.length; i += 1) {
      const child = data.children[i]
      const score = computeTriageScore(data, child)

      const notes = [
        child.has_allergies ? `Allergies: ${child.allergies_detail}` : '',
        child.has_medical_conditions ? `Medical: ${child.medical_conditions_detail}` : '',
        child.has_dietary_restrictions ? `Dietary: ${child.dietary_restrictions_detail}` : '',
        child.special_needs_or_accommodations
          ? `Special needs: ${child.special_needs_or_accommodations}`
          : '',
        child.current_medications ? `Medications: ${child.current_medications}` : '',
        child.pediatrician_name
          ? `Pediatrician: ${child.pediatrician_name} (${child.pediatrician_phone})`
          : '',
        data.parent_goals ? `Goals: ${data.parent_goals}` : '',
        data.anything_else ? `Notes: ${data.anything_else}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const { data: app, error: appError } = await supabase
        .from('enrollment_applications')
        .insert({
          tenant_id: tenantId,
          parent_first_name: data.parent_first_name,
          parent_last_name: data.parent_last_name,
          parent_email: data.parent_email,
          parent_phone: data.parent_phone,
          student_first_name: child.first_name,
          student_last_name: child.last_name,
          student_dob: child.dob,
          student_gender: child.gender,
          desired_start_date: child.desired_start_date || null,
          program_type: child.program_type,
          schedule_preference: child.schedule_preference ?? null,
          allergies_or_medical: child.has_allergies ? child.allergies_detail : null,
          special_needs: child.special_needs_or_accommodations || null,
          how_heard: data.how_heard,
          faith_community: data.faith_community || null,
          sibling_enrolled: data.has_sibling_enrolled,
          sibling_name: data.sibling_name || null,
          notes,
          relationship_to_child: data.relationship_to_child,
          agree_to_contact: data.agree_to_contact,
          triage_status: 'new',
          triage_score: score,
          pipeline_stage: 'form_submitted',
          form_response_id: responseId ?? null,
          child_index: i,
          application_metadata: applicationMetadata,
        })
        .select('id')
        .single()

      if (appError || !app) {
        return { ok: false, error: appError?.message ?? 'Failed to create application' }
      }

      applicationIds.push(app.id as string)

      await supabase.from('application_pipeline_steps').insert({
        tenant_id: tenantId,
        application_id: app.id,
        step_type: 'form_submitted',
        status: 'active',
        notes: `Application submitted for ${child.first_name} ${child.last_name}`,
      })

      await writeAudit(supabase, {
        tenantId,
        actorId: 'anonymous',
        action: 'enrollment.submit',
        entityType: 'enrollment_application',
        entityId: app.id as string,
        after: { program_type: child.program_type, triage_score: score, child_index: i },
      })
    }

    // Single lead per submission (not per child)
    const firstChild = data.children[0]
    const childNames = data.children.map((c) => `${c.first_name} ${c.last_name}`).join(', ')
    const leadScore = Math.max(...data.children.map((c) => computeTriageScore(data, c)))
    const priority = leadScore >= 70 ? 'hot' : leadScore >= 50 ? 'warm' : 'cold'

    await supabase.from('enrollment_leads').insert({
      tenant_id: tenantId,
      source: 'website',
      source_detail: 'enrollment_form',
      parent_first_name: data.parent_first_name,
      parent_last_name: data.parent_last_name,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone,
      child_name: childNames,
      child_age_months: calculateAgeMonths(firstChild.dob),
      program_interest: firstChild.program_type,
      status: 'application_received',
      priority,
      notes: `Auto-created from enrollment application — ${data.children.length} child(ren)`,
    })

    // Create applicant parent account (non-blocking — failure here doesn't fail the submission)
    let magicLinkSent = false
    try {
      const accountResult = await createApplicantAccount({
        tenantId,
        parentEmail: data.parent_email,
        parentFirstName: data.parent_first_name,
        parentLastName: data.parent_last_name,
        applicationIds,
      })
      magicLinkSent = accountResult.magicLinkSent ?? false
    } catch (accountErr) {
      console.error('[Enrollment] Applicant account creation failed (non-blocking):', accountErr)
    }

    // Fire enrollment_completed conversion for each created application.
    // Non-blocking: analytics must never prevent a successful submission.
    for (const appId of applicationIds) {
      await emitServerConversion({
        tenantId,
        eventName: 'enrollment_completed',
        visitorId: data.analytics_visitor_id ?? null,
        sessionId: data.analytics_session_id ?? null,
        applicationId: appId,
        properties: {
          program_type: data.children.find((_c, i) => applicationIds[i] === appId)?.program_type,
          child_count: data.children.length,
          how_heard: data.how_heard,
        },
      })
    }

    return {
      ok: true,
      response_id: responseId,
      application_ids: applicationIds,
      magic_link_sent: magicLinkSent,
    }
  } catch (err) {
    console.error('System enrollment submit error:', err)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  return years * 12 + months
}
