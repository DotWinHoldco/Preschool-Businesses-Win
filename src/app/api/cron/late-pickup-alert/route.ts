// @anchor: cca.checkin.cron
// Cron: Alert for late pickups (15 min after closing)

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // TODO: Check for students still checked in after closing time
  // Send SMS + push to parent and admin
  console.log('[Cron] Late pickup check')
  return NextResponse.json({ success: true })
}
