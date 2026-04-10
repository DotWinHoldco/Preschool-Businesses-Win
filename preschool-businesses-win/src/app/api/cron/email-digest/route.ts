// @anchor: cca.notify.cron
// Cron: Daily email digest for parents who don't check the app

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: For parents with unread notifications/messages:
  // Compile daily digest email
  // Send via Resend
  console.log('[Cron] Email digest')
  return NextResponse.json({ success: true })
}
