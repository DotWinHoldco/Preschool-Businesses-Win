// @anchor: cca.attendance.cron
// Nightly cron: finalize attendance records for the day
// Runs at 11 PM daily via Vercel Cron

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runAttendanceFinalizeForAllTenants } from '@/lib/cron/attendance-finalize'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    console.log('[Cron] Attendance finalization started')
    const summary = await runAttendanceFinalizeForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Attendance finalized',
      ...summary,
    })
  } catch (error) {
    console.error('[Cron] Attendance finalization error:', error)
    return NextResponse.json({ error: 'Finalization failed' }, { status: 500 })
  }
}
