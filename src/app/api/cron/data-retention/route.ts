// @anchor: cca.compliance.cron-route
// Cron: Auto-anonymize families past their retention period.
// Runs daily. Protected by CRON_SECRET.

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runDataRetentionForAllTenants } from '@/lib/cron/data-retention'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runDataRetentionForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Data retention check complete',
      ...summary,
    })
  } catch {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
