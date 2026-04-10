import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Platform domain — no tenant injection
  if (hostname === 'preschool.businesses.win' || hostname === 'localhost:3000') {
    return NextResponse.next()
  }

  // Determine tenant from hostname
  const isPortal = hostname.startsWith('portal.')
  const surface = isPortal ? 'portal' : 'marketing'

  // Extract slug from subdomain pattern or use full domain
  let tenantSlug = ''
  const subdomainMatch = hostname.match(
    /^(?:portal\.)?([^.]+)\.preschool\.businesses\.win$/
  )
  if (subdomainMatch) {
    tenantSlug = subdomainMatch[1]
  }

  // Set headers for downstream consumption
  const headers = new Headers(request.headers)
  headers.set('x-tenant-slug', tenantSlug || hostname.replace('portal.', ''))
  headers.set('x-tenant-surface', surface)
  // Tenant ID resolution happens in server components via resolve.ts

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|dotwin-logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
