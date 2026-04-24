// @anchor: cca.messaging.cron
// Cron: Send scheduled messages

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runScheduledMessagesForAllTenants } from '@/lib/cron/scheduled-messages'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runScheduledMessagesForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Scheduled messages processed',
      ...summary,
    })
  } catch {
    return NextResponse.json({ error: 'Scheduled messages failed' }, { status: 500 })
  }
}
