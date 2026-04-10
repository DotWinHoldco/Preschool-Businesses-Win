// @anchor: cca.notify.cron
// Cron: Daily email digest for parents who don't check the app

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // TODO: For parents with unread notifications/messages:
  // Compile daily digest email
  // Send via Resend
  console.log('[Cron] Email digest')
  return NextResponse.json({ success: true })
}
