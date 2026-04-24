import { createAdminClient } from '@/lib/supabase/admin'

export interface AnalyticsSite {
  id: string
  tenant_id: string
  site_key: string
  name: string
  origins: string[]
  is_active: boolean
}

const cache = new Map<string, { data: AnalyticsSite | null; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

export async function lookupSite(site_key: string): Promise<AnalyticsSite | null> {
  const now = Date.now()
  const entry = cache.get(site_key)
  if (entry && entry.expiresAt > now) return entry.data

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('analytics_sites')
    .select('id, tenant_id, site_key, name, origins, is_active')
    .eq('site_key', site_key)
    .eq('is_active', true)
    .maybeSingle()

  const result: AnalyticsSite | null = !error && data ? (data as AnalyticsSite) : null
  cache.set(site_key, { data: result, expiresAt: now + CACHE_TTL_MS })
  return result
}

export function originAllowed(site: AnalyticsSite, origin: string | null): boolean {
  if (!origin) return false
  return site.origins.includes(origin)
}
