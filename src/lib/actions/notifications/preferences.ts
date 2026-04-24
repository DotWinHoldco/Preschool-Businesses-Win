'use server'

// @anchor: cca.notifications.preferences
// Load + save per-user notification preferences to notification_preferences table.

import { revalidatePath } from 'next/cache'
import { getSession, assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  NotificationPreferenceRowSchema,
  SaveNotificationPreferencesSchema,
  type NotificationPreferenceRow,
} from '@/lib/schemas/notifications'
import { writeAudit } from '@/lib/audit'

export type LoadPreferencesState = {
  ok: boolean
  error?: string
  rows?: NotificationPreferenceRow[]
}

export async function loadNotificationPreferences(): Promise<LoadPreferencesState> {
  try {
    const session = await getSession()
    if (!session) {
      return { ok: false, error: 'Authentication required', rows: [] }
    }
    const tenantId = await getTenantId()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('notification_type, channel, enabled')
      .eq('user_id', session.user.id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message, rows: [] }
    }

    const rows: NotificationPreferenceRow[] = []
    for (const r of data ?? []) {
      const parsed = NotificationPreferenceRowSchema.safeParse(r)
      if (parsed.success) rows.push(parsed.data)
    }

    return { ok: true, rows }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error', rows: [] }
  }
}

export type SavePreferencesState = {
  ok: boolean
  error?: string
  count?: number
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferenceRow[],
): Promise<SavePreferencesState> {
  try {
    // Any authenticated member can save their own prefs
    await assertRole('applicant_parent')

    const parsed = SaveNotificationPreferencesSchema.safeParse({ prefs })
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const session = await getSession()
    if (!session) return { ok: false, error: 'Authentication required' }

    const tenantId = await getTenantId()
    const supabase = createAdminClient()

    const rows = parsed.data.prefs.map((p) => ({
      user_id: session.user.id,
      tenant_id: tenantId,
      notification_type: p.notification_type,
      channel: p.channel,
      enabled: p.enabled,
    }))

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'user_id,tenant_id,notification_type,channel' })

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'notifications.preferences.saved',
      entityType: 'notification_preferences',
      entityId: session.user.id,
      after: { count: rows.length },
    })

    revalidatePath('/portal/admin/notification-preferences')

    return { ok: true, count: rows.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
