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
