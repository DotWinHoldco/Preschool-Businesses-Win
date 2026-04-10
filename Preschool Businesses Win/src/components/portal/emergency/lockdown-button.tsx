'use client'

// @anchor: cca.emergency.lockdown-button
// One-tap lockdown button with confirmation
// See CCA_BUILD_BRIEF.md §37

import { useState } from 'react'
import { ShieldAlert, AlertTriangle } from 'lucide-react'

interface LockdownButtonProps { onInitiate: (data: { event_type: string; severity: string; title: string; description?: string }) => Promise<void> }

export function LockdownButton({ onInitiate }: LockdownButtonProps) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'details' | 'sending'>('idle')
  const [eventType, setEventType] = useState('lockdown')
  const [isDrill, setIsDrill] = useState(false)
  const [description, setDescription] = useState('')

  const handleInitiate = async () => {
    setStep('sending')
    const title = isDrill ? `[DRILL] ${eventType.replace(/_/g, ' ').toUpperCase()}` : eventType.replace(/_/g, ' ').toUpperCase()
    try { await onInitiate({ event_type: eventType, severity: isDrill ? 'drill' : 'critical', title, description: description || undefined }) } finally { setStep('idle'); setDescription('') }
  }

  if (step === 'idle') {
    return (
      <button onClick={() => setStep('confirm')} className="w-full rounded-xl py-6 flex flex-col items-center gap-2 border-2 transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--color-destructive)', borderColor: 'var(--color-destructive)', color: 'white' }}>
        <ShieldAlert size={40} />
        <span className="text-lg font-bold">EMERGENCY</span>
        <span className="text-xs opacity-80">Tap to initiate lockdown or emergency</span>
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-xl border-2 p-6 space-y-4" style={{ borderColor: 'var(--color-destructive)', backgroundColor: 'var(--color-card)' }}>
        <div className="flex items-center gap-2"><AlertTriangle size={24} style={{ color: 'var(--color-destructive)' }} /><h3 className="text-lg font-bold" style={{ color: 'var(--color-destructive)' }}>Confirm Emergency</h3></div>
        <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>This will lock all doors, notify all parents and staff, and freeze the attendance snapshot. Are you sure?</p>
        <div className="space-y-3">
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} aria-label="Emergency type">
            <option value="lockdown">Lockdown</option>
            <option value="shelter_in_place">Shelter in Place</option>
            <option value="evacuation">Evacuation</option>
            <option value="medical">Medical Emergency</option>
            <option value="weather">Severe Weather</option>
            <option value="other">Other</option>
          </select>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}><input type="checkbox" checked={isDrill} onChange={(e) => setIsDrill(e.target.checked)} /> This is a DRILL</label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('idle')} className="flex-1 rounded-md border py-2.5 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cancel</button>
          <button onClick={() => setStep('details')} className="flex-1 rounded-md py-2.5 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-destructive)' }}>Continue</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 p-6 space-y-4" style={{ borderColor: 'var(--color-destructive)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-destructive)' }}>{isDrill ? '[DRILL] ' : ''}{eventType.replace(/_/g, ' ').toUpperCase()}</h3>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details (optional)" rows={3} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
      <div className="flex gap-2">
        <button onClick={() => setStep('idle')} className="flex-1 rounded-md border py-2.5 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cancel</button>
        <button onClick={handleInitiate} disabled={step === 'sending'} className="flex-1 rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-destructive)' }}>
          {step === 'sending' ? 'INITIATING...' : 'INITIATE NOW'}
        </button>
      </div>
    </div>
  )
}
