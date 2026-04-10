// @anchor: cca.billing.cron
// Cron: Monthly billing run — generate invoices for active subscriptions
// Runs on the 1st of each month

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: For each active tenant with billing enabled:
    // 1. Get all family_billing_enrollments with status = 'active'
    // 2. Calculate billing period
    // 3. Apply discounts (sibling, staff, military, church)
    // 4. Handle split billing (custody billing_split_pct)
    // 5. Generate invoice with line items
    // 6. Create Stripe invoice
    // 7. Send notification to family
    // 8. Check for overdue invoices → apply late fees after grace period

    console.log('[Cron] Billing run started')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cron] Billing run error:', error)
    return NextResponse.json({ error: 'Billing run failed' }, { status: 500 })
  }
}
