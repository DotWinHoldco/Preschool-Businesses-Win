'use server'

// @anchor: cca.survey.submit-response
// Submit a survey response
// See CCA_BUILD_BRIEF.md §29

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { SubmitSurveyResponseSchema, type SubmitSurveyResponseInput } from '@/lib/schemas/survey'

export async function submitSurveyResponse(input: SubmitSurveyResponseInput) {
  await assertRole('parent')
  const parsed = SubmitSurveyResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Verify survey is active
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, status, anonymous, closes_at')
    .eq('id', parsed.data.survey_id)
    .eq('tenant_id', tenantId)
    .single()

  if (surveyError || !survey) {
    return { ok: false as const, error: { _form: ['Survey not found'] } }
  }

  if (survey.status !== 'active') {
    return { ok: false as const, error: { _form: ['Survey is not currently accepting responses'] } }
  }

  if (survey.closes_at && new Date(survey.closes_at as string) < new Date()) {
    return { ok: false as const, error: { _form: ['Survey has closed'] } }
  }

  // Check for duplicate response (non-anonymous only)
  if (!survey.anonymous) {
    const { data: existing } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_id', parsed.data.survey_id)
      .eq('respondent_id', actorId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (existing) {
      return { ok: false as const, error: { _form: ['You have already submitted a response'] } }
    }
  }

  // Create the response
  const { data: response, error: responseError } = await supabase
    .from('survey_responses')
    .insert({
      tenant_id: tenantId,
      survey_id: parsed.data.survey_id,
      respondent_id: survey.anonymous ? null : actorId,
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (responseError || !response) {
    return { ok: false as const, error: { _form: [responseError?.message ?? 'Failed to submit'] } }
  }

  // Insert all answers
  const answers = parsed.data.answers.map((a) => ({
    tenant_id: tenantId,
    response_id: response.id as string,
    question_id: a.question_id,
    answer_value: a.answer_value ?? null,
    answer_text: a.answer_text ?? null,
  }))

  const { error: answersError } = await supabase
    .from('survey_answers')
    .insert(answers)

  if (answersError) {
    return { ok: false as const, error: { _form: [answersError.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'survey.submit_response',
    entityType: 'survey_response',
    entityId: response.id as string,
    after: { survey_id: parsed.data.survey_id, answer_count: parsed.data.answers.length },
  })

  return { ok: true as const, responseId: response.id as string }
}
