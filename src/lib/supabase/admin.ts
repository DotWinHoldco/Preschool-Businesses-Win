import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oajfxyiqjqymuvevnoui.supabase.co'

/**
 * Admin / service-role Supabase client.
 * Bypasses RLS — use only for migrations, seeding, platform-level operations.
 * NEVER expose to the browser.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey === 'PLACEHOLDER_ADD_AFTER_BUILD') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'Admin client requires the service role key to bypass RLS.'
    )
  }

  return createClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Admin client with tenant context set for RLS.
 * tenantId is required — no default fallback.
 */
export async function createTenantAdminClient(tenantId: string) {
  const client = createAdminClient()
  await client.rpc('set_tenant_context', { p_tenant_id: tenantId })
  return client
}
