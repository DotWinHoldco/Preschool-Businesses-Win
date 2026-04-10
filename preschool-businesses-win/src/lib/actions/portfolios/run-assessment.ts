// @anchor: cca.assessment.run
'use server'

import { assertRole } from '@/lib/auth/session'
import { RunAssessmentSchema, type RunAssessmentInput } from '@/lib/schemas/portfolio'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type RunAssessmentState = {
  ok: boolean
  error?: string
  id?: string
}

export async function runAssessment(
  input: RunAssessmentInput
): Promise<RunAssessmentState> {
  await assertRole('lead_teacher')
  const parsed = RunAssessmentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Create assessment record
  const { data: assessment, error: assessmentError } = await supabase
    .from('developmental_assessments')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      assessment_period_start: data.assessment_period_start,
      assessment_period_end: data.assessment_period_end,
      assessor_id: actorId,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (assessmentError || !assessment) {
    return { ok: false, error: assessmentError?.message ?? 'Failed to create assessment' }
  }

  // Insert all ratings
  if (data.ratings.length > 0) {
    const ratingRows = data.ratings.map((r) => ({
      tenant_id: tenantId,
      assessment_id: assessment.id,
      learning_domain_id: r.learning_domain_id,
      rating: r.rating,
      evidence_notes: r.evidence_notes ?? null,
      linked_portfolio_entry_ids: r.linked_portfolio_entry_ids,
    }))

    const { error: ratingsError } = await supabase
      .from('assessment_ratings')
      .insert(ratingRows)

    if (ratingsError) {
      return { ok: false, error: ratingsError.message }
    }
  }

  // Mark as completed
  await supabase
    .from('developmental_assessments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', assessment.id)

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.assessment.completed',
    entity_type: 'developmental_assessment',
    entity_id: assessment.id,
    after: { student_id: data.student_id, ratings_count: data.ratings.length },
  })

  return { ok: true, id: assessment.id }
}
