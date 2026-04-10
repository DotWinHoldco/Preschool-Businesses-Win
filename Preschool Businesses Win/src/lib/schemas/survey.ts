// @anchor: cca.survey.schemas
// Zod schemas for surveys: creation, questions, responses
// See CCA_BUILD_BRIEF.md §29

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Survey target audience
// ---------------------------------------------------------------------------

export const SurveyTargetAudienceSchema = z.enum([
  'all_parents',
  'classroom',
  'staff',
  'custom',
])
export type SurveyTargetAudience = z.infer<typeof SurveyTargetAudienceSchema>

// ---------------------------------------------------------------------------
// Survey status
// ---------------------------------------------------------------------------

export const SurveyStatusSchema = z.enum(['draft', 'active', 'closed'])
export type SurveyStatus = z.infer<typeof SurveyStatusSchema>

// ---------------------------------------------------------------------------
// Question types
// ---------------------------------------------------------------------------

export const SurveyQuestionTypeSchema = z.enum([
  'rating_1_5',
  'rating_1_10',
  'multiple_choice',
  'text',
  'nps',
  'yes_no',
])
export type SurveyQuestionType = z.infer<typeof SurveyQuestionTypeSchema>

// ---------------------------------------------------------------------------
// Create survey
// ---------------------------------------------------------------------------

export const CreateSurveySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  target_audience: SurveyTargetAudienceSchema,
  classroom_id: z.string().uuid().optional(),
  anonymous: z.boolean().default(false),
  opens_at: z.string().datetime().optional(),
  closes_at: z.string().datetime().optional(),
  questions: z
    .array(
      z.object({
        question_text: z.string().min(1).max(500),
        question_type: SurveyQuestionTypeSchema,
        options: z.array(z.string().max(200)).max(20).optional(),
        required: z.boolean().default(true),
        sort_order: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(50),
})
export type CreateSurveyInput = z.infer<typeof CreateSurveySchema>

// ---------------------------------------------------------------------------
// Submit survey response
// ---------------------------------------------------------------------------

export const SubmitSurveyResponseSchema = z.object({
  survey_id: z.string().uuid(),
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        answer_value: z.string().max(50).optional(),
        answer_text: z.string().max(2000).optional(),
      }),
    )
    .min(1),
})
export type SubmitSurveyResponseInput = z.infer<typeof SubmitSurveyResponseSchema>
