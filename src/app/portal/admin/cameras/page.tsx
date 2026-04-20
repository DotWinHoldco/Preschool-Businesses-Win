// @anchor: cca.camera.admin-page

import { CamerasClient } from '@/components/portal/cameras/cameras-client'

export default function AdminCamerasPage() {
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
      <CamerasClient />
    </div>
  )
}
