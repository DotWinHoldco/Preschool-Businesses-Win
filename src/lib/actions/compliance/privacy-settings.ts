'use server'

// @anchor: cca.compliance.privacy-settings
// Save and load privacy/retention settings for a tenant.
// Uses tenant_settings key-value table (privacy.* namespace).

import { PrivacySettingsSchema } from '@/lib/schemas/compliance'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export type PrivacySettingsState = {
  ok: boolean
  error?: string
}

const PRIVACY_KEYS = [
  'privacy.retention_days',
  'privacy.coppa_contact_email',
  'privacy.auto_delete_withdrawn',
  'privacy.anonymize_after_withdrawal',
] as const

const DEFAULTS = {
  retention_days: 730,
  coppa_contact_email: '',
  auto_delete_withdrawn: false,
  anonymize_after_withdrawal: false,
}

export type PrivacySettings = typeof DEFAULTS

export async function savePrivacySettings(formData: FormData): Promise<PrivacySettingsState> {
  await assertRole('admin')

  const raw = {
    retention_days: Number(formData.get('retention_days')),
    coppa_contact_email: formData.get('coppa_contact_email') as string,
    auto_delete_withdrawn: formData.get('auto_delete_withdrawn') === 'true',
    anonymize_after_withdrawal: formData.get('anonymize_after_withdrawal') === 'true',
  }

  const parsed = PrivacySettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Upsert each setting into tenant_settings
  const entries: Array<{ key: string; value: string }> = [
    { key: 'privacy.retention_days', value: String(parsed.data.retention_days) },
    { key: 'privacy.coppa_contact_email', value: parsed.data.coppa_contact_email },
    { key: 'privacy.auto_delete_withdrawn', value: String(parsed.data.auto_delete_withdrawn) },
    {
      key: 'privacy.anonymize_after_withdrawal',
      value: String(parsed.data.anonymize_after_withdrawal),
    },
  ]

  for (const entry of entries) {
    const { error } = await supabase
      .from('tenant_settings')
      .upsert(
        { tenant_id: tenantId, key: entry.key, value: entry.value },
        { onConflict: 'tenant_id,key' },
      )

    if (error) {
      return { ok: false, error: `Failed to save ${entry.key}: ${error.message}` }
    }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'compliance.privacy_settings.updated',
    entityType: 'tenant_settings',
    entityId: tenantId,
    after: parsed.data as unknown as Record<string, unknown>,
  })

  return { ok: true }
}

export async function loadPrivacySettings(): Promise<PrivacySettings> {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: rows } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .in('key', PRIVACY_KEYS as unknown as string[])

  const map = new Map<string, string>()
  for (const row of rows ?? []) {
    map.set(row.key as string, row.value as string)
  }

  return {
    retention_days: map.has('privacy.retention_days')
      ? Number(map.get('privacy.retention_days'))
      : DEFAULTS.retention_days,
    coppa_contact_email: map.get('privacy.coppa_contact_email') ?? DEFAULTS.coppa_contact_email,
    auto_delete_withdrawn: map.get('privacy.auto_delete_withdrawn') === 'true',
    anonymize_after_withdrawal: map.get('privacy.anonymize_after_withdrawal') === 'true',
  }
}
