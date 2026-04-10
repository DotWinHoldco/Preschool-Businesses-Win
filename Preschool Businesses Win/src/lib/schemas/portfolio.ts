// @anchor: cca.portfolio.schema
// Zod schemas for child development portfolios, observations, learning stories,
// and developmental assessments.
// Matches portfolio_entries, portfolio_media, developmental_assessments, and assessment_ratings tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Portfolio entry type enum
// ---------------------------------------------------------------------------

export const portfolioEntryTypeEnum = z.enum([
  'observation',
  'work_sample',
  'photo',
  'video',
  'learning_story',
  'milestone',
])

export type PortfolioEntryType = z.infer<typeof portfolioEntryTypeEnum>

// ---------------------------------------------------------------------------
// Visibility enum
// ---------------------------------------------------------------------------

export const visibilityEnum = z.enum(['parent', 'staff_only'])

export type Visibility = z.infer<typeof visibilityEnum>

// ---------------------------------------------------------------------------
// Assessment rating enum
// ---------------------------------------------------------------------------

export const assessmentRatingEnum = z.enum([
  'not_yet',
  'emerging',
  'developing',
  'proficient',
  'exceeding',
])

export type AssessmentRating = z.infer<typeof assessmentRatingEnum>

// ---------------------------------------------------------------------------
// Assessment status enum
// ---------------------------------------------------------------------------

export const assessmentStatusEnum = z.enum([
  'in_progress',
  'completed',
  'shared_with_parent',
])

export type AssessmentStatus = z.infer<typeof assessmentStatusEnum>

// ---------------------------------------------------------------------------
// Learning domain framework enum
// ---------------------------------------------------------------------------

export const frameworkEnum = z.enum([
  'texas_prek_guidelines',
  'naeyc',
  'head_start_elof',
  'cca_faith',
  'custom',
])

export type Framework = z.infer<typeof frameworkEnum>

// ---------------------------------------------------------------------------
// Create Observation (portfolio entry)
// ---------------------------------------------------------------------------

export const CreateObservationSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  title: z.string().min(1, 'Title is required').max(300),
  narrative: z.string().min(1, 'Narrative is required').max(10000),
  entry_type: portfolioEntryTypeEnum.default('observation'),
  learning_domain_ids: z.array(z.string().uuid()).default([]),
  visibility: visibilityEnum.default('parent'),
  linked_daily_report_entry_id: z.string().uuid().optional().nullable(),
  media: z
    .array(
      z.object({
        file_path: z.string().min(1),
        media_type: z.enum(['photo', 'video', 'document']),
        caption: z.string().max(500).optional(),
      })
    )
    .default([]),
})

export type CreateObservationInput = z.infer<typeof CreateObservationSchema>

// ---------------------------------------------------------------------------
// Create Learning Story
// ---------------------------------------------------------------------------

export const CreateLearningStorySchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  title: z.string().min(1, 'Title is required').max(300),
  what_happened: z.string().min(1, 'What happened is required').max(10000),
  what_learning_occurred: z.string().min(1, 'Learning is required').max(10000),
  what_next: z.string().max(10000).optional(),
  learning_domain_ids: z.array(z.string().uuid()).default([]),
  visibility: visibilityEnum.default('parent'),
  media: z
    .array(
      z.object({
        file_path: z.string().min(1),
        media_type: z.enum(['photo', 'video', 'document']),
        caption: z.string().max(500).optional(),
      })
    )
    .default([]),
})

export type CreateLearningStoryInput = z.infer<typeof CreateLearningStorySchema>

// ---------------------------------------------------------------------------
// Run Developmental Assessment
// ---------------------------------------------------------------------------

export const RunAssessmentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  assessment_period_start: z.string().min(1, 'Start date is required'),
  assessment_period_end: z.string().min(1, 'End date is required'),
  ratings: z.array(
    z.object({
      learning_domain_id: z.string().uuid('Invalid domain ID'),
      rating: assessmentRatingEnum,
      evidence_notes: z.string().max(5000).optional(),
      linked_portfolio_entry_ids: z.array(z.string().uuid()).default([]),
    })
  ),
})

export type RunAssessmentInput = z.infer<typeof RunAssessmentSchema>

// ---------------------------------------------------------------------------
// Generate Progress Report
// ---------------------------------------------------------------------------

export const GenerateProgressReportSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  assessment_id: z.string().uuid('Invalid assessment ID').optional(),
  period_start: z.string().min(1, 'Start date is required'),
  period_end: z.string().min(1, 'End date is required'),
  include_portfolio_samples: z.boolean().default(true),
  include_charts: z.boolean().default(true),
})

export type GenerateProgressReportInput = z.infer<typeof GenerateProgressReportSchema>
