// @anchor: cca.analytics.realtime
// Returns the count of visitors currently on the site. A visitor is "active"
// if they had a non-terminal event in the last 90s AND have not fired a
// session_end event since their most recent activity. This is tight enough
// to feel live but lenient enough to cover idle read time on a page.

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ACTIVE_WINDOW_MS = 90 * 1000

export async function GET() {
  try {
    await assertRole('director')
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) {
    return NextResponse.json({ error: 'missing_tenant' }, { status: 400 })
  }

  const supabase = await createTenantAdminClient(tenantId)
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString()

  // Pull recent events so we can compute: for each visitor, the time of
  // their latest event AND whether that latest event was session_end.
  const { data, error } = await supabase
    .from('analytics_events')
    .select('visitor_id, event_type, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  // For each visitor, take their latest event in the window. If that event is
  // session_end, they've left — don't count them.
  const latestByVisitor = new Map<string, string>()
  for (const r of data ?? []) {
    const vid = r.visitor_id as string
    if (!latestByVisitor.has(vid)) {
      latestByVisitor.set(vid, r.event_type as string)
    }
  }

  let active = 0
  for (const eventType of latestByVisitor.values()) {
    if (eventType !== 'session_end') active += 1
  }

  return NextResponse.json(
    { active_visitors: active },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
