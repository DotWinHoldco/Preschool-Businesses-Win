// @anchor: cca.curriculum.schemas
// Zod schemas for curriculum domain: lesson plans, days, activities, standards.

import { z } from 'zod'

// ---------------- Lesson Plans ----------------

export const LessonPlanStatusEnum = z.enum(['draft', 'published', 'archived'])

export const CreateLessonPlanSchema = z.object({
  classroom_id: z.string().uuid(),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  theme: z.string().trim().max(200).optional().nullable(),
  objectives: z.string().trim().max(5000).optional().nullable(),
  materials: z.string().trim().max(5000).optional().nullable(),
  faith_component: z.string().trim().max(5000).optional().nullable(),
  status: LessonPlanStatusEnum.default('draft'),
})
export type CreateLessonPlanInput = z.infer<typeof CreateLessonPlanSchema>

export const UpdateLessonPlanSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  theme: z.string().trim().max(200).optional().nullable(),
  classroom_id: z.string().uuid().optional(),
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  objectives: z.string().trim().max(5000).optional().nullable(),
  materials: z.string().trim().max(5000).optional().nullable(),
  faith_component: z.string().trim().max(5000).optional().nullable(),
  status: LessonPlanStatusEnum.optional(),
})
export type UpdateLessonPlanInput = z.infer<typeof UpdateLessonPlanSchema>

export const DeleteLessonPlanSchema = z.object({ id: z.string().uuid() })

// ---------------- Lesson Plan Days ----------------

export const UpsertLessonPlanDaySchema = z.object({
  lesson_plan_id: z.string().uuid(),
  day_of_week: z.number().int().min(1).max(7),
  title: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().max(20000).optional().nullable(),
  reflection: z.string().trim().max(5000).optional().nullable(),
})
export type UpsertLessonPlanDayInput = z.infer<typeof UpsertLessonPlanDaySchema>

// ---------------- Lesson Plan Activities ----------------

export const AttachPlanActivitySchema = z.object({
  lesson_plan_id: z.string().uuid(),
  day_of_week: z.number().int().min(1).max(7),
  time_slot: z.string().trim().max(50).optional().nullable(),
  activity_name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  materials_needed: z.string().trim().max(2000).optional().nullable(),
  duration_minutes: z.number().int().positive().max(600).optional().nullable(),
  standards_addressed: z.array(z.string().uuid()).default([]),
})
export type AttachPlanActivityInput = z.infer<typeof AttachPlanActivitySchema>

export const UpdatePlanActivitySchema = AttachPlanActivitySchema.partial().extend({
  id: z.string().uuid(),
})

export const DeletePlanActivitySchema = z.object({ id: z.string().uuid() })

export const CompletePlanActivitySchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

// ---------------- Curriculum Activity Library ----------------

export const CreateCurriculumActivitySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  subject_area: z.string().trim().max(100).optional().nullable(),
  age_range_min_months: z.number().int().min(0).max(120).optional().nullable(),
  age_range_max_months: z.number().int().min(0).max(120).optional().nullable(),
  duration_minutes: z.number().int().positive().max(600).optional().nullable(),
  materials: z.string().trim().max(2000).optional().nullable(),
  instructions: z.string().trim().max(10000).optional().nullable(),
  domain_ids: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
})
export type CreateCurriculumActivityInput = z.infer<typeof CreateCurriculumActivitySchema>

export const UpdateCurriculumActivitySchema = CreateCurriculumActivitySchema.partial().extend({
  id: z.string().uuid(),
})

export const DeleteCurriculumActivitySchema = z.object({ id: z.string().uuid() })

// ---------------- Learning Standards ----------------

export const CreateLearningStandardSchema = z.object({
  framework: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  domain_id: z.string().uuid().optional().nullable(),
  age_range_min_months: z.number().int().min(0).max(120).optional().nullable(),
  age_range_max_months: z.number().int().min(0).max(120).optional().nullable(),
  sort_order: z.number().int().default(0),
})
export type CreateLearningStandardInput = z.infer<typeof CreateLearningStandardSchema>

export const UpdateLearningStandardSchema = CreateLearningStandardSchema.partial().extend({
  id: z.string().uuid(),
})

export const DeleteLearningStandardSchema = z.object({ id: z.string().uuid() })

// ---------------- Lesson Plan Standards (mapping) ----------------

export const MapPlanStandardSchema = z.object({
  lesson_plan_id: z.string().uuid(),
  standard_id: z.string().uuid(),
  coverage_level: z.enum(['introduced', 'practiced', 'assessed']).default('introduced'),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export const UnmapPlanStandardSchema = z.object({
  lesson_plan_id: z.string().uuid(),
  standard_id: z.string().uuid(),
})
