// @anchor: cca.leads.schema
// Zod schemas for enrollment CRM lead management, lead activities, and tours.
// Matches enrollment_leads, lead_activities, and tours tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Lead source enum
// ---------------------------------------------------------------------------

export const leadSourceEnum = z.enum([
  'website',
  'phone',
  'walk_in',
  'referral',
  'facebook',
  'google',
  'event',
  'other',
])

export type LeadSource = z.infer<typeof leadSourceEnum>

// ---------------------------------------------------------------------------
// Lead status enum
// ---------------------------------------------------------------------------

export const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'tour_scheduled',
  'tour_completed',
  'application_sent',
  'application_received',
  'enrolled',
  'lost',
])

export type LeadStatus = z.infer<typeof leadStatusEnum>

// ---------------------------------------------------------------------------
// Lead priority enum
// ---------------------------------------------------------------------------

export const leadPriorityEnum = z.enum(['hot', 'warm', 'cold'])

export type LeadPriority = z.infer<typeof leadPriorityEnum>

// ---------------------------------------------------------------------------
// Lead activity type enum
// ---------------------------------------------------------------------------

export const leadActivityTypeEnum = z.enum([
  'email_sent',
  'call_made',
  'call_received',
  'tour_scheduled',
  'tour_completed',
  'application_sent',
  'note_added',
  'status_changed',
])

export type LeadActivityType = z.infer<typeof leadActivityTypeEnum>

// ---------------------------------------------------------------------------
// Create / Update Lead
// ---------------------------------------------------------------------------

export const CreateLeadSchema = z.object({
  source: leadSourceEnum,
  source_detail: z.string().max(500).optional(),
  parent_first_name: z.string().min(1, 'First name is required').max(100),
  parent_last_name: z.string().min(1, 'Last name is required').max(100),
  parent_email: z.string().email('Invalid email').optional(),
  parent_phone: z.string().max(30).optional(),
  child_name: z.string().max(200).optional(),
  child_age_months: z.number().int().min(0).max(120).optional(),
  program_interest: z.string().max(200).optional(),
  priority: leadPriorityEnum.default('warm'),
  notes: z.string().max(5000).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const UpdateLeadSchema = z.object({
  id: z.string().uuid('Invalid lead ID'),
  status: leadStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  parent_first_name: z.string().min(1).max(100).optional(),
  parent_last_name: z.string().min(1).max(100).optional(),
  parent_email: z.string().email().optional().nullable(),
  parent_phone: z.string().max(30).optional().nullable(),
  child_name: z.string().max(200).optional().nullable(),
  child_age_months: z.number().int().min(0).max(120).optional().nullable(),
  program_interest: z.string().max(200).optional().nullable(),
  lost_reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

// ---------------------------------------------------------------------------
// Add Lead Activity
// ---------------------------------------------------------------------------

export const AddLeadActivitySchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  activity_type: leadActivityTypeEnum,
  description: z.string().min(1, 'Description is required').max(5000),
})

export type AddLeadActivityInput = z.infer<typeof AddLeadActivitySchema>

// ---------------------------------------------------------------------------
// Schedule Tour
// ---------------------------------------------------------------------------

export const ScheduleTourSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  scheduled_at: z.string().min(1, 'Date/time is required'),
  notes: z.string().max(5000).optional(),
})

export type ScheduleTourInput = z.infer<typeof ScheduleTourSchema>

// ---------------------------------------------------------------------------
// Complete Tour
// ---------------------------------------------------------------------------

export const CompleteTourSchema = z.object({
  tour_id: z.string().uuid('Invalid tour ID'),
  parent_attended: z.boolean(),
  notes: z.string().max(5000).optional(),
})

export type CompleteTourInput = z.infer<typeof CompleteTourSchema>

// ---------------------------------------------------------------------------
// Send Follow-up
// ---------------------------------------------------------------------------

export const SendFollowUpSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  subject: z.string().min(1, 'Subject is required').max(300),
  body: z.string().min(1, 'Body is required').max(10000),
  channel: z.enum(['email', 'sms']).default('email'),
})

export type SendFollowUpInput = z.infer<typeof SendFollowUpSchema>

// ---------------------------------------------------------------------------
// Process Application (enrollment)
// ---------------------------------------------------------------------------

export const ProcessApplicationSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  action: z.enum(['approve', 'reject', 'waitlist', 'request_info']),
  notes: z.string().max(5000).optional(),
  waitlist_position: z.number().int().min(1).optional(),
})

export type ProcessApplicationInput = z.infer<typeof ProcessApplicationSchema>
