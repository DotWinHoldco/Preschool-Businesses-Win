// @anchor: cca.training.schemas
// Zod schemas for staff training records and training requirements.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TrainingTypeSchema = z.enum([
  'in_person',
  'online',
  'webinar',
  'conference',
  'self_study',
])
export type TrainingType = z.infer<typeof TrainingTypeSchema>

export const TopicCategorySchema = z.enum([
  'health_safety',
  'child_development',
  'dfps_required',
  'classroom_management',
  'faith_integration',
  'other',
])
export type TopicCategory = z.infer<typeof TopicCategorySchema>

export const TrainingCadenceSchema = z.enum([
  'one_time',
  'annual',
  'every_6_months',
  'every_3_months',
])
export type TrainingCadence = z.infer<typeof TrainingCadenceSchema>

// ---------------------------------------------------------------------------
// Training record
// ---------------------------------------------------------------------------

export const CreateTrainingRecordSchema = z.object({
  user_id: z.string().uuid('Staff member is required'),
  training_name: z.string().min(1, 'Training name is required').max(300),
  provider: z.string().max(300).optional().nullable(),
  training_type: TrainingTypeSchema,
  topic_category: TopicCategorySchema,
  hours: z.number().min(0).max(1000),
  completed_date: z.string().min(1, 'Completion date is required'),
  certificate_path: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
export type CreateTrainingRecordInput = z.infer<typeof CreateTrainingRecordSchema>

export const UpdateTrainingRecordSchema = z.object({
  id: z.string().uuid(),
  training_name: z.string().min(1).max(300).optional(),
  provider: z.string().max(300).optional().nullable(),
  training_type: TrainingTypeSchema.optional(),
  topic_category: TopicCategorySchema.optional(),
  hours: z.number().min(0).max(1000).optional(),
  completed_date: z.string().optional(),
  certificate_path: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
export type UpdateTrainingRecordInput = z.infer<typeof UpdateTrainingRecordSchema>

export const DeleteTrainingRecordSchema = z.object({
  id: z.string().uuid(),
})
export type DeleteTrainingRecordInput = z.infer<typeof DeleteTrainingRecordSchema>

export const VerifyTrainingRecordSchema = z.object({
  id: z.string().uuid(),
})
export type VerifyTrainingRecordInput = z.infer<typeof VerifyTrainingRecordSchema>

// ---------------------------------------------------------------------------
// Training requirement
// ---------------------------------------------------------------------------

export const CreateTrainingRequirementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  topic_category: TopicCategorySchema,
  cadence: TrainingCadenceSchema,
  required_hours: z.number().min(0).max(1000),
  required_for_roles: z.array(z.string()).default([]),
  description: z.string().max(2000).optional().nullable(),
})
export type CreateTrainingRequirementInput = z.infer<typeof CreateTrainingRequirementSchema>

export const UpdateTrainingRequirementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  topic_category: TopicCategorySchema.optional(),
  cadence: TrainingCadenceSchema.optional(),
  required_hours: z.number().min(0).max(1000).optional(),
  required_for_roles: z.array(z.string()).optional(),
  description: z.string().max(2000).optional().nullable(),
})
export type UpdateTrainingRequirementInput = z.infer<typeof UpdateTrainingRequirementSchema>

export const DeleteTrainingRequirementSchema = z.object({
  id: z.string().uuid(),
})
export type DeleteTrainingRequirementInput = z.infer<typeof DeleteTrainingRequirementSchema>
