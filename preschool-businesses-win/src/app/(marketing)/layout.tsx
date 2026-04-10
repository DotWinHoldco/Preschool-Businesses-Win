// @anchor: marketing.layout
// Marketing surface layout — wraps tenant marketing pages with header and footer.
// Reads tenant branding from headers (injected by proxy.ts).
// See PLATFORM_ARCHITECTURE.md §5 and CCA_MARKETING_BRIEF.md §3.

import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/tenant/branding'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read tenant context from proxy-injected headers (Next.js 16: async headers)
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  // Fetch branding for header/footer — falls back to defaults if unavailable
  const branding = tenantId ? await getTenantBranding(tenantId) : null

  // Derive portal URL from the tenant's domain
  const host = headerStore.get('host') ?? ''
  const portalUrl = host ? `https://portal.${host.replace(/^www\./, '')}` : '/portal'

  // Determine plan to control "Powered by .win" badge visibility
  // Premium/enterprise tenants can hide it. Defaults to showing.
  const showPoweredBy = true // TODO: read from tenants.plan via tenant config

  return (
    <>
      <SiteHeader
        logoUrl={branding?.logo_url ?? null}
        schoolName={branding?.tagline ? branding.tagline.split(' — ')[0] : 'Preschool'}
        portalUrl={portalUrl}
      />
      {/* Spacer for sticky header */}
      <div className="h-16 md:h-20" />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter
        logoUrl={branding?.logo_url ?? null}
        schoolName={branding?.tagline ? branding.tagline.split(' — ')[0] : 'Preschool'}
        tagline={branding?.tagline ?? null}
        showPoweredBy={showPoweredBy}
      />
    </>
  )
}
