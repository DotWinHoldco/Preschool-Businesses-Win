// @anchor: cca.classroom.schema
// Zod schemas for classroom CRUD, student assignment, and staff assignment.
// Matches classrooms, student_classroom_assignments, and classroom_staff_assignments tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Classroom status
// ---------------------------------------------------------------------------

export const classroomStatusEnum = z.enum(['active', 'inactive', 'summer_only'])

// ---------------------------------------------------------------------------
// Program type
// ---------------------------------------------------------------------------

export const programTypeEnum = z.enum([
  'full_day',
  'half_day_am',
  'half_day_pm',
  'before_care',
  'after_care',
  'summer',
])

// ---------------------------------------------------------------------------
// Staff role in classroom
// ---------------------------------------------------------------------------

export const classroomStaffRoleEnum = z.enum([
  'lead_teacher',
  'assistant_teacher',
  'aide',
])

// ---------------------------------------------------------------------------
// Create Classroom
// ---------------------------------------------------------------------------

export const CreateClassroomSchema = z.object({
  name: z.string().min(1, 'Classroom name is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  age_range_min_months: z.coerce.number().int().min(0).max(240),
  age_range_max_months: z.coerce.number().int().min(0).max(240),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').max(100),
  ratio_required: z.coerce.number().min(1).max(100).optional(),
  room_number: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  status: classroomStatusEnum.default('active'),
})

export type CreateClassroomInput = z.infer<typeof CreateClassroomSchema>

// ---------------------------------------------------------------------------
// Update Classroom
// ---------------------------------------------------------------------------

export const UpdateClassroomSchema = z.object({
  id: z.string().uuid('Invalid classroom ID'),
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  age_range_min_months: z.coerce.number().int().min(0).max(240).optional(),
  age_range_max_months: z.coerce.number().int().min(0).max(240).optional(),
  capacity: z.coerce.number().int().min(1).max(100).optional(),
  ratio_required: z.coerce.number().min(1).max(100).optional().nullable(),
  room_number: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  status: classroomStatusEnum.optional(),
})

export type UpdateClassroomInput = z.infer<typeof UpdateClassroomSchema>

// ---------------------------------------------------------------------------
// Assign Student to Classroom
// ---------------------------------------------------------------------------

export const AssignStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
  program_type: programTypeEnum.default('full_day'),
  assigned_from: z.string().optional(),
  assigned_to: z.string().optional().nullable(),
})

export type AssignStudentInput = z.infer<typeof AssignStudentSchema>

// ---------------------------------------------------------------------------
// Remove Student from Classroom
// ---------------------------------------------------------------------------

export const RemoveStudentSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
})

// ---------------------------------------------------------------------------
// Assign Staff to Classroom
// ---------------------------------------------------------------------------

export const AssignStaffSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
  role: classroomStaffRoleEnum,
  is_primary: z.boolean().default(false),
  assigned_from: z.string().optional(),
  assigned_to: z.string().optional().nullable(),
})

export type AssignStaffInput = z.infer<typeof AssignStaffSchema>

// ---------------------------------------------------------------------------
// Remove Staff from Classroom
// ---------------------------------------------------------------------------

export const RemoveStaffSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
})
