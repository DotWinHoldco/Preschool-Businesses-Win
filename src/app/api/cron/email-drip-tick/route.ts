// @anchor: cca.crm.email-drip-cron
// Every minute: advance any drip runs whose next_send_at is in the past.

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { tickDripCampaigns } from '@/lib/crm/campaign-send'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError
  const url = new URL(request.url)
  const collectorBase = `${url.protocol}//${url.host}`
  try {
    const summary = await tickDripCampaigns(collectorBase)
    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    console.error('[cron/email-drip-tick]', e)
    return NextResponse.json({ ok: false, error: 'tick_failed' }, { status: 500 })
  }
}
