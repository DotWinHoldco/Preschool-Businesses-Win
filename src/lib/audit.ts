// @anchor: platform.audit
// Shared audit log helper for server actions.
// Every state-changing action must call writeAudit() after its primary mutation.

import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export interface AuditEntry {
  tenantId: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

/**
 * Write an entry to the audit_log table.
 * Swallows errors to avoid failing the parent action — audit is best-effort.
 */
export async function writeAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      tenant_id: entry.tenantId,
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      before_data: entry.before ?? null,
      after_data: entry.after ?? null,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { subsystem: 'audit' } })
  }
}
