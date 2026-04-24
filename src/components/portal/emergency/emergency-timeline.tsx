// @anchor: cca.emergency.timeline
// Real-time emergency event timeline

import { ShieldAlert, Bell, Lock, Camera, Users, CheckCircle } from 'lucide-react'

interface TimelineEntry {
  id: string
  action_type: string
  executed_at: string
  status: 'success' | 'failed' | 'pending'
  error_message?: string | null
}
interface EmergencyTimelineProps {
  eventTitle: string
  eventType: string
  severity: string
  initiatedAt: string
  status: 'active' | 'resolved'
  actions: TimelineEntry[]
}

const ACTION_CONFIG: Record<string, { icon: typeof ShieldAlert; label: string }> = {
  door_lock_all: { icon: Lock, label: 'All doors locked' },
  broadcast_parent: { icon: Bell, label: 'Parent notification sent' },
  broadcast_staff: { icon: Bell, label: 'Staff notification sent' },
  camera_record: { icon: Camera, label: 'Cameras recording' },
  attendance_snapshot: { icon: Users, label: 'Attendance snapshot taken' },
  reunification_start: { icon: Users, label: 'Reunification started' },
}

export function EmergencyTimeline({
  eventTitle,
  severity,
  initiatedAt,
  status,
  actions,
}: EmergencyTimelineProps) {
  return (
    <div
      className="rounded-lg border"
      style={{
        borderColor: status === 'active' ? 'var(--color-destructive)' : 'var(--color-border)',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <ShieldAlert
            size={20}
            style={{
              color:
                status === 'active' ? 'var(--color-destructive)' : 'var(--color-success, #10B981)',
            }}
          />
          <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
            {eventTitle}
          </h3>
          <span
            className="text-xs font-medium rounded-full px-2 py-0.5"
            style={{
              backgroundColor:
                status === 'active' ? 'var(--color-destructive)' : 'var(--color-success, #10B981)',
              color: 'white',
            }}
          >
            {status === 'active' ? 'ACTIVE' : 'RESOLVED'}
          </span>
          {severity === 'drill' && (
            <span
              className="text-xs font-medium rounded-full px-2 py-0.5"
              style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
            >
              DRILL
            </span>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Initiated: {new Date(initiatedAt).toLocaleString()}
        </p>
      </div>
      <div className="p-5">
        <div className="relative pl-6 space-y-4">
          <div
            className="absolute left-2.5 top-0 bottom-0 w-px"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
          {actions.map((action) => {
            const config = ACTION_CONFIG[action.action_type] ?? {
              icon: CheckCircle,
              label: action.action_type,
            }
            const Icon = config.icon
            const statusColor =
              action.status === 'success'
                ? 'var(--color-success, #10B981)'
                : action.status === 'failed'
                  ? 'var(--color-destructive)'
                  : 'var(--color-warning)'
            return (
              <div key={action.id} className="relative flex items-start gap-3">
                <div
                  className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: statusColor }}
                >
                  <Icon size={12} style={{ color: 'white' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {config.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(action.executed_at).toLocaleTimeString()}
                  </p>
                  {action.error_message && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-destructive)' }}>
                      {action.error_message}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
