// @anchor: platform.compliance.schemas
// Zod schemas for FERPA/GDPR compliance: consent, privacy settings, data export, anonymization.

import { z } from 'zod'

export const ConsentTypeEnum = z.enum([
  'photo_use',
  'data_sharing',
  'marketing',
  'directory_inclusion',
  'third_party_sharing',
  'field_trip_photo',
])

export type ConsentType = z.infer<typeof ConsentTypeEnum>

export const UpsertConsentSchema = z.object({
  family_id: z.string().uuid(),
  student_id: z.string().uuid().optional(),
  consent_type: ConsentTypeEnum,
  granted: z.boolean(),
})

export type UpsertConsentInput = z.infer<typeof UpsertConsentSchema>

export const PrivacySettingsSchema = z.object({
  retention_days: z.number().int().min(90).max(3650),
  coppa_contact_email: z.string().email(),
  auto_delete_withdrawn: z.boolean(),
  anonymize_after_withdrawal: z.boolean(),
})

export type PrivacySettingsInput = z.infer<typeof PrivacySettingsSchema>

export const DataExportRequestSchema = z.object({
  export_format: z.enum(['csv', 'json']),
  family_id: z.string().uuid().optional(),
})

export type DataExportRequestInput = z.infer<typeof DataExportRequestSchema>

export const AnonymizeFamilySchema = z.object({
  family_id: z.string().uuid(),
  confirmation_text: z.string().min(1),
})

export type AnonymizeFamilyInput = z.infer<typeof AnonymizeFamilySchema>

// ---------------------------------------------------------------------------
// DFPS Compliance (Texas Chapter 746)
// ---------------------------------------------------------------------------

export const DfpsComplianceStatusEnum = z.enum(['compliant', 'non_compliant', 'unknown', 'na'])
export type DfpsComplianceStatus = z.infer<typeof DfpsComplianceStatusEnum>

export const CreateDfpsStandardSchema = z.object({
  rule_code: z.string().min(1).max(60),
  subchapter: z.string().max(120).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  rule_text: z.string().min(1).max(10000),
  applies_to: z.array(z.string()).default([]),
  compliance_status: DfpsComplianceStatusEnum.default('unknown'),
  notes: z.string().max(5000).optional().nullable(),
})
export type CreateDfpsStandardInput = z.infer<typeof CreateDfpsStandardSchema>

export const UpdateDfpsStandardStatusSchema = z.object({
  id: z.string().uuid(),
  compliance_status: DfpsComplianceStatusEnum,
  evidence_note: z.string().max(5000).optional().nullable(),
  evidence_path: z.string().max(1000).optional().nullable(),
})
export type UpdateDfpsStandardStatusInput = z.infer<typeof UpdateDfpsStandardStatusSchema>

export const DeleteDfpsStandardSchema = z.object({
  id: z.string().uuid(),
})
export type DeleteDfpsStandardInput = z.infer<typeof DeleteDfpsStandardSchema>

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------

export const CreateCameraSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(300).optional().nullable(),
  hardware_type: z.string().max(120).optional().nullable(),
  stream_url: z.string().max(1000).optional().nullable(),
  recording_enabled: z.boolean().default(false),
  thumbnail_url: z.string().max(1000).optional().nullable(),
})
export type CreateCameraInput = z.infer<typeof CreateCameraSchema>

export const UpdateCameraSchema = CreateCameraSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['online', 'offline', 'unknown']).optional(),
})
export type UpdateCameraInput = z.infer<typeof UpdateCameraSchema>

export const DeleteCameraSchema = z.object({ id: z.string().uuid() })
export type DeleteCameraInput = z.infer<typeof DeleteCameraSchema>

// ---------------------------------------------------------------------------
// Doors (access points)
// ---------------------------------------------------------------------------

export const AccessPointStatusEnum = z.enum(['locked', 'unlocked', 'unknown', 'offline'])
export type AccessPointStatus = z.infer<typeof AccessPointStatusEnum>

export const CreateAccessPointSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(300).optional().nullable(),
  door_type: z
    .enum(['entry', 'exit', 'classroom', 'emergency', 'playground'])
    .optional()
    .nullable(),
  lock_type: z.enum(['magnetic', 'keypad', 'rfid', 'badge', 'manual']).optional().nullable(),
  hardware_id: z.string().max(200).optional().nullable(),
  is_active: z.boolean().default(true),
})
export type CreateAccessPointInput = z.infer<typeof CreateAccessPointSchema>

export const UpdateAccessPointSchema = CreateAccessPointSchema.partial().extend({
  id: z.string().uuid(),
  current_status: AccessPointStatusEnum.optional(),
})
export type UpdateAccessPointInput = z.infer<typeof UpdateAccessPointSchema>

export const DeleteAccessPointSchema = z.object({ id: z.string().uuid() })
export type DeleteAccessPointInput = z.infer<typeof DeleteAccessPointSchema>

export const LogAccessEventSchema = z.object({
  access_point_id: z.string().uuid(),
  event_type: z.enum(['unlock', 'lock', 'denied', 'forced', 'tailgate', 'manual_override']),
  actor_label: z.string().max(200).optional().nullable(),
  success: z.boolean().default(true),
  denied_reason: z.string().max(500).optional().nullable(),
})
export type LogAccessEventInput = z.infer<typeof LogAccessEventSchema>
