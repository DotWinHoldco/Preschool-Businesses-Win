'use server'

// @anchor: cca.survey.create
// Create a survey with questions
// See CCA_BUILD_BRIEF.md §29

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { CreateSurveySchema, type CreateSurveyInput } from '@/lib/schemas/survey'

export async function createSurvey(input: CreateSurveyInput) {
  const parsed = CreateSurveySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Create the survey record
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      tenant_id: tenantId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      target_audience: parsed.data.target_audience,
      classroom_id: parsed.data.classroom_id ?? null,
      status: 'draft',
      anonymous: parsed.data.anonymous,
      created_by: actorId,
      opens_at: parsed.data.opens_at ?? null,
      closes_at: parsed.data.closes_at ?? null,
    })
    .select('id')
    .single()

  if (surveyError || !survey) {
    return { ok: false as const, error: { _form: [surveyError?.message ?? 'Failed to create survey'] } }
  }

  // Create all questions
  const questions = parsed.data.questions.map((q) => ({
    tenant_id: tenantId,
    survey_id: survey.id as string,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options ?? null,
    required: q.required,
    sort_order: q.sort_order,
  }))

  const { error: questionsError } = await supabase
    .from('survey_questions')
    .insert(questions)

  if (questionsError) {
    return { ok: false as const, error: { _form: [questionsError.message] } }
  }

  return { ok: true as const, surveyId: survey.id as string }
}

export async function activateSurvey(surveyId: string) {
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('surveys')
    .update({ status: 'active' })
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const }
}

export async function closeSurvey(surveyId: string) {
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('surveys')
    .update({ status: 'closed' })
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const }
}
