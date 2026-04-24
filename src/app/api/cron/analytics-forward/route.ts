// @anchor: cca.analytics.cron
// Runs every minute. Forwards conversion events to Meta CAPI, GA4 MP, and
// TikTok Events API for any tenant with credentials configured on its
// analytics_sites row.

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runAnalyticsForward } from '@/lib/cron/analytics-forward'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runAnalyticsForward()
    return NextResponse.json({ success: true, ...summary })
  } catch {
    return NextResponse.json({ error: 'analytics_forward_failed' }, { status: 500 })
  }
}
