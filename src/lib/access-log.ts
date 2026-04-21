// @anchor: platform.access-log
// FERPA access logging helper for server actions and pages.
// Logs who viewed, searched, exported, or downloaded student data.

import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export interface AccessLogEntry {
  tenantId: string
  actorId: string
  entityType: string
  entityId: string
  accessType: 'view' | 'search' | 'export' | 'download'
  endpoint: string
}

/**
 * Write an entry to the access_log table.
 * Swallows errors to avoid failing the parent action — access logging is best-effort.
 */
export async function writeAccessLog(
  supabase: SupabaseClient,
  entry: AccessLogEntry,
): Promise<void> {
  try {
    await supabase.from('access_log').insert({
      tenant_id: entry.tenantId,
      actor_id: entry.actorId,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      access_type: entry.accessType,
      endpoint: entry.endpoint,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { subsystem: 'access_log' } })
  }
}
