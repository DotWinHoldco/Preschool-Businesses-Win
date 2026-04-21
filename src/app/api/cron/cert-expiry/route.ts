// @anchor: cca.staff.cron
// Cron: Check staff certifications nearing expiry
// Runs daily, alerts at 60/30/7 days before expiry

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runCertExpiryCheckForAllTenants } from '@/lib/cron/cert-expiry'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    console.log('[Cron] Certification expiry check started')
    const summary = await runCertExpiryCheckForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Cert expiry check complete',
      ...summary,
    })
  } catch (error) {
    console.error('[Cron] Cert expiry check error:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
