// @anchor: cca.notify.push
// Web Push subscription endpoint

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitGuard } from '@/lib/rate-limit-guard'

export async function POST(request: NextRequest) {
  const blocked = rateLimitGuard(request, 10)
  if (blocked) return blocked

  try {
    const _subscription = await request.json()

    // TODO: Store push subscription in database
    // Link to user_id and tenant_id
    // Update notification_preferences

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push] Subscribe error:', error)
    return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 })
  }
}
