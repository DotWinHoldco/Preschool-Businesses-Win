// @anchor: cca.messaging.cron
// Cron: Send scheduled messages

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Query message_schedules where scheduled_for <= now() and status = 'scheduled'
  // Send each message, update status to 'sent'
  console.log('[Cron] Scheduled messages')
  return NextResponse.json({ success: true })
}
