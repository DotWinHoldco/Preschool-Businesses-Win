import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * Tenant-aware server Supabase client.
 * Reads x-tenant-id header (set by proxy or layout) and calls
 * set_tenant_context RPC so RLS policies scope to the tenant.
 */
export async function createTenantServerClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const client = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // setAll can fail in Server Components (read-only).
          // This is safe to ignore when called from a Server Component.
        }
      },
    },
  })

  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error(
      'createTenantServerClient() called without tenant context. ' +
        'The x-tenant-id header is not set. Use createServerClientWithoutTenant() for platform-level operations.',
    )
  }
  await client.rpc('set_tenant_context', { p_tenant_id: tenantId })

  return client
}

/**
 * Platform-level server client — no tenant scoping.
 * Use for platform admin pages, onboarding, tenant creation, etc.
 */
export async function createServerClientWithoutTenant() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Safe to ignore in Server Components
        }
      },
    },
  })
}
