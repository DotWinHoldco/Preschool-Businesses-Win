// @anchor: cca.auth.impersonation
// Impersonation system for admin/owner support.
// Stores impersonation state in cookies. Writes to audit_log on start/end.
// Impersonation NEVER extends to payment actions.

import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const IMPERSONATION_COOKIE = 'pbw-impersonation'

export interface ImpersonationState {
  adminId: string
  targetUserId: string
  targetUserName: string
  targetUserRole: string
  justification: string
  startedAt: string
}

/**
 * Start impersonating a user. Requires admin role.
 * Writes an audit_log entry with the justification.
 */
export async function startImpersonation(
  adminId: string,
  targetUserId: string,
  justification: string
): Promise<{ success: boolean; error?: string }> {
  if (!justification || justification.trim().length < 5) {
    return { success: false, error: 'Justification must be at least 5 characters.' }
  }

  const headerStore = await headers()
  const tenantId =
    headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error('Missing tenant context')
  }

  const supabase = createAdminClient()

  // Fetch target user info for display
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', targetUserId)
    .single()

  const { data: membership } = await supabase
    .from('user_tenant_memberships')
    .select('role')
    .eq('user_id', targetUserId)
    .eq('tenant_id', tenantId)
    .single()

  const targetName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Unknown User'
  const targetRole = membership?.role ?? 'unknown'

  // Write audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: adminId,
    action: 'impersonation.start',
    entity_type: 'user',
    entity_id: targetUserId,
    after: {
      target_user_id: targetUserId,
      target_name: targetName,
      target_role: targetRole,
      justification: justification.trim(),
    },
  })

  // Store impersonation state in a cookie
  const state: ImpersonationState = {
    adminId,
    targetUserId,
    targetUserName: targetName,
    targetUserRole: targetRole,
    justification: justification.trim(),
    startedAt: new Date().toISOString(),
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour max
  })

  return { success: true }
}

/**
 * End impersonation. Clears the cookie and writes an audit_log entry.
 */
export async function endImpersonation(): Promise<void> {
  const state = await getImpersonationState()
  if (!state) return

  const headerStore = await headers()
  const tenantId =
    headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error('Missing tenant context')
  }

  const supabase = createAdminClient()

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: state.adminId,
    action: 'impersonation.end',
    entity_type: 'user',
    entity_id: state.targetUserId,
    after: {
      target_user_id: state.targetUserId,
      target_name: state.targetUserName,
      duration_ms:
        Date.now() - new Date(state.startedAt).getTime(),
    },
  })

  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATION_COOKIE)
}

/**
 * Read the current impersonation state from cookies, or null if not impersonating.
 */
export async function getImpersonationState(): Promise<ImpersonationState | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as ImpersonationState
  } catch {
    return null
  }
}
