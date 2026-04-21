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
