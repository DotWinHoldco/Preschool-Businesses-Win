'use client'

// @anchor: cca.emergency.emergency-client
// Full emergency management surface: alerts, drills, contacts

import { useState } from 'react'
import {
  ShieldAlert,
  Siren,
  CloudLightning,
  Lock,
  HeartPulse,
  Users,
  Plus,
  Trash2,
  Play,
  CalendarPlus,
  Phone,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlertType = 'fire' | 'lockdown' | 'tornado' | 'medical' | 'reunification'

interface DrillSchedule {
  type: string
  lastDate: string
  nextDate: string
}

interface DrillRecord {
  id: string
  date: string
  type: string
  duration: string
  participants: number
  notes: string
  status: 'completed' | 'in-progress'
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  role: string
}

// ---------------------------------------------------------------------------
// Alert type config
// ---------------------------------------------------------------------------

const ALERT_TYPES: { value: AlertType; label: string; icon: typeof Siren }[] = [
  { value: 'fire', label: 'Fire', icon: Siren },
  { value: 'lockdown', label: 'Lockdown', icon: Lock },
  { value: 'tornado', label: 'Tornado', icon: CloudLightning },
  { value: 'medical', label: 'Medical', icon: HeartPulse },
  { value: 'reunification', label: 'Reunification', icon: Users },
]

// ---------------------------------------------------------------------------
// Initial mock data
// ---------------------------------------------------------------------------

const INITIAL_DRILL_SCHEDULES: DrillSchedule[] = [
  { type: 'Fire Drill', lastDate: 'Mar 15, 2026', nextDate: 'Apr 15, 2026' },
  { type: 'Tornado Drill', lastDate: 'Feb 20, 2026', nextDate: 'May 20, 2026' },
  { type: 'Lockdown', lastDate: 'Jan 10, 2026', nextDate: 'Jul 10, 2026' },
]

const INITIAL_DRILL_RECORDS: DrillRecord[] = [
  { id: 'dr-1', date: '2026-03-15', type: 'Fire Drill', duration: '4 min 32 sec', participants: 47, notes: 'All clear. Evacuation under 5 minutes.', status: 'completed' },
  { id: 'dr-2', date: '2026-02-20', type: 'Tornado Drill', duration: '3 min 18 sec', participants: 44, notes: 'All students and staff accounted for.', status: 'completed' },
  { id: 'dr-3', date: '2026-01-10', type: 'Lockdown', duration: '6 min 05 sec', participants: 52, notes: 'Two classrooms needed extra time to secure.', status: 'completed' },
]

const INITIAL_CONTACTS: EmergencyContact[] = [
  { id: 'ec-1', name: 'Sarah Crandall', phone: '(903) 555-0101', role: 'Director' },
  { id: 'ec-2', name: 'Michael Torres', phone: '(903) 555-0102', role: 'Asst. Director' },
  { id: 'ec-3', name: 'Kaufman Fire Dept.', phone: '(972) 932-2211', role: 'Fire Department' },
  { id: 'ec-4', name: 'Kaufman PD', phone: '(972) 932-3282', role: 'Police' },
  { id: 'ec-5', name: 'Poison Control', phone: '(800) 222-1222', role: 'Poison Control' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmergencyClient() {
  // Alert state
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertType, setAlertType] = useState<AlertType>('fire')
  const [confirmText, setConfirmText] = useState('')
  const [alertSent, setAlertSent] = useState(false)

  // Drill scheduling dialog
  const [showDrillDialog, setShowDrillDialog] = useState(false)
  const [drillForm, setDrillForm] = useState({ type: 'Fire Drill', date: '', time: '', notes: '' })

  // Start drill confirm
  const [showStartDrillConfirm, setShowStartDrillConfirm] = useState(false)
  const [startDrillType, setStartDrillType] = useState('')

  // Drill records
  const [drillRecords, setDrillRecords] = useState<DrillRecord[]>(INITIAL_DRILL_RECORDS)

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_CONTACTS)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', phone: '', role: '' })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleSendAlert() {
    setAlertSent(true)
    setTimeout(() => {
      setShowAlertDialog(false)
      setConfirmText('')
      setAlertType('fire')
      setAlertSent(false)
    }, 2000)
  }

  function handleScheduleDrill() {
    // In production this would call a server action
    setShowDrillDialog(false)
    setDrillForm({ type: 'Fire Drill', date: '', time: '', notes: '' })
  }

  function handleStartDrillNow() {
    const newRecord: DrillRecord = {
      id: `dr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: startDrillType,
      duration: '--',
      participants: 0,
      notes: 'In progress',
      status: 'in-progress',
    }
    setDrillRecords((prev) => [newRecord, ...prev])
    setShowStartDrillConfirm(false)
    setStartDrillType('')
  }

  function handleAddContact() {
    if (!contactForm.name || !contactForm.phone || !contactForm.role) return
    const newContact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      ...contactForm,
    }
    setContacts((prev) => [...prev, newContact])
    setShowContactDialog(false)
    setContactForm({ name: '', phone: '', role: '' })
  }

  function handleRemoveContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* Emergency Alert Trigger                                           */}
      {/* ================================================================= */}
      <Card className="border-2" style={{ borderColor: 'var(--color-destructive)' }}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-destructive)' }}
            >
              <ShieldAlert size={32} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
                Emergency Alert System
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                Sends SMS + push notifications to all staff and parents immediately.
              </p>
            </div>
            <Button variant="danger" size="lg" onClick={() => setShowAlertDialog(true)}>
              <Siren size={18} />
              Trigger Emergency Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert confirmation dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogOverlay onClick={() => setShowAlertDialog(false)} />
        <DialogContent
          title="Trigger Emergency Alert"
          description="This will send SMS + push to ALL staff and parents. Type CONFIRM to proceed."
        >
          <DialogClose onClick={() => setShowAlertDialog(false)} />

          {alertSent ? (
            <div className="py-8 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'var(--color-destructive)' }}
              >
                <Siren size={24} style={{ color: 'white' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--color-destructive)' }}>Alert Sent!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                All staff and parents have been notified.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Alert type radio buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Alert Type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALERT_TYPES.map((at) => {
                    const Icon = at.icon
                    return (
                      <label
                        key={at.value}
                        className="flex items-center gap-2 rounded-[var(--radius,0.75rem)] border px-3 py-2.5 cursor-pointer transition-colors"
                        style={{
                          borderColor: alertType === at.value ? 'var(--color-destructive)' : 'var(--color-border)',
                          backgroundColor: alertType === at.value ? 'var(--color-destructive)' : 'transparent',
                          color: alertType === at.value ? 'white' : 'var(--color-foreground)',
                        }}
                      >
                        <input
                          type="radio"
                          name="alertType"
                          value={at.value}
                          checked={alertType === at.value}
                          onChange={() => setAlertType(at.value)}
                          className="sr-only"
                        />
                        <Icon size={16} />
                        <span className="text-sm font-medium">{at.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Confirm input */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Type <span className="font-mono font-bold">CONFIRM</span> to enable
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type CONFIRM"
                  error={confirmText.length > 0 && confirmText !== 'CONFIRM'}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowAlertDialog(false)
                    setConfirmText('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={confirmText !== 'CONFIRM'}
                  onClick={handleSendAlert}
                >
                  <Siren size={16} />
                  Send Alert
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Drills Section                                                    */}
      {/* ================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Drills
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDrillDialog(true)}>
              <CalendarPlus size={14} />
              Schedule Drill
            </Button>
          </div>
        </div>

        {/* Drill schedule cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {INITIAL_DRILL_SCHEDULES.map((ds) => (
            <Card key={ds.type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {ds.type}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setStartDrillType(ds.type)
                      setShowStartDrillConfirm(true)
                    }}
                  >
                    <Play size={12} />
                    Start Now
                  </Button>
                </div>
                <div className="space-y-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <p>Last: {ds.lastDate}</p>
                  <p>Next: {ds.nextDate}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Drill records table */}
        <Card>
          <CardHeader>
            <CardTitle>Drill Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-muted)' }}>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Date</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Type</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Duration</th>
                    <th className="p-3 text-right font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Participants</th>
                    <th className="p-3 text-left font-medium hidden sm:table-cell" style={{ color: 'var(--color-muted-foreground)' }}>Notes</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drillRecords.map((rec) => (
                    <tr key={rec.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="p-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {rec.type}
                      </td>
                      <td className="p-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {rec.duration}
                      </td>
                      <td className="p-3 text-right" style={{ color: 'var(--color-foreground)' }}>
                        {rec.participants}
                      </td>
                      <td className="p-3 hidden sm:table-cell max-w-[200px] truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                        {rec.notes}
                      </td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: rec.status === 'completed' ? 'var(--color-success, #10B981)' : 'var(--color-warning)',
                            color: 'white',
                          }}
                        >
                          {rec.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule drill dialog */}
      <Dialog open={showDrillDialog} onOpenChange={setShowDrillDialog}>
        <DialogOverlay onClick={() => setShowDrillDialog(false)} />
        <DialogContent title="Schedule Drill">
          <DialogClose onClick={() => setShowDrillDialog(false)} />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Type</label>
              <select
                value={drillForm.type}
                onChange={(e) => setDrillForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-3 text-sm min-h-[48px]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', backgroundColor: 'var(--color-background)' }}
              >
                <option value="Fire Drill">Fire Drill</option>
                <option value="Tornado Drill">Tornado Drill</option>
                <option value="Lockdown">Lockdown</option>
                <option value="Medical">Medical</option>
                <option value="Reunification">Reunification</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Date</label>
                <Input
                  type="date"
                  value={drillForm.date}
                  onChange={(e) => setDrillForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Time</label>
                <Input
                  type="time"
                  value={drillForm.time}
                  onChange={(e) => setDrillForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Notes</label>
              <textarea
                value={drillForm.notes}
                onChange={(e) => setDrillForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-3 text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', backgroundColor: 'var(--color-background)' }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDrillDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!drillForm.date || !drillForm.time}
                onClick={handleScheduleDrill}
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start drill now confirm dialog */}
      <Dialog open={showStartDrillConfirm} onOpenChange={setShowStartDrillConfirm}>
        <DialogOverlay onClick={() => setShowStartDrillConfirm(false)} />
        <DialogContent title="Start Drill Now" description={`Start a ${startDrillType} drill immediately?`}>
          <DialogClose onClick={() => setShowStartDrillConfirm(false)} />
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowStartDrillConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleStartDrillNow}>
              <Play size={14} />
              Start Drill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Emergency Contacts                                                */}
      {/* ================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Emergency Contacts
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setShowContactDialog(true)}>
            <Plus size={14} />
            Add Contact
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {contact.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {contact.role}
                    </p>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm font-medium shrink-0"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {contact.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-2 rounded-full transition-colors hover:bg-[var(--color-muted)]"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    aria-label={`Remove ${contact.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No emergency contacts. Add one above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add contact dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogOverlay onClick={() => setShowContactDialog(false)} />
        <DialogContent title="Add Emergency Contact">
          <DialogClose onClick={() => setShowContactDialog(false)} />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Name</label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Phone</label>
              <Input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 555-1234"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Role</label>
              <Input
                value={contactForm.role}
                onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Director, Fire Dept., etc."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowContactDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!contactForm.name || !contactForm.phone || !contactForm.role}
                onClick={handleAddContact}
              >
                Add Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
