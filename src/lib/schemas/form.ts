// @anchor: platform.form-builder.schema

import { z } from 'zod'

export const formModeEnum = z.enum(['conversational', 'document'])
export const formStatusEnum = z.enum(['draft', 'published', 'archived'])
export const formAccessEnum = z.enum(['public', 'authenticated', 'role_restricted', 'tokenized'])

export const formFieldTypeEnum = z.enum([
  'short_text','long_text','rich_text','email','phone','url','number','currency',
  'single_select_dropdown','single_select_radio','multi_select_checkbox',
  'image_choice','button_group','rating','opinion_scale','nps','yes_no','legal_acceptance',
  'date','time','datetime','date_range','appointment_slot',
  'file_upload','image_upload','video_embed','signature_pad',
  'section_header','description_block','divider','image_banner','video_banner','spacer',
  'payment_stripe','calculator','hidden_field','address_autocomplete',
  'matrix_grid','ranking','slider',
  'entity_lookup','custom_field_value','dynamic_select',
  'repeater_group',
])
export type FormFieldType = z.infer<typeof formFieldTypeEnum>

export const CreateFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  mode: formModeEnum.default('conversational'),
  access_control: formAccessEnum.default('public'),
})
export type CreateFormInput = z.input<typeof CreateFormSchema>

export const UpdateFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  mode: formModeEnum.optional(),
  status: formStatusEnum.optional(),
  access_control: formAccessEnum.optional(),
  allowed_roles: z.array(z.string()).optional(),
  theme_overrides: z.record(z.string(), z.unknown()).optional(),
  header_config: z.record(z.string(), z.unknown()).optional(),
  footer_config: z.record(z.string(), z.unknown()).optional(),
  background_config: z.record(z.string(), z.unknown()).optional(),
  custom_css: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  thank_you_title: z.string().optional(),
  thank_you_message: z.string().optional(),
  thank_you_redirect_url: z.string().url().optional().or(z.literal('')),
  allow_response_edit: z.boolean().optional(),
  response_edit_deadline_hours: z.number().int().positive().optional(),
  // System form + fee toggle (§46)
  fee_enabled: z.boolean().optional(),
  fee_amount_cents: z.number().int().min(0).max(10000000).optional().nullable(),
  fee_description: z.string().max(200).optional(),
  instance_label: z.string().max(200).optional(),
})
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>

export const SpawnFormInstanceSchema = z.object({
  source_form_id: z.string().uuid(),
  instance_label: z.string().min(1).max(200),
  fee_enabled: z.boolean().default(false),
  fee_amount_cents: z.number().int().min(0).max(10000000).optional().nullable(),
  fee_description: z.string().max(200).optional(),
})
export type SpawnFormInstanceInput = z.infer<typeof SpawnFormInstanceSchema>

export const CreateFormFieldSchema = z.object({
  form_id: z.string().uuid(),
  field_key: z.string().min(1).max(100),
  field_type: formFieldTypeEnum,
  label: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  placeholder: z.string().max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  validation_rules: z.record(z.string(), z.unknown()).optional().default({}),
  logic_rules: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  prefill_source: z.string().optional(),
  sort_order: z.number().int().optional().default(0),
  page_number: z.number().int().optional().default(1),
  is_required: z.boolean().optional().default(false),
  section_id: z.string().uuid().optional(),
})
export type CreateFormFieldInput = z.input<typeof CreateFormFieldSchema>

export const SubmitFormResponseSchema = z.object({
  form_id: z.string().uuid(),
  values: z.record(z.string(), z.unknown()),
  respondent_email: z.string().email().optional(),
  respondent_name: z.string().optional(),
  draft_token: z.string().optional(),
})
export type SubmitFormResponseInput = z.infer<typeof SubmitFormResponseSchema>

export const LAYOUT_FIELD_TYPES: FormFieldType[] = [
  'section_header', 'description_block', 'divider',
  'image_banner', 'video_banner', 'spacer',
]

export const CHOICE_FIELD_TYPES: FormFieldType[] = [
  'single_select_dropdown', 'single_select_radio', 'multi_select_checkbox',
  'image_choice', 'button_group', 'rating', 'opinion_scale',
  'nps', 'yes_no', 'legal_acceptance',
]

export const AUTO_ADVANCE_TYPES: FormFieldType[] = [
  'single_select_radio', 'image_choice', 'button_group',
  'rating', 'opinion_scale', 'nps', 'yes_no', 'legal_acceptance',
]
