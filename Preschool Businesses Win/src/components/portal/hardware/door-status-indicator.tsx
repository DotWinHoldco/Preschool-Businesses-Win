// @anchor: cca.door.status-indicator
// Compact door status display

import { Lock, Unlock, AlertCircle, WifiOff } from 'lucide-react'

interface DoorStatusIndicatorProps { status: 'locked' | 'unlocked' | 'error' | 'offline'; doorName: string; compact?: boolean }

const CONFIG = {
  locked: { icon: Lock, color: 'var(--color-success, #10B981)', label: 'Locked' },
  unlocked: { icon: Unlock, color: 'var(--color-warning)', label: 'Unlocked' },
  error: { icon: AlertCircle, color: 'var(--color-destructive)', label: 'Error' },
  offline: { icon: WifiOff, color: 'var(--color-muted-foreground)', label: 'Offline' },
}

export function DoorStatusIndicator({ status, doorName, compact = false }: DoorStatusIndicatorProps) {
  const cfg = CONFIG[status]
  const Icon = cfg.icon
  if (compact) {
    return <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: cfg.color }} title={`${doorName}: ${cfg.label}`}><Icon size={12} />{cfg.label}</span>
  }
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color + '20' }}><Icon size={16} style={{ color: cfg.color }} /></div>
      <div><p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{doorName}</p><p className="text-xs" style={{ color: cfg.color }}>{cfg.label}</p></div>
    </div>
  )
}
