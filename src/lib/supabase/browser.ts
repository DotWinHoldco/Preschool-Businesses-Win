import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Singleton browser Supabase client.
 * Auth state is managed automatically via cookies.
 */
export function getSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return client
}
