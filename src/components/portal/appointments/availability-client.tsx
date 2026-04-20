'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface StaffEntry {
  userId: string
  rows: { day: string; start: string; end: string }[]
}

interface Override {
  id: string
  date: string
  isAvailable: boolean
  reason: string | null
  userId: string
}

interface Connection {
  id: string
  provider: string
  calendarName: string
  status: string
  lastSynced: string
}

export function AvailabilityClient({
  staffEntries,
  overrides: initialOverrides,
  connections,
}: {
  staffEntries: StaffEntry[]
  overrides: Override[]
  connections: Connection[]
}) {
  const [overrides, setOverrides] = useState(initialOverrides)
  const [showAddOverride, setShowAddOverride] = useState(false)

  return (
    <>
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Weekly Patterns
        </h2>
        {staffEntries.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No staff availability configured yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {staffEntries.map((entry) => (
              <li key={entry.userId} className="rounded-[var(--radius)] border border-[var(--color-border)] p-3">
                <div className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
                  Staff {entry.userId.slice(0, 8)}
                </div>
                <ul className="space-y-1 text-xs">
                  {entry.rows.map((r, i) => (
                    <li key={i} className="text-[var(--color-muted-foreground)]">
                      {r.day} · {r.start}–{r.end}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Upcoming Overrides
          </h2>
          <Button size="sm" onClick={() => setShowAddOverride(true)} className="inline-flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Override
          </Button>
        </div>
        {showAddOverride && (
          <div className="mb-4 rounded-[var(--radius)] border border-[var(--color-border)] p-4 space-y-3">
            <AddOverrideForm
              onAdd={(o) => {
                setOverrides((prev) => [...prev, { ...o, id: Date.now().toString(), userId: 'current' }])
                setShowAddOverride(false)
              }}
              onCancel={() => setShowAddOverride(false)}
            />
          </div>
        )}
        {overrides.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {overrides.map((o) => (
              <li key={o.id} className="flex items-center justify-between">
                <span style={{ color: 'var(--color-foreground)' }}>
                  {o.date} — {o.isAvailable ? 'Open' : 'Blocked'}
                  {o.reason ? ` (${o.reason})` : ''}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{o.userId}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">No overrides scheduled.</p>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Calendar Connections
        </h2>
        {connections.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span style={{ color: 'var(--color-foreground)' }}>{c.provider} — {c.calendarName}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{c.status} · last synced {c.lastSynced}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">No calendars connected.</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => alert('Google Calendar integration coming soon')}>Connect Google</Button>
              <Button variant="secondary" size="sm" onClick={() => alert('Outlook integration coming soon')}>Connect Outlook</Button>
              <Button variant="secondary" size="sm" onClick={() => alert('CalDAV integration coming soon')}>Connect CalDAV</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function AddOverrideForm({ onAdd, onCancel }: {
  onAdd: (o: { date: string; isAvailable: boolean; reason: string | null }) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Available?</label>
          <select
            value={isAvailable ? 'yes' : 'no'}
            onChange={(e) => setIsAvailable(e.target.value === 'yes')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
          >
            <option value="no">Blocked</option>
            <option value="yes">Open</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!date} onClick={() => onAdd({ date, isAvailable, reason: reason || null })}>Add Override</Button>
      </div>
    </>
  )
}
