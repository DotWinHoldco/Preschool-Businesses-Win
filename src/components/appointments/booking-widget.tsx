'use client'

// @anchor: cca.appointments.booking-widget
// Calendly-style appointment booking widget — month calendar + time slots + booking form.

import { useEffect, useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarCheck } from 'lucide-react'
import { getAvailableSlots, getAvailableDates } from '@/lib/actions/appointments/get-availability'
import { bookAppointment } from '@/lib/actions/appointments/book-appointment'
import type { TimeSlot } from '@/lib/calendar/availability-calculator'

interface AppointmentType {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  location: string | null
  location_type: 'in_person' | 'virtual' | 'phone'
}

interface TenantBranding {
  school_name: string
  logo_path: string | null
  logo_icon_path: string | null
}

interface BookingWidgetProps {
  tenantSlug: string
  appointmentType: AppointmentType
  branding: TenantBranding | null
  prefill?: {
    name?: string
    email?: string
    phone?: string
    application_id?: string
  }
}

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function BookingWidget({
  tenantSlug: _tenantSlug,
  appointmentType,
  branding,
  prefill,
}: BookingWidgetProps) {
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [pending, startTransition] = useTransition()
  const [confirmation, setConfirmation] = useState<{ id: string; start: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: prefill?.name ?? '',
    email: prefill?.email ?? '',
    phone: prefill?.phone ?? '',
    notes: '',
  })
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingMonth(true)
    getAvailableDates(appointmentType.id, viewMonth.toISOString())
      .then((dates) => {
        if (!cancelled) setAvailableDates(dates)
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false)
      })
    return () => {
      cancelled = true
    }
  }, [appointmentType.id, viewMonth])

  useEffect(() => {
    if (!selectedDate) {
      setSlots([])
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    getAvailableSlots(appointmentType.id, selectedDate.toISOString())
      .then((s) => {
        if (!cancelled) setSlots(s)
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })
    return () => {
      cancelled = true
    }
  }, [appointmentType.id, selectedDate])

  const grid = useMemo(() => {
    const start = new Date(viewMonth)
    const firstDow = start.getDay()
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
    const cells: Array<{ date: Date | null; available: boolean; isToday: boolean }> = []
    for (let i = 0; i < firstDow; i += 1)
      cells.push({ date: null, available: false, isToday: false })
    const today = new Date()
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)
      const iso = date.toISOString().slice(0, 10)
      cells.push({ date, available: availableDates.includes(iso), isToday: isSameDay(date, today) })
    }
    return cells
  }, [viewMonth, availableDates])

  const handleBook = () => {
    if (!selectedSlot) return
    setError(null)
    startTransition(async () => {
      const result = await bookAppointment({
        appointment_type_id: appointmentType.id,
        start_at: selectedSlot.start,
        booked_by_name: form.name.trim(),
        booked_by_email: form.email.trim(),
        booked_by_phone: form.phone.trim() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
        notes: form.notes.trim() || undefined,
        application_id: prefill?.application_id,
        staff_user_id: selectedSlot.staff_user_id ?? undefined,
        website: honeypot,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed to book')
      } else if (result.id && result.id !== 'honeypot') {
        setConfirmation({ id: result.id, start: selectedSlot.start })
      }
    })
  }

  if (confirmation) {
    return <Confirmation appointmentType={appointmentType} startIso={confirmation.start} />
  }

  const canSubmit = form.name.trim().length > 0 && form.email.includes('@') && !!selectedSlot

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <header className="border-b border-[var(--color-border)] p-6">
          <div className="flex items-center gap-3">
            {branding?.logo_icon_path && (
              <div className="h-10 w-10 rounded-full bg-[var(--color-muted)]" aria-hidden />
            )}
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {branding?.school_name ?? 'Preschool'}
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {appointmentType.name}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {appointmentType.duration_minutes} minutes
            </span>
            {appointmentType.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {appointmentType.location}
              </span>
            )}
          </div>
          {appointmentType.description && (
            <p className="mt-3 text-sm text-[var(--color-foreground)]/80">
              {appointmentType.description}
            </p>
          )}
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                }
                className="rounded-full p-1.5 hover:bg-[var(--color-muted)]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold text-[var(--color-foreground)]">
                {monthLabel(viewMonth)}
              </div>
              <button
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                }
                className="rounded-full p-1.5 hover:bg-[var(--color-muted)]"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-muted-foreground)]">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (!cell.date) return <div key={i} />
                const isSelected = selectedDate && isSameDay(cell.date, selectedDate)
                const cellDate: Date = cell.date
                return (
                  <button
                    key={i}
                    disabled={!cell.available}
                    onClick={() => setSelectedDate(cellDate)}
                    className={
                      isSelected
                        ? 'aspect-square rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium'
                        : cell.available
                          ? 'aspect-square rounded-full text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-primary)]/10'
                          : 'aspect-square rounded-full text-sm text-[var(--color-muted-foreground)]/40 cursor-not-allowed'
                    }
                  >
                    <span className="relative inline-block">
                      {cellDate.getDate()}
                      {cell.available && !isSelected && (
                        <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--color-primary)]" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {loadingMonth && (
              <div className="mt-2 text-center text-xs text-[var(--color-muted-foreground)]">
                Loading availability...
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a date'}
            </div>
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto pr-1">
              {loadingSlots ? (
                <div className="col-span-2 text-center text-sm text-[var(--color-muted-foreground)]">
                  Finding times...
                </div>
              ) : slots.length === 0 ? (
                <div className="col-span-2 text-center text-sm text-[var(--color-muted-foreground)]">
                  {selectedDate ? 'No available times on this day' : ' '}
                </div>
              ) : (
                slots.map((slot) => {
                  const active = selectedSlot?.start === slot.start
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className={
                        active
                          ? 'rounded-[var(--radius)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)]'
                          : 'rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)] hover:border-[var(--color-primary)]'
                      }
                    >
                      {formatTime(new Date(slot.start))}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {selectedSlot && (
          <div className="border-t border-[var(--color-border)] p-6">
            <div className="mb-3 rounded-[var(--radius)] bg-[var(--color-muted)] p-3 text-sm">
              <span className="font-semibold">Selected:</span>{' '}
              {new Date(selectedSlot.start).toLocaleString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Your name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Notes (optional)"
                  value={form.notes}
                  onChange={(v) => setForm({ ...form, notes: v })}
                  multiline
                />
              </div>
            </div>

            {/* Honeypot */}
            <input
              type="text"
              tabIndex={-1}
              aria-hidden
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px' }}
            />

            {error && (
              <div className="mt-3 rounded-[var(--radius)] bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
                {error}
              </div>
            )}

            <button
              disabled={!canSubmit || pending}
              onClick={handleBook}
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              <CalendarCheck className="h-4 w-4" />
              {pending ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type,
  required,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  multiline?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
        {label}
        {required && <span className="text-[var(--color-destructive)]"> *</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      ) : (
        <input
          type={type ?? 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      )}
    </label>
  )
}

function Confirmation({
  appointmentType,
  startIso,
}: {
  appointmentType: AppointmentType
  startIso: string
}) {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + appointmentType.duration_minutes * 60 * 1000)

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const title = encodeURIComponent(appointmentType.name)
  const details = encodeURIComponent(appointmentType.description ?? '')
  const location = encodeURIComponent(appointmentType.location ?? '')

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${title}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${details}&location=${location}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
        <CalendarCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">
        You&apos;re booked!
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        A confirmation email is on its way to you.
      </p>

      <div className="mt-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-left">
        <div className="text-sm font-semibold text-[var(--color-foreground)]">
          {appointmentType.name}
        </div>
        <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {start.toLocaleString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          ({appointmentType.duration_minutes} min)
        </div>
        {appointmentType.location && (
          <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {appointmentType.location}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Add to Google Calendar
        </a>
        <a
          href={outlookUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Add to Outlook
        </a>
        <a
          href={`/api/appointments/ics?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(end.toISOString())}&title=${title}&location=${location}`}
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Download .ics
        </a>
      </div>
    </div>
  )
}
