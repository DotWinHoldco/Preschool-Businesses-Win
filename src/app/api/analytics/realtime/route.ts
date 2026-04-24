// @anchor: cca.analytics.realtime
// Returns the count of unique visitors with an event in the last 5 minutes
// for the current tenant. Used by the live counter on the traffic dashboard.

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('analytics_events')
    .select('visitor_id')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  const visitors = new Set((data ?? []).map((r) => r.visitor_id as string))

  return NextResponse.json(
    { active_visitors: visitors.size },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
