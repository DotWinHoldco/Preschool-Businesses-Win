'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Settings,
  Clock,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Search,
  CalendarCheck,
  CalendarX,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
  updateAppointmentNotes,
} from '@/lib/actions/appointments/manage-appointment'

interface Appointment {
  id: string
  appointment_type_id: string
  type_name: string
  type_color: string | null
  type_slug: string
  duration_minutes: number
  booked_by_name: string
  booked_by_email: string
  booked_by_phone: string | null
  start_at: string
  end_at: string
  timezone: string
  staff_user_id: string | null
  status: string
  notes: string | null
  staff_notes: string | null
  cancellation_reason: string | null
  enrollment_application_id: string | null
  price_cents: number | null
  confirmation_token: string | null
  rescheduled_from_id: string | null
  created_at: string
}

interface Props {
  appointments: Appointment[]
  staffMap: Record<string, string>
  types: { id: string; name: string; color: string | null; slug: string }[]
  staff: { id: string; user_id: string; name: string }[]
  stats: { today: number; pending: number; thisWeek: number; completionRate: number }
}

type StatusFilter =
  | 'all'
  | 'upcoming'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  confirmed: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  completed: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  cancelled_by_parent: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
  cancelled_by_staff: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
  rescheduled: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]',
  no_show: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function formatPrice(cents: number | null) {
  if (cents == null || cents === 0) return null
  return `$${(cents / 100).toFixed(2)}`
}

export function AppointmentsDashboardClient({
  appointments,
  staffMap,
  types,
  staff,
  stats,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelledBy, setCancelledBy] = useState<'parent' | 'staff'>('staff')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = appointments.filter((a) => {
    if (statusFilter === 'upcoming') {
      if (new Date(a.start_at) < new Date()) return false
      if (
        a.status === 'cancelled_by_parent' ||
        a.status === 'cancelled_by_staff' ||
        a.status === 'rescheduled'
      )
        return false
    } else if (statusFilter === 'pending') {
      if (a.status !== 'pending') return false
    } else if (statusFilter === 'confirmed') {
      if (a.status !== 'confirmed') return false
    } else if (statusFilter === 'completed') {
      if (a.status !== 'completed') return false
    } else if (statusFilter === 'cancelled') {
      if (a.status !== 'cancelled_by_parent' && a.status !== 'cancelled_by_staff') return false
    } else if (statusFilter === 'no_show') {
      if (a.status !== 'no_show') return false
    }
    if (typeFilter && a.appointment_type_id !== typeFilter) return false
    if (staffFilter && a.staff_user_id !== staffFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !a.booked_by_name.toLowerCase().includes(q) &&
        !a.booked_by_email.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  function handleConfirm(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await confirmAppointment(id)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Failed to confirm')
    })
  }

  function handleComplete(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await completeAppointment(id)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Failed to complete')
    })
  }

  function handleNoShow(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await markNoShow(id)
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Failed to mark no-show')
    })
  }

  function openCancelDialog(appt: Appointment) {
    setCancellingAppt(appt)
    setCancelReason('')
    setCancelledBy('staff')
    setCancelOpen(true)
  }

  function handleCancel() {
    if (!cancellingAppt) return
    setError(null)
    startTransition(async () => {
      const res = await cancelAppointment({
        id: cancellingAppt.id,
        reason: cancelReason || undefined,
        cancelled_by: cancelledBy,
      })
      if (res.ok) {
        setCancelOpen(false)
        router.refresh()
      } else {
        setError(res.error ?? 'Failed to cancel')
      }
    })
  }

  function handleSaveNotes(id: string) {
    startTransition(async () => {
      const res = await updateAppointmentNotes({ id, staff_notes: notesValue })
      if (res.ok) {
        setEditingNotes(null)
        router.refresh()
      }
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)))
    }
  }

  function handleBatchConfirm() {
    const pendingIds = filtered
      .filter((a) => selectedIds.has(a.id) && a.status === 'pending')
      .map((a) => a.id)
    if (pendingIds.length === 0) return
    setError(null)
    startTransition(async () => {
      const results = await Promise.all(pendingIds.map((id) => confirmAppointment(id)))
      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) setError(`${failed.length} of ${pendingIds.length} failed to confirm`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  function handleBatchCancel() {
    const cancellableIds = filtered
      .filter((a) => selectedIds.has(a.id) && (a.status === 'pending' || a.status === 'confirmed'))
      .map((a) => a.id)
    if (cancellableIds.length === 0) return
    setError(null)
    startTransition(async () => {
      const results = await Promise.all(
        cancellableIds.map((id) => cancelAppointment({ id, cancelled_by: 'staff' })),
      )
      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0)
        setError(`${failed.length} of ${cancellableIds.length} failed to cancel`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  function handleBatchComplete() {
    const completableIds = filtered
      .filter((a) => selectedIds.has(a.id) && a.status === 'confirmed' && isPast(a.start_at))
      .map((a) => a.id)
    if (completableIds.length === 0) return
    setError(null)
    startTransition(async () => {
      const results = await Promise.all(completableIds.map((id) => completeAppointment(id)))
      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0)
        setError(`${failed.length} of ${completableIds.length} failed to complete`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  const selectedPendingCount = filtered.filter(
    (a) => selectedIds.has(a.id) && a.status === 'pending',
  ).length
  const selectedCancellableCount = filtered.filter(
    (a) => selectedIds.has(a.id) && (a.status === 'pending' || a.status === 'confirmed'),
  ).length
  const selectedCompletableCount = filtered.filter(
    (a) => selectedIds.has(a.id) && a.status === 'confirmed' && isPast(a.start_at),
  ).length

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'pending', label: `Pending (${stats.pending})` },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'no_show', label: 'No-Show' },
  ]

  const isPast = (iso: string) => new Date(iso) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Appointments</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage bookings, confirm appointments, and track attendance
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/admin/settings/appointments"
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
          >
            <Settings className="h-4 w-4" />
            Types
          </Link>
          <Link
            href="/portal/admin/appointments/availability"
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
          >
            <Clock className="h-4 w-4" />
            Availability
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: stats.today, icon: CalendarCheck },
          { label: 'Pending Confirmation', value: stats.pending, icon: AlertTriangle },
          { label: 'This Week', value: stats.thisWeek, icon: Calendar },
          { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: CheckCircle },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              <span className="text-xs text-[var(--color-muted-foreground)]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-foreground)]">{stat.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-[var(--radius)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm"
          >
            <option value="">All Staff</option>
            {staff.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-2">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            {selectedPendingCount > 0 && (
              <Button size="sm" onClick={handleBatchConfirm} loading={isPending}>
                <Check className="h-3 w-3 mr-1" /> Confirm {selectedPendingCount}
              </Button>
            )}
            {selectedCompletableCount > 0 && (
              <Button size="sm" onClick={handleBatchComplete} loading={isPending}>
                <CheckCircle className="h-3 w-3 mr-1" /> Complete {selectedCompletableCount}
              </Button>
            )}
            {selectedCancellableCount > 0 && (
              <Button
                size="sm"
                onClick={handleBatchCancel}
                loading={isPending}
                className="bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90"
              >
                <CalendarX className="h-3 w-3 mr-1" /> Cancel {selectedCancellableCount}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No appointments match the current filters.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {/* Select All header */}
            <li className="flex items-center gap-3 px-4 py-2 bg-[var(--color-muted)]/30 text-xs text-[var(--color-muted-foreground)]">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="accent-[var(--color-primary)]"
              />
              <span>Select All ({filtered.length})</span>
            </li>
            {filtered.map((appt) => {
              const expanded = expandedId === appt.id
              return (
                <li key={appt.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-muted)]/50 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : appt.id)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(appt.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelect(appt.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-[var(--color-primary)]"
                    />
                    {/* Color dot */}
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: appt.type_color ?? 'var(--color-muted-foreground)',
                      }}
                    />

                    {/* Expand icon */}
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    )}

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                        {appt.booked_by_name}
                      </div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {appt.type_name} · {formatDateTime(appt.start_at)}
                        {appt.staff_user_id && staffMap[appt.staff_user_id]
                          ? ` · ${staffMap[appt.staff_user_id]}`
                          : ''}
                      </div>
                    </div>

                    {/* Price */}
                    {formatPrice(appt.price_cents) && (
                      <span className="text-xs font-medium text-[var(--color-foreground)]">
                        {formatPrice(appt.price_cents)}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[appt.status] ?? ''}`}
                    >
                      {formatStatus(appt.status)}
                    </span>

                    {/* Actions dropdown */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <button className="p-1 rounded hover:bg-[var(--color-muted)]">
                            <MoreVertical className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {appt.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleConfirm(appt.id)}>
                              <Check className="h-4 w-4 mr-2" /> Confirm
                            </DropdownMenuItem>
                          )}
                          {(appt.status === 'pending' || appt.status === 'confirmed') && (
                            <DropdownMenuItem onClick={() => openCancelDialog(appt)}>
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </DropdownMenuItem>
                          )}
                          {appt.status === 'confirmed' && isPast(appt.start_at) && (
                            <>
                              <DropdownMenuItem onClick={() => handleComplete(appt.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleNoShow(appt.id)}>
                                <UserX className="h-4 w-4 mr-2" /> No Show
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="px-4 pb-4 pt-1 ml-10 space-y-3 border-t border-[var(--color-border)]/50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[var(--color-muted-foreground)]">Email:</span>{' '}
                          <span className="text-[var(--color-foreground)]">
                            {appt.booked_by_email}
                          </span>
                        </div>
                        {appt.booked_by_phone && (
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Phone:</span>{' '}
                            <span className="text-[var(--color-foreground)]">
                              {appt.booked_by_phone}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[var(--color-muted-foreground)]">Duration:</span>{' '}
                          <span className="text-[var(--color-foreground)]">
                            {appt.duration_minutes} min
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--color-muted-foreground)]">Booked:</span>{' '}
                          <span className="text-[var(--color-foreground)]">
                            {new Date(appt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {appt.confirmation_token && (
                          <div>
                            <span className="text-[var(--color-muted-foreground)]">Token:</span>{' '}
                            <span className="text-[var(--color-foreground)] font-mono text-[10px]">
                              {appt.confirmation_token.slice(0, 12)}...
                            </span>
                          </div>
                        )}
                      </div>

                      {appt.notes && (
                        <div className="text-xs">
                          <span className="text-[var(--color-muted-foreground)]">Notes:</span>{' '}
                          <span className="text-[var(--color-foreground)]">{appt.notes}</span>
                        </div>
                      )}

                      {appt.cancellation_reason && (
                        <div className="text-xs">
                          <span className="text-[var(--color-destructive)]">
                            Cancellation reason:
                          </span>{' '}
                          <span className="text-[var(--color-foreground)]">
                            {appt.cancellation_reason}
                          </span>
                        </div>
                      )}

                      {/* Staff notes - editable */}
                      <div className="text-xs">
                        <span className="text-[var(--color-muted-foreground)]">Staff Notes:</span>
                        {editingNotes === appt.id ? (
                          <div className="mt-1 flex gap-2">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs min-h-[60px]"
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(appt.id)}
                                loading={isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setEditingNotes(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span
                            className="ml-1 text-[var(--color-foreground)] cursor-pointer hover:underline"
                            onClick={() => {
                              setEditingNotes(appt.id)
                              setNotesValue(appt.staff_notes ?? '')
                            }}
                          >
                            {appt.staff_notes || 'Click to add...'}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {appt.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(appt.id)}
                            loading={isPending}
                          >
                            <Check className="h-3 w-3 mr-1" /> Confirm
                          </Button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openCancelDialog(appt)}
                          >
                            <CalendarX className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        )}
                        {appt.status === 'confirmed' && isPast(appt.start_at) && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleComplete(appt.id)}
                              loading={isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleNoShow(appt.id)}
                            >
                              <UserX className="h-3 w-3 mr-1" /> No Show
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogOverlay onClick={() => setCancelOpen(false)} />
        <DialogContent title="Cancel Appointment" description="This action cannot be undone.">
          <DialogClose onClick={() => setCancelOpen(false)} />
          {cancellingAppt && (
            <div className="space-y-4 pt-2">
              <div className="rounded-[var(--radius)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3 text-sm">
                Cancel <strong>{cancellingAppt.booked_by_name}</strong>&apos;s{' '}
                <strong>{cancellingAppt.type_name}</strong> on{' '}
                {formatDateTime(cancellingAppt.start_at)}?
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-foreground)] block mb-1">
                  Cancelled by
                </label>
                <div className="flex gap-3">
                  {(['staff', 'parent'] as const).map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cancelledBy"
                        value={opt}
                        checked={cancelledBy === opt}
                        onChange={() => setCancelledBy(opt)}
                        className="accent-[var(--color-primary)]"
                      />
                      {opt === 'staff' ? 'Staff' : 'Parent'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-foreground)] block mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why is this appointment being cancelled?"
                  className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)}>
                  Keep Appointment
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancel}
                  loading={isPending}
                  className="bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90"
                >
                  Cancel Appointment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
