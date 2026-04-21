// @anchor: cca.family.schema
// Zod schemas for family CRUD, family members, and authorized pickups.
// Matches families, family_members, and authorized_pickups tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Relationship types
// ---------------------------------------------------------------------------

export const relationshipTypeEnum = z.enum([
  'mother',
  'father',
  'stepmother',
  'stepfather',
  'grandparent',
  'nanny',
  'other',
])

// ---------------------------------------------------------------------------
// Create Family
// ---------------------------------------------------------------------------

export const CreateFamilySchema = z.object({
  family_name: z.string().min(1, 'Family name is required').max(200),
  mailing_address_line1: z.string().max(300).optional(),
  mailing_address_line2: z.string().max(300).optional(),
  mailing_city: z.string().max(100).optional(),
  mailing_state: z.string().max(50).optional(),
  mailing_zip: z.string().max(20).optional(),
  billing_email: z.string().email('Invalid email').optional(),
  billing_phone: z.string().max(30).optional(),
  notes_internal: z.string().max(5000).optional(),
})

export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>

// ---------------------------------------------------------------------------
// Update Family
// ---------------------------------------------------------------------------

export const UpdateFamilySchema = z.object({
  id: z.string().uuid('Invalid family ID'),
  family_name: z.string().min(1).max(200).optional(),
  mailing_address_line1: z.string().max(300).optional().nullable(),
  mailing_address_line2: z.string().max(300).optional().nullable(),
  mailing_city: z.string().max(100).optional().nullable(),
  mailing_state: z.string().max(50).optional().nullable(),
  mailing_zip: z.string().max(20).optional().nullable(),
  billing_email: z.string().email().optional().nullable(),
  billing_phone: z.string().max(30).optional().nullable(),
  auto_pay_enabled: z.boolean().optional(),
  notes_internal: z.string().max(5000).optional().nullable(),
})

export type UpdateFamilyInput = z.infer<typeof UpdateFamilySchema>

// ---------------------------------------------------------------------------
// Create Family Member
// ---------------------------------------------------------------------------

export const CreateFamilyMemberSchema = z.object({
  family_id: z.string().uuid('Invalid family ID'),
  user_id: z.string().uuid('Invalid user ID').optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(30).optional(),
  relationship_type: relationshipTypeEnum,
  relationship_label: z.string().max(100).optional(),
  is_primary_contact: z.boolean().default(false),
  is_billing_responsible: z.boolean().default(false),
  can_pickup_default: z.boolean().default(true),
  lives_in_household: z.boolean().default(true),
  custody_notes: z.string().max(5000).optional(),
})

export type CreateFamilyMemberInput = z.infer<typeof CreateFamilyMemberSchema>

// ---------------------------------------------------------------------------
// Update Family Member
// ---------------------------------------------------------------------------

export const UpdateFamilyMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
  family_id: z.string().uuid('Invalid family ID'),
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().min(1, 'Last name is required').max(100).optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  relationship_type: relationshipTypeEnum.optional(),
  relationship_label: z.string().max(100).optional().nullable(),
  is_primary_contact: z.boolean().optional(),
  is_billing_responsible: z.boolean().optional(),
  can_pickup_default: z.boolean().optional(),
  lives_in_household: z.boolean().optional(),
  custody_notes: z.string().max(5000).optional().nullable(),
})

export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>

// ---------------------------------------------------------------------------
// Remove Family Member
// ---------------------------------------------------------------------------

export const RemoveFamilyMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
  family_id: z.string().uuid('Invalid family ID'),
})

// ---------------------------------------------------------------------------
// Authorized Pickup
// ---------------------------------------------------------------------------

export const CreateAuthorizedPickupSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  family_id: z.string().uuid('Invalid family ID'),
  person_name: z.string().min(1, 'Name is required').max(200),
  relationship: z.string().min(1, 'Relationship is required').max(100),
  phone: z.string().max(30).optional(),
  photo_path: z.string().optional(),
  government_id_type: z.string().max(100).optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export type CreateAuthorizedPickupInput = z.infer<typeof CreateAuthorizedPickupSchema>

export const UpdateAuthorizedPickupSchema = CreateAuthorizedPickupSchema.extend({
  id: z.string().uuid('Invalid pickup ID'),
}).partial().required({ id: true })

export const RemoveAuthorizedPickupSchema = z.object({
  id: z.string().uuid('Invalid pickup ID'),
  student_id: z.string().uuid('Invalid student ID'),
})
