// @anchor: cca.camera.interface
// Hardware abstraction for IP camera feeds
// Default: ONVIF-compliant camera adapter
// See CCA_BUILD_BRIEF.md §14

export interface MotionEvent {
  id: string
  camera_id: string
  started_at: string
  ended_at: string | null
  confidence: number
  thumbnail_path: string | null
}

export interface CameraFeed {
  getStreamUrl(cameraId: string): Promise<string>
  getSnapshot(cameraId: string): Promise<Buffer | null>
  getMotionEvents(cameraId: string, from: Date, to: Date): Promise<MotionEvent[]>
  bookmark(cameraId: string, timestamp: Date, label: string): Promise<void>
}

// ---------------------------------------------------------------------------
// ONVIF adapter — default implementation for ONVIF-compliant IP cameras
// ---------------------------------------------------------------------------

class OnvifCameraAdapter implements CameraFeed {
  async getStreamUrl(cameraId: string): Promise<string> {
    // In production, this would:
    // 1. Look up camera config from cameras table
    // 2. Use ONVIF discovery or stored RTSP URL
    // 3. Transcode to HLS if needed (via the camera system's NVR or a transcoder)
    // 4. Return a signed HLS URL for browser playback
    // Stub: return a placeholder HLS URL
    return `/api/cameras/${cameraId}/stream.m3u8`
  }

  async getSnapshot(_cameraId: string): Promise<Buffer | null> {
    // In production: ONVIF GetSnapshotUri or RTSP frame grab
    return null
  }

  async getMotionEvents(_cameraId: string, _from: Date, _to: Date): Promise<MotionEvent[]> {
    // Stub: no events
    return []
  }

  async bookmark(_cameraId: string, _timestamp: Date, _label: string): Promise<void> {
    // In production: insert into camera_bookmarks table
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let adapterInstance: CameraFeed | null = null

export function createCameraFeed(): CameraFeed {
  if (!adapterInstance) {
    adapterInstance = new OnvifCameraAdapter()
  }
  return adapterInstance
}
