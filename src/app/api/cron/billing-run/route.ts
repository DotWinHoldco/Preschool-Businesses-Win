// @anchor: cca.billing.cron
// Cron: Monthly billing run — generate invoices for active subscriptions
// Runs on the 1st of each month

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runBillingForAllTenants } from '@/lib/cron/billing-run'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    console.log('[Cron] Billing run started')

    const summary = await runBillingForAllTenants()

    console.log('[Cron] Billing run complete:', summary)
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    console.error('[Cron] Billing run error:', error)
    return NextResponse.json({ error: 'Billing run failed' }, { status: 500 })
  }
}
