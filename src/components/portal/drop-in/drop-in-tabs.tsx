'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

const TABS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'slots', label: 'Slots' },
  { key: 'rates', label: 'Rates' },
] as const

type Tab = (typeof TABS)[number]['key']

interface Booking {
  id: string
  student: string
  classroom: string
  type: string
  status: string
}

interface Slot {
  id: string
  weekday: string
  start_time: string
  end_time: string
  capacity: number
}

interface Rate {
  id: string
  age_range: string
  hourly_rate: number
  minimum_hours: number
}

const INITIAL_BOOKINGS: Booking[] = [
  { id: '1', student: 'Ava Thompson', classroom: 'Butterfly Room', type: 'Full Day', status: 'confirmed' },
  { id: '2', student: 'Jackson Lee', classroom: 'Sunshine Room', type: 'Half Day (AM)', status: 'confirmed' },
  { id: '3', student: 'Mia Garcia', classroom: 'Rainbow Room', type: 'Full Day', status: 'confirmed' },
]

const INITIAL_SLOTS: Slot[] = [
  { id: '1', weekday: 'Monday', start_time: '07:00', end_time: '18:00', capacity: 5 },
  { id: '2', weekday: 'Tuesday', start_time: '07:00', end_time: '18:00', capacity: 5 },
  { id: '3', weekday: 'Wednesday', start_time: '07:00', end_time: '18:00', capacity: 4 },
  { id: '4', weekday: 'Thursday', start_time: '07:00', end_time: '18:00', capacity: 5 },
  { id: '5', weekday: 'Friday', start_time: '07:00', end_time: '18:00', capacity: 3 },
]

const INITIAL_RATES: Rate[] = [
  { id: '1', age_range: 'Infants (6w–12m)', hourly_rate: 18, minimum_hours: 4 },
  { id: '2', age_range: 'Toddlers (12–24m)', hourly_rate: 15, minimum_hours: 4 },
  { id: '3', age_range: 'Twos & Threes', hourly_rate: 12, minimum_hours: 3 },
  { id: '4', age_range: 'Pre-K (4–5y)', hourly_rate: 10, minimum_hours: 3 },
]

export function DropInTabs({ activeTab }: { activeTab: string }) {
  const [tab, setTab] = useState<Tab>(activeTab as Tab)
  const [bookings] = useState(INITIAL_BOOKINGS)
  const [slots, setSlots] = useState(INITIAL_SLOTS)
  const [rates, setRates] = useState(INITIAL_RATES)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [showAddRate, setShowAddRate] = useState(false)

  return (
    <div>
      <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>Today&apos;s Bookings</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{b.student}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{b.classroom} · {b.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    {b.status}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => alert('Cancel booking')}>Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>Weekly Availability Slots</h3>
            <Button size="sm" onClick={() => setShowAddSlot(true)} className="inline-flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
          </div>
          <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {slots.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{s.weekday}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{s.start_time} – {s.end_time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Capacity: {s.capacity}</span>
                    <Button variant="secondary" size="sm" onClick={() => setSlots(prev => prev.filter(x => x.id !== s.id))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {showAddSlot && (
            <AddSlotForm
              onAdd={(slot) => { setSlots(prev => [...prev, { ...slot, id: Date.now().toString() }]); setShowAddSlot(false) }}
              onCancel={() => setShowAddSlot(false)}
            />
          )}
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>Rate Rules</h3>
            <Button size="sm" onClick={() => setShowAddRate(true)} className="inline-flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Rate
            </Button>
          </div>
          <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {rates.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{r.age_range}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>${r.hourly_rate}/hr · {r.minimum_hours}hr minimum</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setRates(prev => prev.filter(x => x.id !== r.id))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          {showAddRate && (
            <AddRateForm
              onAdd={(rate) => { setRates(prev => [...prev, { ...rate, id: Date.now().toString() }]); setShowAddRate(false) }}
              onCancel={() => setShowAddRate(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AddSlotForm({ onAdd, onCancel }: { onAdd: (s: Omit<Slot, 'id'>) => void; onCancel: () => void }) {
  const [weekday, setWeekday] = useState('Monday')
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('18:00')
  const [capacity, setCapacity] = useState(5)

  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Weekday</label>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Capacity</label>
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Start Time</label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">End Time</label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onAdd({ weekday, start_time: startTime, end_time: endTime, capacity })}>Add</Button>
      </div>
    </div>
  )
}

function AddRateForm({ onAdd, onCancel }: { onAdd: (r: Omit<Rate, 'id'>) => void; onCancel: () => void }) {
  const [ageRange, setAgeRange] = useState('')
  const [hourlyRate, setHourlyRate] = useState(12)
  const [minimumHours, setMinimumHours] = useState(3)

  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Age Range</label>
          <Input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="e.g., Toddlers (12-24m)" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Hourly Rate ($)</label>
          <Input type="number" min={0} step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Minimum Hours</label>
          <Input type="number" min={1} value={minimumHours} onChange={(e) => setMinimumHours(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!ageRange.trim()} onClick={() => onAdd({ age_range: ageRange, hourly_rate: hourlyRate, minimum_hours: minimumHours })}>Add</Button>
      </div>
    </div>
  )
}
