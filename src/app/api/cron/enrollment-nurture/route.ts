// @anchor: cca.enrollment.nurture-cron
// Runs every 30 minutes. Walks abandoned enrollment_drafts and sends the
// 6h / 24h / 72h / 1w nurture email at the appropriate idle threshold.
// After the 1w mark the draft is promoted to an enrollment_lead with
// status='nurture' and the cadence stops.

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runEnrollmentNurture } from '@/lib/cron/enrollment-nurture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runEnrollmentNurture()
    return NextResponse.json({ success: true, ...summary })
  } catch (e) {
    console.error('[cron/enrollment-nurture]', e)
    return NextResponse.json({ error: 'enrollment_nurture_failed' }, { status: 500 })
  }
}
