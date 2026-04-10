export interface TenantFeature {
  feature_key: string
  enabled: boolean
  config: Record<string, unknown>
}

/** All known feature keys across the platform */
export const FEATURE_KEYS = [
  'enrollment_online',
  'enrollment_waitlist',
  'enrollment_document_upload',
  'checkin_qr',
  'checkin_pin',
  'checkin_facial_recognition',
  'checkin_geofence',
  'daily_reports',
  'daily_reports_photos',
  'daily_reports_videos',
  'messaging_parent',
  'messaging_staff',
  'messaging_broadcast',
  'billing_invoicing',
  'billing_autopay',
  'billing_subsidy_tracking',
  'scheduling_staff',
  'scheduling_classrooms',
  'attendance_tracking',
  'incident_reports',
  'meal_tracking',
  'nap_tracking',
  'learning_milestones',
  'parent_portal',
  'custom_domain',
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

/**
 * Check if a specific feature is enabled for a tenant.
 */
export function hasTenantFeature(
  features: TenantFeature[],
  key: string
): boolean {
  const feature = features.find((f) => f.feature_key === key)
  return feature?.enabled ?? false
}

/**
 * Get the config object for a specific feature, or null if not found / disabled.
 */
export function getFeatureConfig(
  features: TenantFeature[],
  key: string
): Record<string, unknown> | null {
  const feature = features.find((f) => f.feature_key === key)
  if (!feature?.enabled) return null
  return feature.config
}
