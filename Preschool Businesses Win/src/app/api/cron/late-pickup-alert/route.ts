// @anchor: cca.checkin.cron
// Cron: Alert for late pickups (15 min after closing)

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Check for students still checked in after closing time
  // Send SMS + push to parent and admin
  console.log('[Cron] Late pickup check')
  return NextResponse.json({ success: true })
}
