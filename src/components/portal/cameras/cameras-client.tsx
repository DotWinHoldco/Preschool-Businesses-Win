'use client'

// @anchor: cca.camera.cameras-client
// Camera feed grid with expandable detail view

import { useState } from 'react'
import { Camera, Wifi, WifiOff, ExternalLink, Clock, AlertTriangle, DoorOpen, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface CameraFeed {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  lastSnapshot: string
  recentEvents: { id: string; time: string; description: string; icon: 'motion' | 'door' | 'alert' }[]
}

const MOCK_CAMERAS: CameraFeed[] = [
  {
    id: 'cam-1',
    name: 'Butterfly Room',
    location: 'Classroom A — Ages 3-4',
    status: 'online',
    lastSnapshot: '2026-04-20T14:32:00',
    recentEvents: [
      { id: 'e1', time: '2:30 PM', description: 'Motion detected — normal activity', icon: 'motion' },
      { id: 'e2', time: '2:15 PM', description: 'Staff member entered', icon: 'door' },
      { id: 'e3', time: '1:45 PM', description: 'Nap time started — low motion', icon: 'motion' },
    ],
  },
  {
    id: 'cam-2',
    name: 'Sunshine Room',
    location: 'Classroom B — Ages 4-5',
    status: 'online',
    lastSnapshot: '2026-04-20T14:31:00',
    recentEvents: [
      { id: 'e4', time: '2:28 PM', description: 'Art activity in progress', icon: 'motion' },
      { id: 'e5', time: '2:00 PM', description: 'Parent pickup — 1 student', icon: 'door' },
    ],
  },
  {
    id: 'cam-3',
    name: 'Playground',
    location: 'Outdoor — West Side',
    status: 'online',
    lastSnapshot: '2026-04-20T14:30:00',
    recentEvents: [
      { id: 'e6', time: '2:25 PM', description: 'Outdoor play session active', icon: 'motion' },
      { id: 'e7', time: '1:00 PM', description: 'Gate opened', icon: 'door' },
      { id: 'e8', time: '12:55 PM', description: 'Staff conducting headcount', icon: 'motion' },
    ],
  },
  {
    id: 'cam-4',
    name: 'Front Entrance',
    location: 'Main Lobby — Entry/Exit',
    status: 'offline',
    lastSnapshot: '2026-04-20T13:45:00',
    recentEvents: [
      { id: 'e9', time: '1:45 PM', description: 'Camera went offline', icon: 'alert' },
      { id: 'e10', time: '1:40 PM', description: 'Visitor checked in', icon: 'door' },
      { id: 'e11', time: '1:30 PM', description: 'Delivery received', icon: 'door' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Event icon helper
// ---------------------------------------------------------------------------

function EventIcon({ type }: { type: 'motion' | 'door' | 'alert' }) {
  switch (type) {
    case 'motion':
      return <Users size={14} style={{ color: 'var(--color-primary)' }} />
    case 'door':
      return <DoorOpen size={14} style={{ color: 'var(--color-muted-foreground)' }} />
    case 'alert':
      return <AlertTriangle size={14} style={{ color: 'var(--color-destructive)' }} />
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CamerasClient() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = MOCK_CAMERAS.find((c) => c.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_CAMERAS.map((cam) => (
          <button
            key={cam.id}
            type="button"
            onClick={() => setSelectedId(selectedId === cam.id ? null : cam.id)}
            className="text-left w-full rounded-[var(--radius,0.75rem)] border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
            style={{
              borderColor: selectedId === cam.id ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: 'var(--color-card)',
              boxShadow: selectedId === cam.id ? '0 0 0 1px var(--color-primary)' : undefined,
            }}
          >
            {/* Thumbnail area */}
            <div
              className="relative w-full aspect-video rounded-t-[var(--radius,0.75rem)] flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              <Camera size={32} style={{ color: 'var(--color-muted-foreground)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                Live Feed
              </span>
              {/* Status badge */}
              <span
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: cam.status === 'online' ? 'var(--color-success, #10B981)' : 'var(--color-destructive)',
                  color: 'white',
                }}
              >
                {cam.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                {cam.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Info bar */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {cam.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {cam.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <Clock size={10} />
                  <span>{new Date(cam.lastSnapshot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Expanded detail view */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>{selected.name}</CardTitle>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: selected.status === 'online' ? 'var(--color-success, #10B981)' : 'var(--color-destructive)',
                    color: 'white',
                  }}
                >
                  {selected.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {selected.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button variant="secondary" size="sm" disabled={selected.status === 'offline'}>
                <ExternalLink size={14} />
                Open Full Stream
              </Button>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {selected.location} — Last snapshot: {new Date(selected.lastSnapshot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardHeader>

          <CardContent>
            {/* Large preview */}
            <div
              className="w-full aspect-video rounded-[var(--radius,0.75rem)] flex flex-col items-center justify-center gap-3 mb-6"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              <Camera size={48} style={{ color: 'var(--color-muted-foreground)' }} />
              <span className="text-base font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                {selected.status === 'online' ? 'Live Feed Preview' : 'Camera Offline'}
              </span>
            </div>

            {/* Recent events */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
                Recent Events
              </h4>
              <div
                className="rounded-[var(--radius,0.75rem)] border divide-y"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {selected.recentEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-3 px-4 py-3">
                    <EventIcon type={evt.icon} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{evt.description}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>{evt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
