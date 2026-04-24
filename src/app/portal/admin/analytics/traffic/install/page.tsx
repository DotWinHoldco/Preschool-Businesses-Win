// @anchor: cca.analytics.traffic-install-page
// Install + integrations tab. Shows the pastable Wix snippet with this
// tenant's site_key pre-filled and CAPI credential form for Meta/GA4/TikTok.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { TrafficTabs } from '@/components/portal/analytics/traffic-tabs'
import { InstallForm } from './install-form'

export default async function TrafficInstallPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  // Derive the collector base URL from the current request so the snippet
  // points at a domain that is actually reachable today — even when the
  // canonical platform domain (preschool.businesses.win) is not yet hooked
  // up for a tenant. Admin is already at this host, so it's guaranteed live.
  const host =
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'preschool.businesses.win'
  const proto = headerStore.get('x-forwarded-proto') ?? 'https'
  const collectorBase = `${proto}://${host}`

  const { data: site } = await supabase
    .from('analytics_sites')
    .select(
      'id, tenant_id, site_key, name, origins, is_active, consent_banner_enabled, meta_pixel_id, meta_capi_token, meta_test_event_code, ga4_measurement_id, ga4_api_secret, tiktok_pixel_id, tiktok_access_token',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Website Traffic</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Install the tracking snippet on your marketing site and connect CAPI pixels.
        </p>
      </div>

      <TrafficTabs active="install" />

      {!site ? (
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              No analytics site configured
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              An admin needs to seed a row into <code>analytics_sites</code> for this tenant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <InstallForm
          collectorBase={collectorBase}
          site={{
            id: site.id as string,
            name: site.name as string,
            site_key: site.site_key as string,
            origins: (site.origins as string[]) ?? [],
            is_active: (site.is_active as boolean) ?? true,
            consent_banner_enabled: (site.consent_banner_enabled as boolean) ?? true,
            meta_pixel_id: (site.meta_pixel_id as string | null) ?? null,
            meta_capi_token: (site.meta_capi_token as string | null) ?? null,
            meta_test_event_code: (site.meta_test_event_code as string | null) ?? null,
            ga4_measurement_id: (site.ga4_measurement_id as string | null) ?? null,
            ga4_api_secret: (site.ga4_api_secret as string | null) ?? null,
            tiktok_pixel_id: (site.tiktok_pixel_id as string | null) ?? null,
            tiktok_access_token: (site.tiktok_access_token as string | null) ?? null,
          }}
        />
      )}
    </div>
  )
}
