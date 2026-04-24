// @anchor: cca.incident.schema
// Zod schemas for incident reports, involved parties, and attachments.

import { z } from 'zod'

export const IncidentTypeEnum = z.enum([
  'injury',
  'accident',
  'allegation',
  'behavior',
  'medical',
  'property',
  'other',
])
export type IncidentType = z.infer<typeof IncidentTypeEnum>

export const IncidentSeverityEnum = z.enum(['minor', 'moderate', 'serious', 'critical'])
export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>

export const IncidentStatusEnum = z.enum(['open', 'investigating', 'closed', 'escalated'])
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>

export const CreateIncidentSchema = z.object({
  incident_date: z.string().min(1, 'Date is required'),
  incident_time: z.string().optional().nullable(),
  incident_type: IncidentTypeEnum,
  severity: IncidentSeverityEnum,
  location: z.string().max(300).optional().nullable(),
  classroom_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(5000),
  injury_description: z.string().max(5000).optional().nullable(),
  treatment_provided: z.string().max(5000).optional().nullable(),
  parents_notified: z.boolean().default(false),
  medical_followup_required: z.boolean().default(false),
  state_report_required: z.boolean().default(false),
})
export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>

export const UpdateIncidentSchema = CreateIncidentSchema.partial().extend({
  id: z.string().uuid(),
  status: IncidentStatusEnum.optional(),
})
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>

export const CloseIncidentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['closed', 'escalated']).default('closed'),
  resolution_notes: z.string().max(5000).optional(),
})
export type CloseIncidentInput = z.infer<typeof CloseIncidentSchema>

export const AddIncidentInvolvedSchema = z.object({
  incident_id: z.string().uuid(),
  party_type: z.enum([
    'injured_student',
    'injured_staff',
    'witness_student',
    'witness_staff',
    'other',
  ]),
  student_id: z.string().uuid().optional().nullable(),
  staff_user_id: z.string().uuid().optional().nullable(),
  other_name: z.string().max(200).optional().nullable(),
  statement: z.string().max(5000).optional().nullable(),
})
export type AddIncidentInvolvedInput = z.infer<typeof AddIncidentInvolvedSchema>

export const AddIncidentAttachmentSchema = z.object({
  incident_id: z.string().uuid(),
  file_path: z.string().min(1),
  file_name: z.string().max(300).optional().nullable(),
  attachment_type: z.string().max(50).optional().nullable(),
})
export type AddIncidentAttachmentInput = z.infer<typeof AddIncidentAttachmentSchema>
