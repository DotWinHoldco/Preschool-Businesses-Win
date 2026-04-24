// @anchor: cca.door.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  AccessPointsAdmin,
  type AccessPoint,
  type AccessEvent,
} from '@/components/portal/hardware/access-points-admin'

export default async function AdminDoorsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [apsRes, evtsRes] = await Promise.all([
    supabase
      .from('access_points')
      .select(
        'id, name, location, door_type, lock_type, hardware_id, current_status, battery_pct, last_event_at, is_active',
      )
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase
      .from('access_point_events')
      .select('id, access_point_id, event_type, success, actor_label, denied_reason, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const accessPoints: AccessPoint[] = (apsRes.data ?? []) as AccessPoint[]
  const allEvents = (evtsRes.data ?? []) as (AccessEvent & { access_point_id: string })[]
  const eventsByDoor: Record<string, AccessEvent[]> = {}
  for (const e of allEvents) {
    const { access_point_id, ...rest } = e
    if (!eventsByDoor[access_point_id]) eventsByDoor[access_point_id] = []
    if (eventsByDoor[access_point_id].length < 50) eventsByDoor[access_point_id].push(rest)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Door Control
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage access points. Hardware integration is a separate layer — entries here are the
          source of truth for metadata and manual overrides.
        </p>
      </div>

      <AccessPointsAdmin accessPoints={accessPoints} eventsByDoor={eventsByDoor} />
    </div>
  )
}
