// @anchor: cca.attendance.cron
// Nightly cron: finalize attendance records for the day
// Runs at 11 PM daily via Vercel Cron

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: For each tenant with active status:
    // 1. Get all attendance_records for today that aren't finalized
    // 2. Calculate hours_present from check_in and check_out times
    // 3. Mark absent for students who never checked in
    // 4. Set finalized_at = now()
    // 5. Write to audit_log

    console.log('[Cron] Attendance finalization started')

    return NextResponse.json({ success: true, message: 'Attendance finalized' })
  } catch (error) {
    console.error('[Cron] Attendance finalization error:', error)
    return NextResponse.json({ error: 'Finalization failed' }, { status: 500 })
  }
}
