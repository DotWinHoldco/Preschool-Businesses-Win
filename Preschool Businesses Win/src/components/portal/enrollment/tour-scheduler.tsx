// @anchor: cca.leads.tour-scheduler
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Calendar, Clock, Save } from 'lucide-react'

interface TourSchedulerProps {
  leadId: string
  leadName: string
  onSchedule: (data: { scheduled_at: string; notes: string }) => void
}

export function TourScheduler({ leadId, leadName, onSchedule }: TourSchedulerProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const min = i % 2 === 0 ? '00' : '30'
    return `${String(hour).padStart(2, '0')}:${min}`
  })

  const handleSubmit = async () => {
    if (!date || !time) return
    setSubmitting(true)
    try {
      const scheduled_at = `${date}T${time}:00`
      onSchedule({ scheduled_at, notes })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
        Schedule Tour
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
        For <span className="font-medium text-[var(--color-foreground)]">{leadName}</span>
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
              <Calendar className="h-3.5 w-3.5" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
              <Clock className="h-3.5 w-3.5" /> Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {parseInt(slot) > 12
                    ? `${parseInt(slot) - 12}:${slot.split(':')[1]} PM`
                    : parseInt(slot) === 12
                      ? `12:${slot.split(':')[1]} PM`
                      : `${parseInt(slot)}:${slot.split(':')[1]} AM`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes for the tour (e.g., specific questions, areas of interest)..."
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!date || !time || submitting}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Scheduling...' : 'Schedule Tour'}
          </button>
        </div>
      </div>
    </div>
  )
}
