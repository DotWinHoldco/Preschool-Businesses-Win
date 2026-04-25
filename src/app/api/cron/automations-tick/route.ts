// @anchor: cca.crm.automations-cron
// Every minute: process pending crm_events, fan out to matching
// automations, and execute their action steps.

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { processPendingEvents } from '@/lib/crm/automations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError
  const url = new URL(request.url)
  const collectorBase = `${url.protocol}//${url.host}`
  try {
    const summary = await processPendingEvents(collectorBase)
    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    console.error('[cron/automations-tick]', e)
    return NextResponse.json({ ok: false, error: 'tick_failed' }, { status: 500 })
  }
}
