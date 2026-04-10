// @anchor: platform.cron-auth
// Shared authentication for Vercel Cron routes.
// Validates the Authorization header against CRON_SECRET.

import { NextResponse } from 'next/server'

/**
 * Verify that a cron request is authorized.
 * Returns null if authorized, or a NextResponse error if not.
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null
}
