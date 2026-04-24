// @anchor: cca.subsidy.schema
// Zod schemas for state subsidy tracking, agency management, and claims.
// Matches subsidy_agencies, family_subsidies, and subsidy_claims tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Subsidy status enum
// ---------------------------------------------------------------------------

export const subsidyStatusEnum = z.enum(['active', 'expired', 'pending_renewal', 'terminated'])

export type SubsidyStatus = z.infer<typeof subsidyStatusEnum>

// ---------------------------------------------------------------------------
// Subsidy claim status enum
// ---------------------------------------------------------------------------

export const subsidyClaimStatusEnum = z.enum([
  'draft',
  'submitted',
  'paid',
  'partially_paid',
  'denied',
])

export type SubsidyClaimStatus = z.infer<typeof subsidyClaimStatusEnum>

// ---------------------------------------------------------------------------
// Subsidy Agency
// ---------------------------------------------------------------------------

export const agencyTypeEnum = z.enum(['state', 'county', 'federal', 'tribal', 'private'])
export type AgencyType = z.infer<typeof agencyTypeEnum>

export const billingFormatEnum = z.enum(['edr', 'manual', 'api', 'standard_csv', 'custom'])
export type BillingFormat = z.infer<typeof billingFormatEnum>

export const CreateSubsidyAgencySchema = z.object({
  name: z.string().min(1, 'Agency name is required').max(300),
  agency_type: agencyTypeEnum.default('state'),
  state: z.string().min(1, 'State is required').max(50),
  county: z.string().max(100).optional().nullable(),
  contact_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(30).optional().nullable(),
  billing_format: billingFormatEnum.default('manual'),
  payment_terms_days: z.number().int().min(1).max(365).default(30),
  notes: z.string().max(5000).optional(),
})

export type CreateSubsidyAgencyInput = z.infer<typeof CreateSubsidyAgencySchema>

export const UpdateSubsidyAgencySchema = z.object({
  id: z.string().uuid('Invalid agency ID'),
  name: z.string().min(1).max(300).optional(),
  agency_type: agencyTypeEnum.optional(),
  state: z.string().min(1).max(50).optional(),
  county: z.string().max(100).optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(30).optional().nullable(),
  billing_format: billingFormatEnum.optional(),
  payment_terms_days: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(5000).optional().nullable(),
})

export type UpdateSubsidyAgencyInput = z.infer<typeof UpdateSubsidyAgencySchema>

export const DeleteSubsidyAgencySchema = z.object({
  id: z.string().uuid('Invalid agency ID'),
})

export type DeleteSubsidyAgencyInput = z.infer<typeof DeleteSubsidyAgencySchema>

// ---------------------------------------------------------------------------
// Subsidy Claim lifecycle
// ---------------------------------------------------------------------------

export const MarkSubsidyClaimSubmittedSchema = z.object({
  id: z.string().uuid('Invalid claim ID'),
})
export type MarkSubsidyClaimSubmittedInput = z.infer<typeof MarkSubsidyClaimSubmittedSchema>

export const MarkSubsidyClaimPaidSchema = z.object({
  id: z.string().uuid('Invalid claim ID'),
  total_paid_cents: z.number().int().min(0, 'Paid amount must be positive'),
})
export type MarkSubsidyClaimPaidInput = z.infer<typeof MarkSubsidyClaimPaidSchema>

export const CancelSubsidyClaimSchema = z.object({
  id: z.string().uuid('Invalid claim ID'),
  reason: z.string().max(1000).optional(),
})
export type CancelSubsidyClaimInput = z.infer<typeof CancelSubsidyClaimSchema>

// ---------------------------------------------------------------------------
// Manage Family Subsidy
// ---------------------------------------------------------------------------

export const CreateFamilySubsidySchema = z.object({
  family_id: z.string().uuid('Invalid family ID'),
  student_id: z.string().uuid('Invalid student ID'),
  agency_id: z.string().uuid('Invalid agency ID'),
  case_number: z.string().min(1, 'Case number is required').max(100),
  authorization_start: z.string().min(1, 'Start date is required'),
  authorization_end: z.string().min(1, 'End date is required'),
  authorized_days_per_week: z.number().int().min(1).max(7),
  authorized_hours_per_day: z.number().min(0.5).max(24),
  subsidy_rate_cents_per_day: z.number().int().min(0),
  family_copay_cents_per_week: z.number().int().min(0),
  status: subsidyStatusEnum.default('active'),
  notes: z.string().max(5000).optional(),
})

export type CreateFamilySubsidyInput = z.infer<typeof CreateFamilySubsidySchema>

export const UpdateFamilySubsidySchema = z.object({
  id: z.string().uuid('Invalid subsidy ID'),
  case_number: z.string().min(1).max(100).optional(),
  authorization_start: z.string().optional(),
  authorization_end: z.string().optional(),
  authorized_days_per_week: z.number().int().min(1).max(7).optional(),
  authorized_hours_per_day: z.number().min(0.5).max(24).optional(),
  subsidy_rate_cents_per_day: z.number().int().min(0).optional(),
  family_copay_cents_per_week: z.number().int().min(0).optional(),
  status: subsidyStatusEnum.optional(),
  notes: z.string().max(5000).optional().nullable(),
})

export type UpdateFamilySubsidyInput = z.infer<typeof UpdateFamilySubsidySchema>

// ---------------------------------------------------------------------------
// Generate Subsidy Claim
// ---------------------------------------------------------------------------

export const GenerateSubsidyClaimSchema = z.object({
  agency_id: z.string().uuid('Invalid agency ID'),
  claim_period_start: z.string().min(1, 'Start date is required'),
  claim_period_end: z.string().min(1, 'End date is required'),
  notes: z.string().max(5000).optional(),
})

export type GenerateSubsidyClaimInput = z.infer<typeof GenerateSubsidyClaimSchema>
