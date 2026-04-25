// @anchor: platform.custom-fields.schema

import { z } from 'zod'

export const fieldTypeEnum = z.enum([
  'text',
  'textarea',
  'number',
  'currency',
  'date',
  'datetime',
  'boolean',
  'select',
  'multi_select',
  'email',
  'phone',
  'url',
  'file',
  'image',
  'rating',
  'color',
  'json',
])
export type CustomFieldType = z.infer<typeof fieldTypeEnum>

export const CreateCustomFieldSchema = z.object({
  entity_type: z.string().min(1),
  label: z.string().min(1).max(100),
  field_type: fieldTypeEnum,
  description: z.string().max(500).optional(),
  is_required: z.boolean().optional().default(false),
  is_searchable: z.boolean().optional().default(false),
  is_filterable: z.boolean().optional().default(false),
  is_visible_to_parents: z.boolean().optional().default(false),
  is_parent_editable: z.boolean().optional().default(false),
  is_merge_tag: z.boolean().optional().default(false),
  merge_tag_sample: z.string().max(200).optional(),
  default_value: z.unknown().optional(),
  validation_rules: z.record(z.string(), z.unknown()).optional().default({}),
  section_label: z.string().max(100).optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        color: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
})
export type CreateCustomFieldInput = z.input<typeof CreateCustomFieldSchema>

export const UpdateCustomFieldSchema = CreateCustomFieldSchema.partial().extend({
  id: z.string().uuid(),
})
export type UpdateCustomFieldInput = z.infer<typeof UpdateCustomFieldSchema>

export const SetCustomFieldValueSchema = z.object({
  custom_field_id: z.string().uuid(),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  value: z.unknown(),
})
export type SetCustomFieldValueInput = z.infer<typeof SetCustomFieldValueSchema>
