import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant/resolve'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
}

const PORTAL_AUTH_BYPASS = new Set(['/portal/login', '/portal/login/callback'])

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  let response: NextResponse

  // Analytics collector is served from the PBW app but must be reachable
  // from tenant marketing domains. Skip tenant resolution + let the route
  // enforce its own CORS via site.origins.
  const isAnalyticsIngest = pathname === '/api/collect'

  if (
    hostname === 'preschool.businesses.win' ||
    hostname.startsWith('localhost:') ||
    hostname === 'localhost' ||
    isAnalyticsIngest
  ) {
    response = NextResponse.next()
  } else {
    const resolved = await resolveTenant(hostname)

    if (!resolved) {
      response = NextResponse.rewrite(new URL('/not-found', request.url))
    } else {
      const headers = new Headers(request.headers)
      headers.delete('x-tenant-id')
      headers.delete('x-tenant-slug')
      headers.delete('x-tenant-surface')
      headers.set('x-tenant-id', resolved.tenantId)
      headers.set('x-tenant-slug', resolved.tenantSlug)
      headers.set('x-tenant-surface', resolved.surface)
      response = NextResponse.next({ request: { headers } })
    }
  }

  if (pathname.startsWith('/portal') && !PORTAL_AUTH_BYPASS.has(pathname)) {
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
    if (!hasAuthCookie) {
      const loginUrl = new URL('/portal/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|dotwin-logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
