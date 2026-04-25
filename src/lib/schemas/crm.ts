import { z } from 'zod'

export const LIFECYCLE_STAGES = [
  'subscriber',
  'lead',
  'opportunity',
  'applicant',
  'enrolled_parent',
  'alumni_parent',
  'staff',
  'other',
] as const
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export const CONTACT_SOURCES = [
  'website_form',
  'enrollment_form',
  'newsletter',
  'tour_request',
  'phone_inquiry',
  'walk_in',
  'referral',
  'event',
  'facebook',
  'instagram',
  'google',
  'tiktok',
  'manual_admin',
  'imported',
  'staff_onboarding',
  'other',
] as const
export type ContactSource = (typeof CONTACT_SOURCES)[number]

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  subscriber: 'Subscriber',
  lead: 'Lead',
  opportunity: 'Opportunity',
  applicant: 'Applicant',
  enrolled_parent: 'Enrolled parent',
  alumni_parent: 'Alumni parent',
  staff: 'Staff',
  other: 'Other',
}

export const SOURCE_LABELS: Record<ContactSource, string> = {
  website_form: 'Website form',
  enrollment_form: 'Enrollment form',
  newsletter: 'Newsletter',
  tour_request: 'Tour request',
  phone_inquiry: 'Phone inquiry',
  walk_in: 'Walk-in',
  referral: 'Referral',
  event: 'Event',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  tiktok: 'TikTok',
  manual_admin: 'Manual',
  imported: 'Imported',
  staff_onboarding: 'Staff onboarding',
  other: 'Other',
}

export const LIFECYCLE_COLORS: Record<LifecycleStage, string> = {
  subscriber: '#94a3b8',
  lead: '#3b70b0',
  opportunity: '#f2b020',
  applicant: '#f878af',
  enrolled_parent: '#5cb961',
  alumni_parent: '#9ca3af',
  staff: '#4abdac',
  other: '#cbd5e1',
}

const emailField = z.string().trim().toLowerCase().email().max(254).optional().nullable()

const phoneField = z.string().trim().max(40).optional().nullable()
const nameField = z.string().trim().max(80).optional().nullable()

export const ContactCreateSchema = z
  .object({
    email: emailField,
    phone: phoneField,
    first_name: nameField,
    last_name: nameField,
    lifecycle_stage: z.enum(LIFECYCLE_STAGES).default('lead'),
    source: z.enum(CONTACT_SOURCES).default('manual_admin'),
    source_detail: z.string().trim().max(200).optional().nullable(),
    notes: z.string().trim().max(4000).optional().nullable(),
    owner_user_id: z.string().uuid().optional().nullable(),
    tag_ids: z.array(z.string().uuid()).optional().default([]),
  })
  .refine((d) => !!(d.email || d.phone), {
    message: 'A contact needs at least an email or a phone number.',
    path: ['email'],
  })

export type ContactCreateInput = z.infer<typeof ContactCreateSchema>

export const ContactUpdateSchema = z.object({
  id: z.string().uuid(),
  email: emailField,
  phone: phoneField,
  first_name: nameField,
  last_name: nameField,
  lifecycle_stage: z.enum(LIFECYCLE_STAGES).optional(),
  source: z.enum(CONTACT_SOURCES).optional(),
  source_detail: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
  owner_user_id: z.string().uuid().optional().nullable(),
  email_subscribed: z.boolean().optional(),
})

export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>

export const TagCreateSchema = z.object({
  label: z.string().trim().min(1).max(60),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default('#3b70b0'),
  description: z.string().trim().max(200).optional().nullable(),
})

export const TagAssignSchema = z.object({
  contact_id: z.string().uuid(),
  tag_id: z.string().uuid(),
})

export const NoteSchema = z.object({
  contact_id: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
})
