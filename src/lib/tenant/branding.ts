import { createAdminClient } from '@/lib/supabase/admin'

export interface TenantBranding {
  tenant_id: string
  // Colors
  color_primary: string
  color_primary_foreground: string
  color_secondary: string
  color_secondary_foreground: string
  color_accent: string
  color_accent_foreground: string
  color_background: string
  color_foreground: string
  color_muted: string
  color_muted_foreground: string
  color_card: string
  color_card_foreground: string
  color_border: string
  color_destructive: string
  color_destructive_foreground: string
  color_success: string
  color_warning: string
  // Typography
  font_heading: string
  font_body: string
  font_mono: string
  // Shape
  border_radius: string
  // Identity
  logo_url: string | null
  logo_icon_url: string | null
  favicon_url: string | null
  og_image_url: string | null
  // Meta
  tagline: string | null
}

// In-memory cache with 60s TTL
const cache = new Map<string, { data: TenantBranding; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

/**
 * Fetch tenant branding from the database, with 60s in-memory cache.
 */
export async function getTenantBranding(
  tenantId: string
): Promise<TenantBranding | null> {
  // Check cache
  const entry = cache.get(tenantId)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return null
  }

  const row = data as Record<string, unknown>
  const branding: TenantBranding = {
    ...(row as unknown as TenantBranding),
    logo_url: (row.logo_path ?? row.logo_url ?? null) as string | null,
    logo_icon_url: (row.logo_icon_path ?? row.logo_icon_url ?? null) as string | null,
    favicon_url: (row.favicon_path ?? row.favicon_url ?? null) as string | null,
    og_image_url: (row.og_image_url ?? null) as string | null,
  }
  cache.set(tenantId, { data: branding, expiresAt: Date.now() + CACHE_TTL_MS })
  return branding
}
