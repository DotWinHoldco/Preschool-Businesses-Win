// @anchor: cca.notify.push
// Web Push subscription endpoint

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    // TODO: Store push subscription in database
    // Link to user_id and tenant_id
    // Update notification_preferences

    console.log('[Push] New subscription registered')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push] Subscribe error:', error)
    return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 })
  }
}
