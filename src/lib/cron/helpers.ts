// @anchor: platform.cron-helpers
// Shared utilities for all cron jobs.

import type { SupabaseClient } from '@supabase/supabase-js'

/** System actor used for cron-originated audit entries */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000'

interface ActiveTenant {
  id: string
  name: string
  slug: string
}

/**
 * Return all tenants whose status is 'active' or 'trial'.
 */
export async function getActiveTenants(supabase: SupabaseClient): Promise<ActiveTenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .in('status', ['active', 'trial'])

  if (error) {
    return []
  }

  return data ?? []
}

/**
 * Return user IDs of owners, admins, and directors for a given tenant.
 */
export async function getAdminUserIds(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_tenant_memberships')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .in('role', ['owner', 'admin', 'director'])
    .eq('status', 'active')

  if (error) {
    return []
  }

  return (data ?? []).map((row) => row.user_id)
}

interface DeduplicateOpts {
  tenantId: string
  userId: string
  template: string
  entityId?: string
  withinHours: number
}

/**
 * Check whether a notification was already sent recently.
 * Returns true if a matching notification exists within the time window.
 */
export async function deduplicateNotification(
  supabase: SupabaseClient,
  opts: DeduplicateOpts,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - opts.withinHours * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', opts.tenantId)
    .eq('user_id', opts.userId)
    .eq('template', opts.template)
    .gte('created_at', cutoff)

  if (opts.entityId) {
    query = query.eq('data->>entity_id', opts.entityId)
  }

  const { count, error } = await query

  if (error) {
    // On error, assume not sent — better to double-notify than miss one
    return false
  }

  return (count ?? 0) > 0
}
