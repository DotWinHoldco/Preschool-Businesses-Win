// @anchor: cca.camera.grid
// Multi-camera grid view

import { CameraFeedViewer } from './camera-feed-viewer'

interface CameraInfo { id: string; name: string; location: string; stream_url: string; status: 'online' | 'offline' | 'error' }
interface CameraGridProps { cameras: CameraInfo[]; onBookmark?: (cameraId: string, label: string) => void }

export function CameraGrid({ cameras, onBookmark }: CameraGridProps) {
  if (cameras.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No cameras configured. Add cameras in Settings.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cameras.map((cam) => (
        <CameraFeedViewer key={cam.id} cameraId={cam.id} cameraName={cam.name} streamUrl={cam.stream_url} status={cam.status} onBookmark={onBookmark ? (label) => onBookmark(cam.id, label) : undefined} />
      ))}
    </div>
  )
}
