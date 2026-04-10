// @anchor: cca.actions.tenant-helper
// Helper to get the current tenant ID from headers.
// Falls back to the CCA tenant ID during development.
// Replace with real session-based tenant resolution in Phase 1.

import { headers } from 'next/headers'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export async function getTenantId(): Promise<string> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  return tenantId || CCA_TENANT_ID
}

export async function getActorId(): Promise<string> {
  // TODO (Phase 1): Read from real auth session
  return '00000000-0000-0000-0000-000000000000'
}
