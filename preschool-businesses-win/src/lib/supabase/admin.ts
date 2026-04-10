import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oajfxyiqjqymuvevnoui.supabase.co'

/**
 * Admin / service-role Supabase client.
 * Bypasses RLS — use only for migrations, seeding, platform-level operations.
 * NEVER expose to the browser.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
