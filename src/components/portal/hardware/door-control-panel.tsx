'use client'

// @anchor: cca.door.control-panel
// Door unlock/lock controls for admin
// See CCA_BUILD_BRIEF.md §14

import { useState } from 'react'
import { DoorOpen, Lock, Unlock, Wifi, WifiOff } from 'lucide-react'

interface Door { id: string; name: string; location: string; status: 'locked' | 'unlocked' | 'error' | 'offline'; lastHeartbeat: string | null }
interface DoorControlPanelProps { doors: Door[]; onUnlock: (doorId: string, reason: string) => Promise<void>; onLock: (doorId: string) => Promise<void> }

export function DoorControlPanel({ doors, onUnlock, onLock }: DoorControlPanelProps) {
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const handleUnlock = async (doorId: string) => {
    if (!reason.trim()) return
    setUnlockingId(doorId)
    try { await onUnlock(doorId, reason); setReason('') } finally { setUnlockingId(null) }
  }

  const statusConfig = {
    locked: { icon: Lock, color: 'var(--color-success, #10B981)', label: 'Locked' },
    unlocked: { icon: Unlock, color: 'var(--color-warning)', label: 'Unlocked' },
    error: { icon: DoorOpen, color: 'var(--color-destructive)', label: 'Error' },
    offline: { icon: WifiOff, color: 'var(--color-muted-foreground)', label: 'Offline' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for unlock (required)" className="flex-1 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {doors.map((door) => {
          const config = statusConfig[door.status]
          const Icon = config.icon
          return (
            <div key={door.id} className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{door.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{door.location}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: config.color + '20', color: config.color }}>
                  <Icon size={14} />
                  <span className="text-xs font-medium">{config.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {door.status !== 'offline' ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {door.lastHeartbeat ? new Date(door.lastHeartbeat).toLocaleTimeString() : 'N/A'}
                </div>
                <div className="flex-1" />
                {door.status === 'locked' && (
                  <button onClick={() => handleUnlock(door.id)} disabled={!reason.trim() || unlockingId === door.id} className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {unlockingId === door.id ? 'Unlocking...' : 'Unlock'}
                  </button>
                )}
                {door.status === 'unlocked' && (
                  <button onClick={() => onLock(door.id)} className="rounded-md px-3 py-1.5 text-xs font-medium border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                    Lock
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
