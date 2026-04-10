// @anchor: cca.documents.schemas
// Zod schemas for document vault: uploads, metadata, versioning, expiry
// See CCA_BUILD_BRIEF.md §35

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Document entity types
// ---------------------------------------------------------------------------

export const DocumentEntityTypeSchema = z.enum([
  'student',
  'family',
  'staff',
  'school',
  'classroom',
])
export type DocumentEntityType = z.infer<typeof DocumentEntityTypeSchema>

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------

export const DocumentTypeSchema = z.enum([
  'immunization',
  'custody_order',
  'birth_certificate',
  'photo_consent',
  'medical_action_plan',
  'handbook_ack',
  'insurance_card',
  'background_check',
  'certification',
  'license',
  'inspection',
  'policy',
  'other',
])
export type DocumentType = z.infer<typeof DocumentTypeSchema>

// ---------------------------------------------------------------------------
// Document status
// ---------------------------------------------------------------------------

export const DocumentStatusSchema = z.enum([
  'active',
  'expired',
  'superseded',
  'archived',
])
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

// ---------------------------------------------------------------------------
// Upload document
// ---------------------------------------------------------------------------

export const UploadDocumentSchema = z.object({
  entity_type: DocumentEntityTypeSchema,
  entity_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  file_path: z.string().min(1).max(500),
  file_size_bytes: z.number().int().min(1),
  mime_type: z.string().min(1).max(100),
  expiry_date: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  checklist_response_id: z.string().uuid().optional(),
})
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>

// ---------------------------------------------------------------------------
// Update document metadata
// ---------------------------------------------------------------------------

export const UpdateDocumentSchema = z.object({
  document_id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  expiry_date: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: DocumentStatusSchema.optional(),
})
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>
