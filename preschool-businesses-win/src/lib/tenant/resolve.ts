import { PLATFORM_DOMAIN } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'

export type Surface = 'marketing' | 'portal'

export interface ResolvedTenant {
  tenantId: string
  tenantSlug: string
  surface: Surface
}

// In-memory cache with 60s TTL
const cache = new Map<string, { data: ResolvedTenant | null; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

function getCached(key: string): ResolvedTenant | null | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.data
}

function setCache(key: string, data: ResolvedTenant | null) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

/**
 * Resolves a tenant from a hostname.
 * Returns null for the platform surface (no tenant).
 */
export async function resolveTenant(hostname: string): Promise<ResolvedTenant | null> {
  // Strip port for local dev
  const host = hostname.replace(/:\d+$/, '')

  // Platform domain — no tenant
  if (host === PLATFORM_DOMAIN || host === 'localhost') {
    return null
  }

  // Check cache
  const cached = getCached(host)
  if (cached !== undefined) return cached

  // Determine surface from hostname
  const isPortal = host.startsWith('portal.')
  const surface: Surface = isPortal ? 'portal' : 'marketing'

  // Try subdomain pattern: {slug}.preschool.businesses.win or portal.{slug}.preschool.businesses.win
  const subdomainMatch = host.match(
    /^(?:portal\.)?([^.]+)\.preschool\.businesses\.win$/
  )

  if (subdomainMatch) {
    const slug = subdomainMatch[1]
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      setCache(host, null)
      return null
    }

    const result: ResolvedTenant = {
      tenantId: data.id,
      tenantSlug: data.slug,
      surface,
    }
    setCache(host, result)
    return result
  }

  // Custom domain lookup — strip portal. prefix if present
  const lookupDomain = isPortal ? host.replace(/^portal\./, '') : host
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('tenant_custom_domains')
    .select('tenant_id, tenants!inner(id, slug)')
    .eq('domain', lookupDomain)
    .eq('verified', true)
    .single()

  if (error || !data) {
    setCache(host, null)
    return null
  }

  const tenant = data.tenants as unknown as { id: string; slug: string }
  const result: ResolvedTenant = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    surface,
  }
  setCache(host, result)
  return result
}
