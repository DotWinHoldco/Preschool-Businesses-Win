// @anchor: cca.enrollment.schema
// Zod schemas for enrollment wizard — per-step sub-schemas + combined schema.
// Matches enrollment_applications table.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const programTypeEnum = z.enum([
  'infant',
  'toddler',
  'prek',
  'before_after',
  'summer',
])

export type ProgramType = z.infer<typeof programTypeEnum>

export const schedulePreferenceEnum = z.enum([
  'full_day',
  'half_day_am',
  'half_day_pm',
])

export type SchedulePreference = z.infer<typeof schedulePreferenceEnum>

export const relationshipEnum = z.enum([
  'parent',
  'grandparent',
  'guardian',
])

export type Relationship = z.infer<typeof relationshipEnum>

export const genderEnum = z.enum([
  'male',
  'female',
  'prefer_not_to_say',
])

export type Gender = z.infer<typeof genderEnum>

// ---------------------------------------------------------------------------
// Step 1: Parent Info
// ---------------------------------------------------------------------------

export const StepParentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .max(30),
  relationship_to_child: relationshipEnum,
})

export type StepParentData = z.infer<typeof StepParentSchema>

// ---------------------------------------------------------------------------
// Step 2: Child Info
// ---------------------------------------------------------------------------

export const StepChildSchema = z.object({
  child_first_name: z.string().min(1, 'Child\'s first name is required').max(100),
  child_last_name: z.string().min(1, 'Child\'s last name is required').max(100),
  child_dob: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum,
  allergies_or_medical: z.string().max(2000).optional().default(''),
  special_needs: z.string().max(2000).optional().default(''),
})

export type StepChildData = z.infer<typeof StepChildSchema>

// ---------------------------------------------------------------------------
// Step 3: Program
// ---------------------------------------------------------------------------

export const StepProgramSchema = z.object({
  program_type: programTypeEnum,
  desired_start_date: z.string().min(1, 'Start date is required'),
  schedule_preference: schedulePreferenceEnum,
  how_heard: z.string().max(500).optional().default(''),
})

export type StepProgramData = z.infer<typeof StepProgramSchema>

// ---------------------------------------------------------------------------
// Step 4: Additional
// ---------------------------------------------------------------------------

export const StepAdditionalSchema = z.object({
  faith_community: z.string().max(500).optional().default(''),
  sibling_enrolled: z.boolean().default(false),
  sibling_name: z.string().max(200).optional().default(''),
  notes: z.string().max(5000).optional().default(''),
  agree_to_contact: z
    .boolean()
    .refine((v) => v === true, 'You must agree to be contacted'),
})

export type StepAdditionalData = z.infer<typeof StepAdditionalSchema>

// ---------------------------------------------------------------------------
// Combined schema (all steps)
// ---------------------------------------------------------------------------

export const EnrollmentApplicationSchema = StepParentSchema
  .merge(StepChildSchema)
  .merge(StepProgramSchema)
  .merge(StepAdditionalSchema)

export type EnrollmentApplicationData = z.infer<typeof EnrollmentApplicationSchema>

// ---------------------------------------------------------------------------
// Honeypot field
// ---------------------------------------------------------------------------

export const EnrollmentSubmitSchema = EnrollmentApplicationSchema.extend({
  /** Honeypot — must be empty */
  website: z.string().max(0).optional().default(''),
})

export type EnrollmentSubmitData = z.infer<typeof EnrollmentSubmitSchema>
