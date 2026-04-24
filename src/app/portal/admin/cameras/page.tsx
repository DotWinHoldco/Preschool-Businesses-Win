// @anchor: cca.camera.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CameraAdminPanel, type Cam } from '@/components/portal/cameras/camera-admin-panel'
import { Activity } from 'lucide-react'

export default async function AdminCamerasPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [camsRes, eventsRes] = await Promise.all([
    supabase
      .from('cameras')
      .select(
        'id, name, location, hardware_type, stream_url, thumbnail_url, status, recording_enabled, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('camera_motion_events')
      .select('id, camera_id, detected_at, event_type, acknowledged_at')
      .eq('tenant_id', tenantId)
      .gte('detected_at', since)
      .order('detected_at', { ascending: false })
      .limit(25),
  ])

  const cameras: Cam[] = (camsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    hardware_type: c.hardware_type,
    stream_url: c.stream_url,
    thumbnail_url: c.thumbnail_url,
    status: c.status,
    recording_enabled: c.recording_enabled,
  }))

  const events = eventsRes.data ?? []
  const camMap = new Map(cameras.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Camera Feeds
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage camera metadata. Live stream playback is separate hardware integration.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: cameras.length },
          { label: 'Recording', value: cameras.filter((c) => c.recording_enabled).length },
          { label: 'Online', value: cameras.filter((c) => c.status === 'online').length },
          { label: 'Motion events (24h)', value: events.length },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <CameraAdminPanel cameras={cameras} />

      {/* Recent motion events */}
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
          Recent motion events (last 24h)
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          {events.length === 0 ? (
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <Activity size={14} />
              No motion events in the last 24 hours.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between text-sm rounded-md px-3 py-2"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <span style={{ color: 'var(--color-foreground)' }}>
                    {camMap.get(e.camera_id) ?? 'Unknown camera'} ·{' '}
                    <span style={{ color: 'var(--color-muted-foreground)' }}>
                      {e.event_type ?? 'motion'}
                    </span>
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(e.detected_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
