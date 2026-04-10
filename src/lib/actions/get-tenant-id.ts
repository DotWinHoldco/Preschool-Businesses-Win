// @anchor: cca.actions.tenant-helper
// Helper to get the current tenant ID and actor ID from request context.

import { headers } from 'next/headers'
import { getSession } from '@/lib/auth/session'

export async function getTenantId(): Promise<string> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error('Missing tenant context (x-tenant-id header not set)')
  }
  return tenantId
}

export async function getActorId(): Promise<string> {
  const session = await getSession()
  if (!session) {
    throw new Error('No authenticated session — cannot determine actor')
  }
  return session.user.id
}
