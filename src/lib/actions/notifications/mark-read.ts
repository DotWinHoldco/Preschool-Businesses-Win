'use server'

// @anchor: cca.notifications.mark-read
// Server actions to mark notifications as read (single or all).

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Mark all unread notifications for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session) {
      return { ok: false, error: 'Authentication required' }
    }

    const tenantId = await getTenantId()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .eq('tenant_id', tenantId)
      .eq('read', false)

    if (error) {
      return { ok: false, error: error.message }
    }

    revalidatePath('/portal/admin/notifications')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session) {
      return { ok: false, error: 'Authentication required' }
    }

    const tenantId = await getTenantId()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    revalidatePath('/portal/admin/notifications')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
