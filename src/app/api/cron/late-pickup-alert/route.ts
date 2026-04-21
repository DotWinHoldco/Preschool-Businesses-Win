// @anchor: cca.checkin.cron
// Cron: Alert for late pickups (15 min after closing)

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runLatePickupAlertForAllTenants } from '@/lib/cron/late-pickup-alert'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    console.log('[Cron] Late pickup check started')
    const summary = await runLatePickupAlertForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Late pickup check complete',
      ...summary,
    })
  } catch (error) {
    console.error('[Cron] Late pickup check error:', error)
    return NextResponse.json({ error: 'Late pickup check failed' }, { status: 500 })
  }
}
