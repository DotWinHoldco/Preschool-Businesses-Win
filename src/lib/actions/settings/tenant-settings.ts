// @anchor: cca.settings.tenant-settings
// Generic loader/saver for the `tenant_settings` key-value table.
// Each row stores a namespaced key (e.g. 'profile.school_name') and a
// JSON-stringified value. Consumers save whole form objects under a prefix
// and get back a plain object on load.

'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type SettingsSaveState = {
  ok: boolean
  error?: string
}

/**
 * Load all settings rows whose keys start with `${keyPrefix}.` and return
 * them as an object with the prefix stripped. Values are JSON-parsed; any
 * row whose value is not valid JSON is returned as the raw string.
 *
 * Example: prefix='profile' with rows [{ key: 'profile.school_name', value: '"CCA"' }]
 *   -> { school_name: 'CCA' }
 */
export async function loadTenantSettings(keyPrefix: string): Promise<Record<string, unknown>> {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data, error } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .like('key', `${keyPrefix}.%`)

  if (error || !data) return {}

  const out: Record<string, unknown> = {}
  const prefixLen = keyPrefix.length + 1
  for (const row of data as Array<{ key: string; value: string | null }>) {
    const field = row.key.slice(prefixLen)
    const raw = row.value ?? ''
    try {
      out[field] = JSON.parse(raw)
    } catch {
      // Legacy plain strings — return as-is
      out[field] = raw
    }
  }
  return out
}

/**
 * Upsert each key under the prefix. Values are JSON.stringify'd so round-trip
 * is loss-less for booleans, numbers, arrays, and objects. Requires admin role,
 * writes a single audit_log entry, and revalidates the page path when given.
 */
export async function saveTenantSettings(
  keyPrefix: string,
  values: Record<string, unknown>,
  options?: { pagePath?: string; auditAction?: string },
): Promise<SettingsSaveState> {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const rows = Object.entries(values).map(([field, value]) => ({
    tenant_id: tenantId,
    key: `${keyPrefix}.${field}`,
    value: JSON.stringify(value ?? null),
  }))

  for (const row of rows) {
    const { error } = await supabase
      .from('tenant_settings')
      .upsert(row, { onConflict: 'tenant_id,key' })

    if (error) {
      return { ok: false, error: `Failed to save ${row.key}: ${error.message}` }
    }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: options?.auditAction ?? `settings.${keyPrefix}.updated`,
    entityType: 'tenant_settings',
    entityId: tenantId,
    after: values,
  })

  if (options?.pagePath) {
    revalidatePath(options.pagePath)
  }

  return { ok: true }
}
