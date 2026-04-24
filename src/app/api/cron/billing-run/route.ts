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
    const summary = await runBillingForAllTenants()

    return NextResponse.json({ success: true, ...summary })
  } catch {
    return NextResponse.json({ error: 'Billing run failed' }, { status: 500 })
  }
}
