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
    console.log(`[camera] GET_STREAM camera=${cameraId}`)

    // Stub: return a placeholder HLS URL
    return `/api/cameras/${cameraId}/stream.m3u8`
  }

  async getSnapshot(cameraId: string): Promise<Buffer | null> {
    // In production: ONVIF GetSnapshotUri or RTSP frame grab
    console.log(`[camera] SNAPSHOT camera=${cameraId}`)
    return null
  }

  async getMotionEvents(cameraId: string, from: Date, to: Date): Promise<MotionEvent[]> {
    console.log(`[camera] MOTION_EVENTS camera=${cameraId} from=${from.toISOString()} to=${to.toISOString()}`)
    // Stub: no events
    return []
  }

  async bookmark(cameraId: string, timestamp: Date, label: string): Promise<void> {
    console.log(`[camera] BOOKMARK camera=${cameraId} at=${timestamp.toISOString()} label=${label}`)
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
