// @anchor: cca.door.controller
// Hardware abstraction for smart door locks
// Default: HTTP adapter for generic smart lock APIs (August, Yale, Kisi, Brivo)
// See CCA_BUILD_BRIEF.md §14

export interface DoorControlResult {
  success: boolean
  error?: string
}

export type DoorStatus = 'locked' | 'unlocked' | 'error' | 'offline'

export interface DoorController {
  unlock(doorId: string, userId: string, reason: string): Promise<DoorControlResult>
  lock(doorId: string, userId: string): Promise<DoorControlResult>
  getStatus(doorId: string): Promise<DoorStatus>
  onStatusChange(doorId: string, callback: (status: DoorStatus) => void): () => void
}

// ---------------------------------------------------------------------------
// HTTP adapter — default implementation for REST-based smart lock APIs
// ---------------------------------------------------------------------------

class HttpDoorController implements DoorController {
  async unlock(_doorId: string, _userId: string, _reason: string): Promise<DoorControlResult> {
    // In production, this would:
    // 1. Look up the door's API endpoint and auth from door_locks table
    // 2. Make an HTTP POST to the lock's API
    // 3. Verify the response indicates success
    // 4. Set an auto-lock timer (default 10 seconds)
    // Stub: always succeeds in development
    return { success: true }
  }

  async lock(_doorId: string, _userId: string): Promise<DoorControlResult> {
    return { success: true }
  }

  async getStatus(_doorId: string): Promise<DoorStatus> {
    // Stub: report as locked
    return 'locked'
  }

  onStatusChange(_doorId: string, _callback: (status: DoorStatus) => void): () => void {
    // Stub: no-op subscription, returns unsubscribe function
    return () => {}
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let controllerInstance: DoorController | null = null

export function createDoorController(): DoorController {
  if (!controllerInstance) {
    controllerInstance = new HttpDoorController()
  }
  return controllerInstance
}

/**
 * Lock all doors for a tenant. Used during emergency lockdown.
 * In production, this would iterate over all door_locks for the tenant.
 */
export async function lockAllDoors(_tenantId: string): Promise<DoorControlResult> {
  // Stub: in production, query door_locks table and lock each one
  return { success: true }
}
