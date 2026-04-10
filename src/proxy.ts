import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant/resolve'

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Platform domain — no tenant injection
  if (hostname === 'preschool.businesses.win' || hostname === 'localhost:3000') {
    return NextResponse.next()
  }

  // Resolve tenant from hostname (DB lookup with 60s cache)
  const resolved = await resolveTenant(hostname)

  if (!resolved) {
    // Unknown domain — rewrite to 404
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Set headers for downstream consumption
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', resolved.tenantId)
  headers.set('x-tenant-slug', resolved.tenantSlug)
  headers.set('x-tenant-surface', resolved.surface)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|dotwin-logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
