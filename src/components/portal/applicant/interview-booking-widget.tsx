'use client'

import { useState, useTransition, useEffect } from 'react'
import { Lock, CalendarDays, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAvailableSlots } from '@/lib/actions/appointments/get-availability'
import { bookAppointment } from '@/lib/actions/appointments/book-appointment'

const STAGE_ORDER = [
  'form_submitted',
  'under_review',
  'info_requested',
  'interview_invited',
  'interview_scheduled',
  'interview_completed',
  'offer_sent',
  'offer_accepted',
  'enrolled',
]

interface Appointment {
  id: string
  start_at: string
  end_at: string
  status: string
  notes?: string | null
}

interface Props {
  pipelineStage: string
  appointmentTypeId: string | null
  applicationId: string
  parentName: string
  parentEmail: string
  existingAppointment: Appointment | null
}

export function InterviewBookingWidget({
  pipelineStage,
  appointmentTypeId,
  applicationId,
  parentName,
  parentEmail,
  existingAppointment,
}: Props) {
  const stageIndex = STAGE_ORDER.indexOf(pipelineStage)
  const invitedIndex = STAGE_ORDER.indexOf('interview_invited')
  const completedIndex = STAGE_ORDER.indexOf('interview_completed')

  const isLocked = stageIndex < invitedIndex
  const isCompleted = stageIndex >= completedIndex
  const isBooked = !!existingAppointment && !isCompleted
  const canBook = !isLocked && !isCompleted && !isBooked && !!appointmentTypeId

  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<Array<{ start: string; end: string; staff_user_id?: string }>>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [pending, startTransition] = useTransition()
  const [booked, setBooked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDate || !appointmentTypeId) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    getAvailableSlots(appointmentTypeId, selectedDate).then((result) => {
      setSlots(result as Array<{ start: string; end: string; staff_user_id?: string }>)
      setLoadingSlots(false)
    })
  }, [selectedDate, appointmentTypeId])

  const handleBook = () => {
    if (selectedSlot === null || !appointmentTypeId) return
    const slot = slots[selectedSlot]
    setError(null)

    startTransition(async () => {
      const result = await bookAppointment({
        appointment_type_id: appointmentTypeId,
        start_at: slot.start,
        booked_by_name: parentName,
        booked_by_email: parentEmail,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        website: '',
        application_id: applicationId,
        staff_user_id: slot.staff_user_id,
      })
      if (!result.ok) {
        setError(result.error ?? 'Booking failed')
        return
      }
      setBooked(true)
    })
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Locked state
  if (isLocked) {
    return (
      <div id="book-tour" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden opacity-50">
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-muted)]">
            <Lock className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Book Your Tour</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              Tour booking will be available once your application is reviewed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (isCompleted) {
    return (
      <div id="book-tour" className="rounded-2xl border border-green-200 bg-green-50 shadow-sm overflow-hidden">
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-800">Interview Completed</h3>
            <p className="text-xs text-green-600 mt-0.5">
              Your interview is complete. We&apos;ll be in touch with next steps.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Booked state
  if (isBooked && existingAppointment) {
    return (
      <div id="book-tour" className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 shadow-sm overflow-hidden">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <CalendarDays className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Tour Scheduled</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">You&apos;re all set!</p>
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <CalendarDays className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              {formatDate(existingAppointment.start_at)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <Clock className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              {formatTime(existingAppointment.start_at)} – {formatTime(existingAppointment.end_at)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <MapPin className="h-4 w-4" />
              In person at the academy
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Just booked (success)
  if (booked) {
    return (
      <div id="book-tour" className="rounded-2xl border border-green-200 bg-green-50 shadow-sm overflow-hidden">
        <div className="px-5 py-5 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-green-800">Tour Booked!</h3>
          <p className="text-xs text-green-600 mt-1">
            Check your email for confirmation details. We look forward to meeting you!
          </p>
        </div>
      </div>
    )
  }

  // Active booking state
  if (!canBook) return null

  const today = new Date().toISOString().slice(0, 10)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().slice(0, 10)

  return (
    <div id="book-tour" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <CalendarDays className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Book Your Tour</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              Choose a date and time that works for your family.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Date picker */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
            Select a date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={today}
            max={maxDateStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
              Available times
            </label>
            {loadingSlots ? (
              <p className="text-xs text-[var(--color-muted-foreground)] py-2">Loading available times...</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-foreground)] py-2">No times available on this date. Try another day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSlot(i)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      selectedSlot === i
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50',
                    )}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Book button */}
        {selectedSlot !== null && (
          <button
            type="button"
            onClick={handleBook}
            disabled={pending}
            className="w-full rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold py-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? 'Booking...' : 'Confirm Tour Booking'}
          </button>
        )}
      </div>
    </div>
  )
}
