import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './rate-limit'

export function rateLimitGuard(request: NextRequest, limit = 10): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'

  const result = rateLimit(ip, limit)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }
  return null
}
