// @anchor: cca.settings.schemas
// Zod schemas for admin tenant settings forms.
// Keys are namespaced (e.g. 'profile.school_name') and stored as stringified
// values in the `tenant_settings` table.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const ProfileSettingsSchema = z.object({
  school_name: z.string().min(1, 'School name is required').max(200),
  address_line1: z.string().max(200).default(''),
  address_line2: z.string().max(200).default(''),
  city: z.string().max(100).default(''),
  state: z.string().max(50).default(''),
  zip: z.string().max(20).default(''),
  phone: z.string().max(50).default(''),
  email: z
    .string()
    .max(200)
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Invalid email',
    })
    .default(''),
  tax_id: z.string().max(50).default(''),
  timezone: z.string().max(100).default('America/Chicago'),
})

export type ProfileSettings = z.infer<typeof ProfileSettingsSchema>

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export const BillingSettingsSchema = z.object({
  late_fees_enabled: z.boolean().default(true),
  late_fee_amount_cents: z.coerce.number().int().min(0).max(100000).default(0),
  late_fee_percent: z.coerce.number().min(0).max(100).default(0),
  grace_period_days: z.coerce.number().int().min(0).max(365).default(5),
  processing_fee_passthrough: z.boolean().default(false),
  accepted_methods: z
    .array(z.enum(['credit_card', 'ach', 'check', 'cash']))
    .default(['credit_card', 'ach', 'check', 'cash']),
})

export type BillingSettings = z.infer<typeof BillingSettingsSchema>

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

export const BrandingSettingsSchema = z.object({
  logo_url: z.string().max(500).default(''),
  icon_url: z.string().max(500).default(''),
  favicon_url: z.string().max(500).default(''),
  name: z.string().max(200).default(''),
  tagline: z.string().max(300).default(''),
  primary_color: z.string().max(20).default('#5CB961'),
  secondary_color: z.string().max(20).default('#3B70B0'),
  accent_color: z.string().max(20).default('#F15A50'),
  heading_font: z.string().max(100).default('Nunito'),
  body_font: z.string().max(100).default('Open Sans'),
  border_radius: z.string().max(20).default('0.75rem'),
})

export type BrandingSettings = z.infer<typeof BrandingSettingsSchema>

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export const CheckinSettingsSchema = z.object({
  qr_rotation_seconds: z.coerce.number().int().min(10).max(3600).default(30),
  kiosk_timeout_seconds: z.coerce.number().int().min(15).max(3600).default(60),
  screening_questions: z.array(z.string().min(1).max(500)).default([]),
})

export type CheckinSettings = z.infer<typeof CheckinSettingsSchema>

// ---------------------------------------------------------------------------
// Drop-in
// ---------------------------------------------------------------------------

export const DropinSettingsSchema = z.object({
  cancellation_window_hours: z.coerce.number().int().min(0).max(720).default(24),
  minimum_notice_hours: z.coerce.number().int().min(0).max(720).default(4),
  max_consecutive_days: z.coerce.number().int().min(1).max(365).default(5),
  require_immunization: z.boolean().default(true),
  require_emergency_contact: z.boolean().default(true),
  auto_confirm_regular_families: z.boolean().default(true),
})

export type DropinSettings = z.infer<typeof DropinSettingsSchema>

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export const FeaturesSettingsSchema = z.object({
  lesson_plans: z.boolean().default(true),
  portfolios: z.boolean().default(true),
  messaging: z.boolean().default(true),
  newsfeed: z.boolean().default(true),
  appointments: z.boolean().default(true),
  drop_in: z.boolean().default(true),
  training: z.boolean().default(true),
  checklists: z.boolean().default(true),
  dfps_compliance: z.boolean().default(true),
  emergency: z.boolean().default(true),
  cameras: z.boolean().default(false),
  doors: z.boolean().default(false),
  payroll: z.boolean().default(true),
  billing: z.boolean().default(true),
  subsidies: z.boolean().default(true),
})

export type FeaturesSettings = z.infer<typeof FeaturesSettingsSchema>

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const IntegrationsSettingsSchema = z.object({
  stripe_connected: z.boolean().default(false),
  quickbooks_connected: z.boolean().default(false),
  google_connected: z.boolean().default(false),
  twilio_connected: z.boolean().default(false),
})

export type IntegrationsSettings = z.infer<typeof IntegrationsSettingsSchema>

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const NotificationsSettingsSchema = z.object({
  sender_name: z.string().max(200).default(''),
  sms_sender_id: z.string().max(20).default(''),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Expected HH:MM')
    .default('20:00'),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Expected HH:MM')
    .default('07:00'),
})

export type NotificationsSettings = z.infer<typeof NotificationsSettingsSchema>

// ---------------------------------------------------------------------------
// Prefix registry — used by the generic loader/saver to scope operations
// ---------------------------------------------------------------------------

export const SETTINGS_PREFIXES = [
  'profile',
  'billing',
  'branding',
  'checkin',
  'dropin',
  'features',
  'integrations',
  'notifications',
] as const

export type SettingsPrefix = (typeof SETTINGS_PREFIXES)[number]
