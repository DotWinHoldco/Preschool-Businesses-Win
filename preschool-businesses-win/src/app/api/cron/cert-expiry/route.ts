// @anchor: cca.staff.cron
// Cron: Check staff certifications nearing expiry
// Runs daily, alerts at 60/30/7 days before expiry

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: For each active tenant:
    // 1. Query staff_certifications where expiry_date is within 60 days
    // 2. Group by urgency: 60-day warning, 30-day warning, 7-day critical
    // 3. Send notifications to admin + staff member
    // 4. Flag expired certs

    console.log('[Cron] Certification expiry check started')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cron] Cert expiry check error:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
