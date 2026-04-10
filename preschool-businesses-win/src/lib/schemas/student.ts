// @anchor: cca.student.schema
// Zod schemas for student CRUD operations.
// Matches the students, student_medical_profiles, and student_allergies tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enrollment status enum
// ---------------------------------------------------------------------------

export const enrollmentStatusEnum = z.enum([
  'applied',
  'enrolled',
  'active',
  'withdrawn',
  'graduated',
  'waitlisted',
])

export type EnrollmentStatus = z.infer<typeof enrollmentStatusEnum>

// ---------------------------------------------------------------------------
// Gender enum
// ---------------------------------------------------------------------------

export const genderEnum = z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say'])

// ---------------------------------------------------------------------------
// Create Student
// ---------------------------------------------------------------------------

export const CreateStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  preferred_name: z.string().max(100).optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum.optional(),
  enrollment_status: enrollmentStatusEnum.default('applied'),
  enrollment_date: z.string().optional(),
  photo_path: z.string().optional(),
  notes_internal: z.string().max(5000).optional(),
  // Medical profile (created alongside student)
  blood_type: z.string().max(10).optional(),
  primary_physician_name: z.string().max(200).optional(),
  primary_physician_phone: z.string().max(30).optional(),
  insurance_provider: z.string().max(200).optional(),
  insurance_policy_number: z.string().max(100).optional(),
  special_needs_notes: z.string().max(5000).optional(),
  emergency_action_plan_path: z.string().optional(),
})

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>

// ---------------------------------------------------------------------------
// Update Student
// ---------------------------------------------------------------------------

export const UpdateStudentSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  preferred_name: z.string().max(100).optional().nullable(),
  date_of_birth: z.string().optional(),
  gender: genderEnum.optional().nullable(),
  enrollment_status: enrollmentStatusEnum.optional(),
  enrollment_date: z.string().optional().nullable(),
  withdrawal_date: z.string().optional().nullable(),
  withdrawal_reason: z.string().max(1000).optional().nullable(),
  photo_path: z.string().optional().nullable(),
  notes_internal: z.string().max(5000).optional().nullable(),
  // Medical profile updates
  blood_type: z.string().max(10).optional().nullable(),
  primary_physician_name: z.string().max(200).optional().nullable(),
  primary_physician_phone: z.string().max(30).optional().nullable(),
  insurance_provider: z.string().max(200).optional().nullable(),
  insurance_policy_number: z.string().max(100).optional().nullable(),
  special_needs_notes: z.string().max(5000).optional().nullable(),
  emergency_action_plan_path: z.string().optional().nullable(),
})

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>

// ---------------------------------------------------------------------------
// Allergy severity
// ---------------------------------------------------------------------------

export const allergySeverityEnum = z.enum([
  'mild',
  'moderate',
  'severe',
  'life_threatening',
])

export type AllergySeverity = z.infer<typeof allergySeverityEnum>

// ---------------------------------------------------------------------------
// Create / Update Allergy
// ---------------------------------------------------------------------------

export const CreateAllergySchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  allergen: z.string().min(1, 'Allergen is required').max(200),
  severity: allergySeverityEnum,
  reaction_description: z.string().max(2000).optional(),
  treatment_protocol: z.string().max(2000).optional(),
  medication_name: z.string().max(200).optional(),
  medication_location: z.string().max(200).optional(),
  epipen_on_site: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
})

export type CreateAllergyInput = z.infer<typeof CreateAllergySchema>

export const UpdateAllergySchema = CreateAllergySchema.extend({
  id: z.string().uuid('Invalid allergy ID'),
}).partial().required({ id: true })

export type UpdateAllergyInput = z.infer<typeof UpdateAllergySchema>

export const RemoveAllergySchema = z.object({
  id: z.string().uuid('Invalid allergy ID'),
  student_id: z.string().uuid('Invalid student ID'),
})
