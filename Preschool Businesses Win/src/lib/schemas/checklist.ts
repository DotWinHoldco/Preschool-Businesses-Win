// @anchor: cca.checklist.schemas
// Zod schemas for checklists: templates, items, assignments, responses
// See CCA_BUILD_BRIEF.md §34

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Checklist item types
// ---------------------------------------------------------------------------

export const ChecklistItemTypeSchema = z.enum([
  'document_upload',
  'signature',
  'acknowledgment',
  'form_field',
  'custom',
])
export type ChecklistItemType = z.infer<typeof ChecklistItemTypeSchema>

// ---------------------------------------------------------------------------
// Checklist target types
// ---------------------------------------------------------------------------

export const ChecklistTargetTypeSchema = z.enum(['parent', 'staff', 'student'])
export type ChecklistTargetType = z.infer<typeof ChecklistTargetTypeSchema>

// ---------------------------------------------------------------------------
// Checklist assignment entity type
// ---------------------------------------------------------------------------

export const ChecklistAssignmentEntityTypeSchema = z.enum([
  'family',
  'student',
  'staff',
])
export type ChecklistAssignmentEntityType = z.infer<typeof ChecklistAssignmentEntityTypeSchema>

// ---------------------------------------------------------------------------
// Checklist assignment status
// ---------------------------------------------------------------------------

export const ChecklistAssignmentStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'overdue',
])
export type ChecklistAssignmentStatus = z.infer<typeof ChecklistAssignmentStatusSchema>

// ---------------------------------------------------------------------------
// Checklist template
// ---------------------------------------------------------------------------

export const CreateChecklistTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  target_type: ChecklistTargetTypeSchema,
  description: z.string().max(1000).optional(),
  is_active: z.boolean().default(true),
})
export type CreateChecklistTemplateInput = z.infer<typeof CreateChecklistTemplateSchema>

export const UpdateChecklistTemplateSchema = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  target_type: ChecklistTargetTypeSchema.optional(),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
})
export type UpdateChecklistTemplateInput = z.infer<typeof UpdateChecklistTemplateSchema>

// ---------------------------------------------------------------------------
// Checklist item
// ---------------------------------------------------------------------------

export const CreateChecklistItemSchema = z.object({
  template_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  item_type: ChecklistItemTypeSchema,
  required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  deadline_days_from_assignment: z.number().int().min(1).max(365).optional(),
})
export type CreateChecklistItemInput = z.infer<typeof CreateChecklistItemSchema>

// ---------------------------------------------------------------------------
// Checklist assignment
// ---------------------------------------------------------------------------

export const AssignChecklistSchema = z.object({
  template_id: z.string().uuid(),
  assigned_to_user_id: z.string().uuid(),
  assigned_to_entity_type: ChecklistAssignmentEntityTypeSchema,
  assigned_to_entity_id: z.string().uuid(),
  due_date: z.string().datetime().optional(),
})
export type AssignChecklistInput = z.infer<typeof AssignChecklistSchema>

// ---------------------------------------------------------------------------
// Complete checklist item
// ---------------------------------------------------------------------------

export const CompleteChecklistItemSchema = z.object({
  assignment_id: z.string().uuid(),
  item_id: z.string().uuid(),
  response_value: z.string().max(2000).optional(),
  file_path: z.string().max(500).optional(),
  signature_data: z.string().optional(), // Base64 encoded signature image
})
export type CompleteChecklistItemInput = z.infer<typeof CompleteChecklistItemSchema>
