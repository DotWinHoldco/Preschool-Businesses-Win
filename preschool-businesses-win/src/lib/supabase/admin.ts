import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oajfxyiqjqymuvevnoui.supabase.co'

/**
 * Admin / service-role Supabase client.
 * Bypasses RLS — use only for migrations, seeding, platform-level operations.
 * NEVER expose to the browser.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Fall back to anon key if service role key is not configured yet
  const key = serviceKey && serviceKey !== 'PLACEHOLDER_ADD_AFTER_BUILD'
    ? serviceKey
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Admin client with tenant context set for RLS.
 * Use this when querying tenant-scoped tables with the anon key fallback.
 */
export async function createTenantAdminClient(tenantId: string = 'a0a0a0a0-cca0-4000-8000-000000000001') {
  const client = createAdminClient()
  await client.rpc('set_tenant_context', { p_tenant_id: tenantId })
  return client
}
