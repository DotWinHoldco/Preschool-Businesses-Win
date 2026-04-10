// @anchor: cca.messaging.cron
// Cron: Send scheduled messages

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // TODO: Query message_schedules where scheduled_for <= now() and status = 'scheduled'
  // Send each message, update status to 'sent'
  console.log('[Cron] Scheduled messages')
  return NextResponse.json({ success: true })
}
