// @anchor: cca.camera.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Camera, Wifi, WifiOff } from 'lucide-react'

export default async function AdminCamerasPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: cameras } = await supabase
    .from('cameras')
    .select('id, name, location, hardware_type, thumbnail_url, status, recording_enabled, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const allCameras = cameras ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Camera Feeds
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Monitor live camera feeds across the facility.
        </p>
      </div>

      {allCameras.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <Camera
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No cameras configured yet.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Add cameras to start monitoring your facility.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Cameras', value: allCameras.length.toString() },
              { label: 'Online', value: allCameras.filter((c) => c.status === 'online').length.toString() },
              { label: 'Offline', value: allCameras.filter((c) => c.status === 'offline').length.toString() },
              { label: 'Recording', value: allCameras.filter((c) => c.recording_enabled).length.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Camera grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allCameras.map((cam) => (
              <div
                key={cam.id}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                {/* Thumbnail or placeholder */}
                <div
                  className="h-40 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  {cam.thumbnail_url ? (
                    <img
                      src={cam.thumbnail_url}
                      alt={cam.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={32} style={{ color: 'var(--color-muted-foreground)' }} />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      {cam.name}
                    </h3>
                    <span className="flex items-center gap-1">
                      {cam.status === 'online' ? (
                        <Wifi size={14} style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <WifiOff size={14} style={{ color: 'var(--color-destructive)' }} />
                      )}
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: cam.status === 'online' ? 'var(--color-primary)' : 'var(--color-destructive)',
                        }}
                      >
                        {cam.status}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {cam.location ?? 'No location set'}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {cam.hardware_type && <span>{cam.hardware_type}</span>}
                    <span>{cam.recording_enabled ? 'Recording' : 'Not recording'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
