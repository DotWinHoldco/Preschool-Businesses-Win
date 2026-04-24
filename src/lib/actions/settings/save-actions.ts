// @anchor: cca.settings.save-actions
// Per-prefix typed server actions. Each validates with its Zod schema and
// delegates persistence to saveTenantSettings().

'use server'

import { saveTenantSettings, type SettingsSaveState } from './tenant-settings'
import {
  ProfileSettingsSchema,
  BillingSettingsSchema,
  BrandingSettingsSchema,
  CheckinSettingsSchema,
  DropinSettingsSchema,
  FeaturesSettingsSchema,
  IntegrationsSettingsSchema,
  NotificationsSettingsSchema,
} from '@/lib/schemas/settings'

function firstError(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? 'Validation failed'
}

export async function saveProfileSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = ProfileSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('profile', parsed.data, {
    pagePath: '/portal/admin/settings/profile',
    auditAction: 'settings.profile.updated',
  })
}

export async function saveBillingSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = BillingSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('billing', parsed.data, {
    pagePath: '/portal/admin/settings/billing',
    auditAction: 'settings.billing.updated',
  })
}

export async function saveBrandingSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = BrandingSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('branding', parsed.data, {
    pagePath: '/portal/admin/settings/branding',
    auditAction: 'settings.branding.updated',
  })
}

export async function saveCheckinSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = CheckinSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('checkin', parsed.data, {
    pagePath: '/portal/admin/settings/check-in',
    auditAction: 'settings.checkin.updated',
  })
}

export async function saveDropinSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = DropinSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('dropin', parsed.data, {
    pagePath: '/portal/admin/settings/drop-in',
    auditAction: 'settings.dropin.updated',
  })
}

export async function saveFeaturesSettings(input: unknown): Promise<SettingsSaveState> {
  // TODO: a middleware check should read features.* flags and enforce
  // sidebar/route visibility. For now this action only persists state.
  const parsed = FeaturesSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('features', parsed.data, {
    pagePath: '/portal/admin/settings/features',
    auditAction: 'settings.features.updated',
  })
}

export async function saveIntegrationsSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = IntegrationsSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('integrations', parsed.data, {
    pagePath: '/portal/admin/settings/integrations',
    auditAction: 'settings.integrations.updated',
  })
}

export async function saveNotificationsSettings(input: unknown): Promise<SettingsSaveState> {
  const parsed = NotificationsSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  return saveTenantSettings('notifications', parsed.data, {
    pagePath: '/portal/admin/settings/notifications',
    auditAction: 'settings.notifications.updated',
  })
}
