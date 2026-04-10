// ─── Tenant Configuration ────────────────────────────────────────────────────

export interface TenantBranding {
  tenant_id: string
  color_primary: string
  color_primary_foreground: string
  color_secondary: string
  color_secondary_foreground: string
  color_accent: string
  color_accent_foreground: string
  color_background: string
  color_foreground: string
  color_muted: string
  color_muted_foreground: string
  color_card: string
  color_card_foreground: string
  color_border: string
  color_destructive: string
  color_destructive_foreground: string
  color_success: string
  color_warning: string
  font_heading: string
  font_body: string
  font_mono: string
  border_radius: string
  logo_url: string | null
  logo_icon_url: string | null
  favicon_url: string | null
  og_image_url: string | null
  tagline: string | null
}

export interface TenantFeature {
  feature_key: string
  enabled: boolean
  config: Record<string, unknown>
}

export interface TenantConfig {
  id: string
  slug: string
  name: string
  branding: TenantBranding
  features: TenantFeature[]
  plan_tier: PlanTier
  timezone: string
  locale: string
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role =
  | 'owner'
  | 'admin'
  | 'director'
  | 'lead_teacher'
  | 'assistant_teacher'
  | 'aide'
  | 'front_desk'
  | 'parent'

// ─── Enums ───────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise'

export type EnrollmentStatus =
  | 'inquiry'
  | 'tour_scheduled'
  | 'tour_completed'
  | 'application_submitted'
  | 'application_review'
  | 'waitlisted'
  | 'offered'
  | 'accepted'
  | 'enrolled'
  | 'withdrawn'
  | 'graduated'
  | 'disenrolled'

export type CheckInMethod =
  | 'qr_code'
  | 'pin_entry'
  | 'facial_recognition'
  | 'manual'
  | 'geofence'

export type CheckInDirection = 'check_in' | 'check_out'

export type DailyReportEntryType =
  | 'meal'
  | 'nap'
  | 'diaper'
  | 'bathroom'
  | 'activity'
  | 'mood'
  | 'milestone'
  | 'medication'
  | 'note'
  | 'photo'
  | 'video'

export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical'

export type IncidentStatus =
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'parent_notified'
  | 'resolved'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'void'
  | 'refunded'

export type PaymentMethod =
  | 'credit_card'
  | 'ach'
  | 'check'
  | 'cash'
  | 'subsidy'
  | 'other'

export type MessageType = 'direct' | 'group' | 'broadcast' | 'announcement'

export type StaffScheduleStatus =
  | 'scheduled'
  | 'clocked_in'
  | 'on_break'
  | 'clocked_out'
  | 'absent'
  | 'pto'

export type ClassroomStatus = 'active' | 'inactive' | 'archived'

export type AgeGroup =
  | 'infant'
  | 'toddler'
  | 'twos'
  | 'preschool'
  | 'pre_k'
  | 'school_age'

export type MealType = 'breakfast' | 'am_snack' | 'lunch' | 'pm_snack' | 'dinner'

export type NapQuality = 'restful' | 'restless' | 'did_not_sleep'

export type MoodRating = 'great' | 'good' | 'okay' | 'fussy' | 'upset'

export type DocumentType =
  | 'immunization_record'
  | 'birth_certificate'
  | 'medical_form'
  | 'emergency_contact'
  | 'photo_release'
  | 'custody_agreement'
  | 'allergy_plan'
  | 'iep'
  | 'other'
