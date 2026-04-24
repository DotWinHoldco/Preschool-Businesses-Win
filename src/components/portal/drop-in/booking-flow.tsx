'use client'

// @anchor: cca.dropin.booking-flow
// Drop-in booking wizard

import { useState } from 'react'
import { Calendar, Check } from 'lucide-react'
import type { DropInBookingType } from '@/lib/schemas/drop-in'

interface BookingFlowProps {
  selectedDate: string
  classroomName: string
  rateCents: number
  halfDayRateCents?: number
  slotsRemaining: number
  students: Array<{ id: string; name: string }>
  onBook: (data: { student_id: string; booking_type: DropInBookingType; notes?: string }) => void
  booking?: boolean
}

export function BookingFlow({
  selectedDate,
  classroomName,
  rateCents,
  halfDayRateCents,
  slotsRemaining,
  students,
  onBook,
  booking = false,
}: BookingFlowProps) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? '')
  const [bookingType, setBookingType] = useState<DropInBookingType>('full_day')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-success, #10B981)' }}
        >
          <Check size={28} style={{ color: 'white' }} />
        </div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
          Booking Confirmed!
        </h3>
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
          Drop-in booked for{' '}
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}{' '}
          in {classroomName}.
        </p>
      </div>
    )
  }

  const currentRate = bookingType === 'full_day' ? rateCents : (halfDayRateCents ?? rateCents)

  return (
    <div
      className="rounded-lg border p-6 space-y-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
    >
      <div>
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-foreground)' }}
        >
          <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {classroomName} - {slotsRemaining} spots remaining
        </p>
      </div>

      <div>
        <label
          htmlFor="dropin-student"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-foreground)' }}
        >
          Child
        </label>
        <select
          id="dropin-student"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
          Schedule
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: 'full_day', l: 'Full Day' },
              { v: 'half_day_am', l: 'Morning' },
              { v: 'half_day_pm', l: 'Afternoon' },
            ] as const
          ).map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => setBookingType(v)}
              className="rounded-md border py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: bookingType === v ? 'var(--color-primary)' : 'transparent',
                color: bookingType === v ? 'white' : 'var(--color-foreground)',
                borderColor: bookingType === v ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="dropin-notes"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-foreground)' }}
        >
          Notes (optional)
        </label>
        <textarea
          id="dropin-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        />
      </div>

      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Total
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            ${(currentRate / 100).toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          disabled={!selectedStudent || booking}
          onClick={() => {
            onBook({
              student_id: selectedStudent,
              booking_type: bookingType,
              notes: notes || undefined,
            })
            setConfirmed(true)
          }}
          className="rounded-md px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {booking ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}
