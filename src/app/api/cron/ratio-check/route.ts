// @anchor: cca.dfps.cron
// Cron: Check classroom ratios every 15 minutes during operating hours
// Alerts admin immediately on violation

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runRatioCheckForAllTenants } from '@/lib/cron/ratio-check'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runRatioCheckForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Ratio check complete',
      ...summary,
    })
  } catch {
    return NextResponse.json({ error: 'Ratio check failed' }, { status: 500 })
  }
}
