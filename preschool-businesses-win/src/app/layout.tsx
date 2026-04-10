// @anchor: platform.root-layout
// Root layout — loads fonts, injects tenant theme, sets metadata.
// Every surface (marketing, portal, platform) is a child of this layout.
// See PLATFORM_ARCHITECTURE.md §5 for the layout hierarchy.

import type { Metadata } from 'next'
import { Nunito, Open_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/tenant/branding'
import { TenantThemeProvider } from '@/lib/theme/inject-tenant-theme'
import { TenantProvider } from '@/lib/tenant/context'
import { SkipToContent } from '@/components/layout/skip-to-content'
import type { Surface } from '@/lib/tenant/resolve'
import './globals.css'

/* ------------------------------------------------------------------ */
/* Fonts — Nunito for headings, Open Sans for body (BRAND.md §3)       */
/* ------------------------------------------------------------------ */
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

/* ------------------------------------------------------------------ */
/* Default metadata (overridden per-tenant when branding is available)  */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title: {
    template: '%s | Preschool Businesses Win',
    default: 'Preschool Businesses Win',
  },
  description:
    'The best preschool management platform. Phone-first. Apple-grade polish. Multi-tenant.',
}

/* ------------------------------------------------------------------ */
/* Root layout                                                         */
/* ------------------------------------------------------------------ */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read tenant context injected by proxy.ts (Next.js 16: headers() is async)
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const tenantSlug = headerStore.get('x-tenant-slug') ?? ''
  const surface = (headerStore.get('x-tenant-surface') as Surface) ?? 'marketing'

  // Fetch tenant branding if we have a tenant context
  const branding = tenantId ? await getTenantBranding(tenantId) : null

  // Build tenant context value for client components
  const tenantContextValue = tenantId
    ? { tenantId, tenantSlug, surface }
    : null

  return (
    <html
      lang="en"
      className={`${nunito.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SkipToContent />
        <TenantThemeProvider branding={branding}>
          {tenantContextValue ? (
            <TenantProvider value={tenantContextValue}>
              {children}
            </TenantProvider>
          ) : (
            children
          )}
        </TenantThemeProvider>
      </body>
    </html>
  )
}
