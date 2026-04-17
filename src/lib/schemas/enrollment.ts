// @anchor: cca.enrollment.schema
// Zod schemas for the system enrollment form. Multi-child via repeater with
// per-child program + medical. Extended from the legacy 4-step wizard to match
// §46 of CCA_BUILD_BRIEF (seven-step conversational wizard).

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const programTypeEnum = z.enum([
  'infant',
  'toddler',
  'twos',
  'threes',
  'prek',
  'kindergarten',
  'before_after',
  'summer',
])
export type ProgramType = z.infer<typeof programTypeEnum>

export const schedulePreferenceEnum = z.enum(['full_day', 'half_day_am', 'half_day_pm'])
export type SchedulePreference = z.infer<typeof schedulePreferenceEnum>

export const relationshipEnum = z.enum(['parent', 'grandparent', 'guardian', 'other'])
export type Relationship = z.infer<typeof relationshipEnum>

export const genderEnum = z.enum(['male', 'female', 'prefer_not_to_say'])
export type Gender = z.infer<typeof genderEnum>

export const howHeardEnum = z.enum([
  'google',
  'facebook',
  'instagram',
  'referral',
  'church',
  'drive_by',
  'event',
  'other',
])
export type HowHeard = z.infer<typeof howHeardEnum>

// ---------------------------------------------------------------------------
// Per-child sub-schema (repeater group item)
// ---------------------------------------------------------------------------

export const ChildSchema = z.object({
  first_name: z.string().min(1, "Child's first name is required").max(100),
  last_name: z.string().min(1, "Child's last name is required").max(100),
  preferred_name: z.string().max(100).optional().default(''),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum,
  photo_path: z.string().optional().default(''),

  // Program (Step 3, per child)
  program_type: programTypeEnum,
  schedule_preference: schedulePreferenceEnum,
  desired_start_date: z.string().min(1, 'Start date is required'),

  // Medical (Step 4, per child)
  has_allergies: z.boolean().default(false),
  allergies_detail: z.string().max(2000).optional().default(''),
  has_medical_conditions: z.boolean().default(false),
  medical_conditions_detail: z.string().max(2000).optional().default(''),
  has_dietary_restrictions: z.boolean().default(false),
  dietary_restrictions_detail: z.string().max(2000).optional().default(''),
  special_needs_or_accommodations: z.string().max(2000).optional().default(''),
  current_medications: z.string().max(2000).optional().default(''),
  pediatrician_name: z.string().max(200).optional().default(''),
  pediatrician_phone: z.string().max(30).optional().default(''),
})
export type ChildData = z.infer<typeof ChildSchema>

// ---------------------------------------------------------------------------
// Step schemas
// ---------------------------------------------------------------------------

export const StepParentSchema = z.object({
  parent_first_name: z.string().min(1, 'First name is required').max(100),
  parent_last_name: z.string().min(1, 'Last name is required').max(100),
  parent_email: z.string().email('Please enter a valid email'),
  parent_phone: z.string().min(10, 'Please enter a valid phone').max(30),
  relationship_to_child: relationshipEnum,
  parent_address_street: z.string().max(300).optional().default(''),
  parent_address_city: z.string().max(200).optional().default(''),
  parent_address_state: z.string().max(100).optional().default(''),
  parent_address_zip: z.string().max(20).optional().default(''),
  parent_occupation: z.string().max(200).optional().default(''),
  parent_work_phone: z.string().max(30).optional().default(''),
  parent_drivers_license: z.string().max(100).optional().default(''),
})
export type StepParentData = z.infer<typeof StepParentSchema>

export const StepChildrenSchema = z.object({
  children: z.array(ChildSchema).min(1, 'At least one child is required').max(5),
})
export type StepChildrenData = z.infer<typeof StepChildrenSchema>

export const StepFamilySchema = z.object({
  has_other_parent: z.boolean().default(false),
  other_parent_name: z.string().max(200).optional().default(''),
  other_parent_same_address: z.boolean().default(true),
  other_parent_address_street: z.string().max(300).optional().default(''),
  other_parent_address_city: z.string().max(200).optional().default(''),
  other_parent_address_state: z.string().max(100).optional().default(''),
  other_parent_address_zip: z.string().max(20).optional().default(''),
  other_parent_occupation: z.string().max(200).optional().default(''),
  other_parent_work_phone: z.string().max(30).optional().default(''),
  other_parent_drivers_license: z.string().max(100).optional().default(''),
  family_name: z.string().min(1, 'Family name is required').max(200),
  how_heard: howHeardEnum,
  how_heard_other: z.string().max(200).optional().default(''),
  referral_family_name: z.string().max(200).optional().default(''),
  faith_community: z.string().max(200).optional().default(''),
  has_sibling_enrolled: z.boolean().default(false),
  sibling_name: z.string().max(200).optional().default(''),
  parent_goals: z.string().max(5000).optional().default(''),
  anything_else: z.string().max(5000).optional().default(''),
})
export type StepFamilyData = z.infer<typeof StepFamilySchema>

export const StepAgreementSchema = z.object({
  agree_to_contact: z.boolean().refine((v) => v === true, 'You must agree to be contacted'),
  agree_to_policies: z.boolean().refine((v) => v === true, 'You must agree to school policies'),
  acknowledge_accuracy: z.boolean().refine((v) => v === true, 'You must acknowledge accuracy'),
  payment_intent_id: z.string().optional(),
})
export type StepAgreementData = z.infer<typeof StepAgreementSchema>

// ---------------------------------------------------------------------------
// Combined schema
// ---------------------------------------------------------------------------

export const SystemEnrollmentSchema = StepParentSchema
  .merge(StepChildrenSchema)
  .merge(StepFamilySchema)
  .merge(StepAgreementSchema)
  .extend({
    /** Honeypot — must be empty */
    website: z.string().max(0).optional().default(''),
    form_id: z.string().uuid().optional(),
  })

export type SystemEnrollmentData = z.infer<typeof SystemEnrollmentSchema>

// ---------------------------------------------------------------------------
// Legacy compatibility (kept for the marketing-site wizard until migrated)
// ---------------------------------------------------------------------------

export const LegacyEnrollmentSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(30),
  relationship_to_child: z.enum(['parent', 'grandparent', 'guardian']),
  child_first_name: z.string().min(1).max(100),
  child_last_name: z.string().min(1).max(100),
  child_dob: z.string().min(1),
  gender: genderEnum,
  allergies_or_medical: z.string().max(2000).optional().default(''),
  special_needs: z.string().max(2000).optional().default(''),
  program_type: z.enum(['infant', 'toddler', 'prek', 'before_after', 'summer']),
  desired_start_date: z.string().min(1),
  schedule_preference: schedulePreferenceEnum,
  how_heard: z.string().max(500).optional().default(''),
  faith_community: z.string().max(500).optional().default(''),
  sibling_enrolled: z.boolean().default(false),
  sibling_name: z.string().max(200).optional().default(''),
  notes: z.string().max(5000).optional().default(''),
  agree_to_contact: z.boolean().refine((v) => v === true, 'You must agree to be contacted'),
  website: z.string().max(0).optional().default(''),
})
export type LegacyEnrollmentData = z.infer<typeof LegacyEnrollmentSchema>

// Exports kept for wizard-steps files that import them.
export { StepParentSchema as StepParentLegacySchema }

// Per-step schema used by the wizard validateStep helper.
export const StepChildLegacySchema = z.object({
  child_first_name: z.string().min(1).max(100),
  child_last_name: z.string().min(1).max(100),
  child_dob: z.string().min(1),
  gender: genderEnum,
  allergies_or_medical: z.string().max(2000).optional().default(''),
  special_needs: z.string().max(2000).optional().default(''),
})

export const StepProgramLegacySchema = z.object({
  program_type: z.enum(['infant', 'toddler', 'prek', 'before_after', 'summer']),
  desired_start_date: z.string().min(1),
  schedule_preference: schedulePreferenceEnum,
  how_heard: z.string().max(500).optional().default(''),
})

// Alias exports for backwards compatibility with existing wizard
export const EnrollmentApplicationSchema = LegacyEnrollmentSchema
export const EnrollmentSubmitSchema = LegacyEnrollmentSchema
export type EnrollmentApplicationData = LegacyEnrollmentData
export type EnrollmentSubmitData = LegacyEnrollmentData
export const StepChildSchema = StepChildLegacySchema
export const StepProgramSchema = StepProgramLegacySchema
export const StepAdditionalSchema = z.object({
  faith_community: z.string().max(500).optional().default(''),
  sibling_enrolled: z.boolean().default(false),
  sibling_name: z.string().max(200).optional().default(''),
  notes: z.string().max(5000).optional().default(''),
  agree_to_contact: z.boolean().refine((v) => v === true, 'You must agree to be contacted'),
})
export type StepChildData = z.infer<typeof StepChildLegacySchema>
export type StepProgramData = z.infer<typeof StepProgramLegacySchema>
export type StepAdditionalData = z.infer<typeof StepAdditionalSchema>
