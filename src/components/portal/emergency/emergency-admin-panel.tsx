'use client'

// @anchor: cca.emergency.admin-panel

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Siren, Trash2, CalendarPlus, MapPin, Phone, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { initiateEmergencyEvent, resolveEmergencyEvent } from '@/lib/actions/emergency/initiate-v2'
import { scheduleDrill } from '@/lib/actions/emergency/drills'
import { createMusterPoint, deleteMusterPoint } from '@/lib/actions/emergency/muster-points'
import { createEmergencyContact, deleteEmergencyContact } from '@/lib/actions/emergency/contacts'

type EmergencyEvent = {
  id: string
  event_type: string | null
  severity: string | null
  title: string | null
  status: string | null
  created_at: string | null
}

type Drill = {
  id: string
  drill_type: string
  scheduled_at: string
  completed_at: string | null
  status: string
  notes: string | null
}

type MusterPoint = {
  id: string
  name: string
  location_description: string | null
  capacity: number | null
  is_primary: boolean
  is_active: boolean
}

type EmergencyContact = {
  id: string
  contact_type: string
  name: string
  role: string | null
  phone: string
  phone_alt: string | null
  email: string | null
  is_active: boolean
}

export function EmergencyAdminPanel({
  activeEvents,
  recentDrills,
  musterPoints,
  contacts,
}: {
  activeEvents: EmergencyEvent[]
  recentDrills: Drill[]
  musterPoints: MusterPoint[]
  contacts: EmergencyContact[]
}) {
  const [showInitiate, setShowInitiate] = useState(false)
  const [showDrill, setShowDrill] = useState(false)
  const [showMuster, setShowMuster] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [allClearFor, setAllClearFor] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Initiate button */}
      <div
        className="rounded-xl p-5 flex items-center justify-between gap-4 border-2"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-destructive)' }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-foreground)' }}>
            Emergency Alert System
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Initiate a critical event and log notification channels.
          </p>
        </div>
        <Button variant="danger" onClick={() => setShowInitiate(true)}>
          <Siren size={16} />
          Initiate Emergency
        </Button>
      </div>

      {/* Active events */}
      {activeEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
            Active events
          </h2>
          <div className="space-y-2">
            {activeEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-destructive)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="danger">{e.severity ?? 'active'}</Badge>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {e.title ?? e.event_type}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {e.created_at ? new Date(e.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setAllClearFor(e.id)}>
                  <CheckCircle size={14} />
                  All Clear
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Drills */}
      <Section
        title="Recent drills"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowDrill(true)}>
            <CalendarPlus size={14} />
            Schedule Drill
          </Button>
        }
      >
        {recentDrills.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No drills scheduled yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentDrills.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={d.status === 'completed' ? 'default' : 'outline'}>
                    {d.status}
                  </Badge>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {d.drill_type}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {new Date(d.scheduled_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Muster points */}
      <Section
        title="Muster points"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowMuster(true)}>
            <Plus size={14} />
            Add Muster Point
          </Button>
        }
      >
        {musterPoints.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No muster points defined.
          </p>
        ) : (
          <ul className="space-y-2">
            {musterPoints.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {m.name}
                    {m.is_primary && (
                      <Badge variant="default" className="ml-2">
                        Primary
                      </Badge>
                    )}
                  </p>
                  {m.location_description && (
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {m.location_description}
                    </p>
                  )}
                </div>
                {m.capacity && (
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    Cap {m.capacity}
                  </span>
                )}
                <DeleteButton
                  label={`Delete ${m.name}`}
                  onDelete={() => deleteMusterPoint({ id: m.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Contacts */}
      <Section
        title="Emergency contacts"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowContact(true)}>
            <Plus size={14} />
            Add Contact
          </Button>
        }
      >
        {contacts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No emergency contacts.
          </p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {c.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {c.contact_type}
                    {c.role ? ` · ${c.role}` : ''}
                  </p>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {c.phone}
                </a>
                <DeleteButton
                  label={`Delete ${c.name}`}
                  onDelete={() => deleteEmergencyContact({ id: c.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <InitiateDialog open={showInitiate} onOpenChange={setShowInitiate} />
      <DrillDialog open={showDrill} onOpenChange={setShowDrill} musterPoints={musterPoints} />
      <MusterDialog open={showMuster} onOpenChange={setShowMuster} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} />
      <AllClearDialog eventId={allClearFor} onClose={() => setAllClearFor(null)} />
    </div>
  )
}

// ----------------------------------------------------------------------------

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          {title}
        </h2>
        {action}
      </div>
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {children}
      </div>
    </section>
  )
}

function DeleteButton({
  label,
  onDelete,
}: {
  label: string
  onDelete: () => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function click() {
    if (!confirm('Delete this item?')) return
    start(async () => {
      const r = await onDelete()
      if (r.ok) router.refresh()
      else alert(r.error ?? 'Failed to delete')
    })
  }
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={click}
      className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-background)]"
      style={{ color: 'var(--color-muted-foreground)' }}
    >
      <Trash2 size={14} />
    </button>
  )
}

function InitiateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    event_type: 'lockdown' as
      | 'lockdown'
      | 'shelter_in_place'
      | 'evacuation'
      | 'medical'
      | 'weather'
      | 'drill'
      | 'other',
    severity: 'critical' as 'drill' | 'advisory' | 'critical',
    title: '',
    description: '',
    channel_push: true,
    channel_sms: true,
    channel_email: false,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const channels = [
      form.channel_push && 'push',
      form.channel_sms && 'sms',
      form.channel_email && 'email',
    ].filter(Boolean) as string[]
    start(async () => {
      const res = await initiateEmergencyEvent({
        event_type: form.event_type,
        severity: form.severity,
        title: form.title,
        description: form.description || null,
        channels,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent
        title="Initiate Emergency"
        description="Logged to audit trail. Notifications channels are recorded."
      >
        <DialogClose onClick={() => onOpenChange(false)} />
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.event_type}
              onChange={(e) =>
                setForm((s) => ({ ...s, event_type: e.target.value as typeof form.event_type }))
              }
            >
              <option value="lockdown">Lockdown</option>
              <option value="shelter_in_place">Shelter in place</option>
              <option value="evacuation">Evacuation</option>
              <option value="medical">Medical</option>
              <option value="weather">Weather</option>
              <option value="drill">Drill</option>
              <option value="other">Other</option>
            </Select>
            <Select
              value={form.severity}
              onChange={(e) =>
                setForm((s) => ({ ...s, severity: e.target.value as typeof form.severity }))
              }
            >
              <option value="critical">Critical</option>
              <option value="advisory">Advisory</option>
              <option value="drill">Drill</option>
            </Select>
          </div>
          <Input
            required
            placeholder="Title (shown to staff/parents)"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />
          <Textarea
            rows={3}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
          <div className="space-y-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              Notification channels
            </p>
            <div className="flex gap-4 text-sm" style={{ color: 'var(--color-foreground)' }}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.channel_push}
                  onChange={(e) => setForm((s) => ({ ...s, channel_push: e.target.checked }))}
                />
                Push
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.channel_sms}
                  onChange={(e) => setForm((s) => ({ ...s, channel_sms: e.target.checked }))}
                />
                SMS
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.channel_email}
                  onChange={(e) => setForm((s) => ({ ...s, channel_email: e.target.checked }))}
                />
                Email
              </label>
            </div>
          </div>
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" className="flex-1" loading={pending}>
              Initiate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AllClearDialog({ eventId, onClose }: { eventId: string | null; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('All clear. Resume normal operations.')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventId) return
    setError(null)
    start(async () => {
      const res = await resolveEmergencyEvent({
        event_id: eventId,
        all_clear_message: message,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={!!eventId} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title="Issue All Clear" description="Close out the active emergency event.">
        <DialogClose onClick={onClose} />
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              Send All Clear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DrillDialog({
  open,
  onOpenChange,
  musterPoints,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  musterPoints: MusterPoint[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    drill_type: 'fire' as
      | 'fire'
      | 'lockdown'
      | 'shelter_in_place'
      | 'evacuation'
      | 'severe_weather'
      | 'earthquake',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    muster_point_id: '',
    notes: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const iso = new Date(`${form.date}T${form.time}:00`).toISOString()
      const res = await scheduleDrill({
        drill_type: form.drill_type,
        scheduled_at: iso,
        notes: form.notes || null,
        muster_point_id: form.muster_point_id || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title="Schedule Drill">
        <DialogClose onClick={() => onOpenChange(false)} />
        <form onSubmit={submit} className="space-y-3">
          <Select
            value={form.drill_type}
            onChange={(e) =>
              setForm((s) => ({ ...s, drill_type: e.target.value as typeof form.drill_type }))
            }
          >
            <option value="fire">Fire</option>
            <option value="lockdown">Lockdown</option>
            <option value="shelter_in_place">Shelter in place</option>
            <option value="evacuation">Evacuation</option>
            <option value="severe_weather">Severe weather</option>
            <option value="earthquake">Earthquake</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            />
            <Input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
            />
          </div>
          <Select
            value={form.muster_point_id}
            onChange={(e) => setForm((s) => ({ ...s, muster_point_id: e.target.value }))}
          >
            <option value="">Muster point (none)</option>
            {musterPoints.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <Textarea
            rows={3}
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MusterDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    location_description: '',
    capacity: '',
    floorplan_url: '',
    evacuation_procedure: '',
    is_primary: false,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createMusterPoint({
        name: form.name,
        location_description: form.location_description || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        floorplan_url: form.floorplan_url || null,
        evacuation_procedure: form.evacuation_procedure || null,
        is_primary: form.is_primary,
        is_active: true,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onOpenChange(false)
      setForm({
        name: '',
        location_description: '',
        capacity: '',
        floorplan_url: '',
        evacuation_procedure: '',
        is_primary: false,
      })
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title="Add Muster Point">
        <DialogClose onClick={() => onOpenChange(false)} />
        <form onSubmit={submit} className="space-y-3">
          <Input
            required
            placeholder="Name (e.g. 'Back parking lot')"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Textarea
            rows={2}
            placeholder="Location description"
            value={form.location_description}
            onChange={(e) => setForm((s) => ({ ...s, location_description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))}
            />
            <Input
              placeholder="Floorplan URL"
              value={form.floorplan_url}
              onChange={(e) => setForm((s) => ({ ...s, floorplan_url: e.target.value }))}
            />
          </div>
          <Textarea
            rows={3}
            placeholder="Evacuation procedure"
            value={form.evacuation_procedure}
            onChange={(e) => setForm((s) => ({ ...s, evacuation_procedure: e.target.value }))}
          />
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-foreground)' }}
          >
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((s) => ({ ...s, is_primary: e.target.checked }))}
            />
            Primary muster point
          </label>
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    contact_type: 'fire' as
      | 'police'
      | 'fire'
      | 'ems'
      | 'poison_control'
      | 'hospital'
      | 'cps'
      | 'licensing'
      | 'facility_maintenance'
      | 'other',
    name: '',
    role: '',
    phone: '',
    phone_alt: '',
    email: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createEmergencyContact({
        contact_type: form.contact_type,
        name: form.name,
        role: form.role || null,
        phone: form.phone,
        phone_alt: form.phone_alt || null,
        email: form.email || null,
        address: null,
        notes: null,
        sort_order: 0,
        is_active: true,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onOpenChange(false)
      setForm({ contact_type: 'fire', name: '', role: '', phone: '', phone_alt: '', email: '' })
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title="Add Emergency Contact">
        <DialogClose onClick={() => onOpenChange(false)} />
        <form onSubmit={submit} className="space-y-3">
          <Select
            value={form.contact_type}
            onChange={(e) =>
              setForm((s) => ({ ...s, contact_type: e.target.value as typeof form.contact_type }))
            }
          >
            <option value="police">Police</option>
            <option value="fire">Fire</option>
            <option value="ems">EMS</option>
            <option value="poison_control">Poison control</option>
            <option value="hospital">Hospital</option>
            <option value="cps">CPS</option>
            <option value="licensing">Licensing</option>
            <option value="facility_maintenance">Facility maintenance</option>
            <option value="other">Other</option>
          </Select>
          <Input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
            <Input
              type="tel"
              placeholder="Alt phone"
              value={form.phone_alt}
              onChange={(e) => setForm((s) => ({ ...s, phone_alt: e.target.value }))}
            />
          </div>
          <Input
            type="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          />
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
