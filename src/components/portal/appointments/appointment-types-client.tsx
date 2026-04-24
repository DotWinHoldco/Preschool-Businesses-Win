'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Archive,
  Copy,
  Check,
  Clock,
  MapPin,
  Video,
  Phone,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react'
import {
  createAppointmentType,
  updateAppointmentType,
  deleteAppointmentType,
} from '@/lib/actions/appointments/appointment-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentType {
  id: string
  name: string
  slug: string
  description: string | null
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  color: string | null
  location: string | null
  location_type: string
  virtual_meeting_url: string | null
  booking_window_days: number
  min_notice_hours: number
  max_per_day: number | null
  max_per_slot: number
  assigned_staff: string[]
  round_robin: boolean
  require_confirmation: boolean
  auto_confirm: boolean
  confirmation_message: string | null
  reminder_hours: number[]
  linked_pipeline_stage: string | null
  price_cents: number | null
  is_active: boolean
}

interface StaffMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: string
}

interface AppointmentTypesClientProps {
  appointmentTypes: AppointmentType[]
  staff: StaffMember[]
  tenantSlug: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_SWATCHES = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#84cc16',
]

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

const REMINDER_PRESETS = [
  { label: '24h', value: 24 },
  { label: '4h', value: 4 },
  { label: '1h', value: 1 },
]

const LOCATION_TYPE_OPTIONS = [
  { value: 'in_person', label: 'In Person', icon: MapPin },
  { value: 'virtual', label: 'Virtual', icon: Video },
  { value: 'phone', label: 'Phone', icon: Phone },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

function parsePriceToCents(dollars: string): number | null {
  const num = parseFloat(dollars)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

interface FormState {
  name: string
  slug: string
  description: string
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  booking_window_days: number
  min_notice_hours: number
  max_per_day: string
  max_per_slot: number
  location_type: string
  location: string
  virtual_meeting_url: string
  is_paid: boolean
  price_dollars: string
  color: string
  assigned_staff: string[]
  round_robin: boolean
  require_confirmation: boolean
  auto_confirm: boolean
  confirmation_message: string
  reminder_hours: number[]
  linked_pipeline_stage: string
  is_active: boolean
}

function defaultFormState(): FormState {
  return {
    name: '',
    slug: '',
    description: '',
    duration_minutes: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    booking_window_days: 30,
    min_notice_hours: 24,
    max_per_day: '',
    max_per_slot: 1,
    location_type: 'in_person',
    location: '',
    virtual_meeting_url: '',
    is_paid: false,
    price_dollars: '',
    color: '#3b82f6',
    assigned_staff: [],
    round_robin: false,
    require_confirmation: false,
    auto_confirm: true,
    confirmation_message: '',
    reminder_hours: [24, 1],
    linked_pipeline_stage: '',
    is_active: true,
  }
}

function formStateFromType(t: AppointmentType): FormState {
  return {
    name: t.name,
    slug: t.slug,
    description: t.description ?? '',
    duration_minutes: t.duration_minutes,
    buffer_before_minutes: t.buffer_before_minutes,
    buffer_after_minutes: t.buffer_after_minutes,
    booking_window_days: t.booking_window_days,
    min_notice_hours: t.min_notice_hours,
    max_per_day: t.max_per_day != null ? String(t.max_per_day) : '',
    max_per_slot: t.max_per_slot,
    location_type: t.location_type,
    location: t.location ?? '',
    virtual_meeting_url: t.virtual_meeting_url ?? '',
    is_paid: t.price_cents != null && t.price_cents > 0,
    price_dollars: t.price_cents != null && t.price_cents > 0 ? formatPrice(t.price_cents) : '',
    color: t.color ?? '#3b82f6',
    assigned_staff: [...t.assigned_staff],
    round_robin: t.round_robin,
    require_confirmation: t.require_confirmation,
    auto_confirm: t.auto_confirm,
    confirmation_message: t.confirmation_message ?? '',
    reminder_hours: [...t.reminder_hours],
    linked_pipeline_stage: t.linked_pipeline_stage ?? '',
    is_active: t.is_active,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppointmentTypesClient({
  appointmentTypes,
  staff,
  tenantSlug,
}: AppointmentTypesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Target records
  const [editingType, setEditingType] = useState<AppointmentType | null>(null)
  const [deletingType, setDeletingType] = useState<AppointmentType | null>(null)

  // Error
  const [error, setError] = useState<string | null>(null)

  // Filter
  const [showInactive, setShowInactive] = useState(false)

  // Clipboard feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState<FormState>(defaultFormState)

  // Whether the user has manually touched the slug field
  const [slugTouched, setSlugTouched] = useState(false)

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function updateForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function openCreateDialog() {
    setForm(defaultFormState())
    setSlugTouched(false)
    setError(null)
    setCreateOpen(true)
  }

  function openEditDialog(t: AppointmentType) {
    setEditingType(t)
    setForm(formStateFromType(t))
    setSlugTouched(true) // don't auto-generate slug on edit
    setError(null)
    setEditOpen(true)
  }

  function openDeleteDialog(t: AppointmentType) {
    setDeletingType(t)
    setDeleteOpen(true)
  }

  function handleNameChange(name: string) {
    updateForm({ name })
    if (!slugTouched) {
      updateForm({ name, slug: slugify(name) })
    }
  }

  async function copyBookingLink(slug: string) {
    const url = `/${tenantSlug}/book/${slug}`
    try {
      await navigator.clipboard.writeText(window.location.origin + url)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      // fallback — ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Build payload from form state
  // ---------------------------------------------------------------------------

  function buildPayload() {
    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      duration_minutes: form.duration_minutes,
      buffer_before_minutes: form.buffer_before_minutes,
      buffer_after_minutes: form.buffer_after_minutes,
      booking_window_days: form.booking_window_days,
      min_notice_hours: form.min_notice_hours,
      max_per_day: form.max_per_day ? parseInt(form.max_per_day, 10) : null,
      max_per_slot: form.max_per_slot,
      location_type: form.location_type as 'in_person' | 'virtual' | 'phone',
      location: form.location.trim() || undefined,
      virtual_meeting_url: form.virtual_meeting_url.trim() || undefined,
      price_cents: form.is_paid ? parsePriceToCents(form.price_dollars) : null,
      color: form.color || undefined,
      assigned_staff: form.assigned_staff,
      round_robin: form.round_robin,
      require_confirmation: form.require_confirmation,
      auto_confirm: form.auto_confirm,
      confirmation_message: form.confirmation_message.trim() || undefined,
      reminder_hours: form.reminder_hours,
      linked_pipeline_stage: form.linked_pipeline_stage.trim() || undefined,
      is_active: form.is_active,
    }
  }

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------

  function handleCreate() {
    if (!form.name.trim() || !form.slug.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await createAppointmentType(buildPayload())
      if (!result.ok) {
        setError(result.error ?? 'Failed to create appointment type')
        return
      }
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleEdit() {
    if (!editingType || !form.name.trim() || !form.slug.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await updateAppointmentType({
        id: editingType!.id,
        ...buildPayload(),
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed to update appointment type')
        return
      }
      setEditOpen(false)
      setEditingType(null)
      router.refresh()
    })
  }

  function handleDeactivate() {
    if (!deletingType) return

    startTransition(async () => {
      const result = await deleteAppointmentType(deletingType!.id)
      if (!result.ok) {
        setError(result.error ?? 'Failed to deactivate appointment type')
        return
      }
      setDeleteOpen(false)
      setDeletingType(null)
      router.refresh()
    })
  }

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

  const visibleTypes = showInactive ? appointmentTypes : appointmentTypes.filter((t) => t.is_active)

  // ---------------------------------------------------------------------------
  // Location type icon
  // ---------------------------------------------------------------------------

  function LocationIcon({ locationType }: { locationType: string }) {
    const opt = LOCATION_TYPE_OPTIONS.find((o) => o.value === locationType)
    if (!opt) return null
    const Icon = opt.icon
    return <Icon size={14} />
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>

        <Button size="sm" onClick={openCreateDialog}>
          <Plus size={16} />
          New Appointment Type
        </Button>
      </div>

      {/* Card list */}
      {visibleTypes.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
          <Clock
            className="mx-auto mb-2"
            size={32}
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No appointment types yet. Click &ldquo;+ New Appointment Type&rdquo; to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTypes.map((t) => (
            <div
              key={t.id}
              className="relative rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
            >
              {/* Color accent top bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: t.color ?? '#3b82f6' }} />

              <div className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                      {t.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.is_active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    <Clock size={11} />
                    {t.duration_minutes} min
                  </span>

                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    {t.price_cents != null && t.price_cents > 0 ? (
                      <>
                        <DollarSign size={11} />${formatPrice(t.price_cents)}
                      </>
                    ) : (
                      'Free'
                    )}
                  </span>

                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    <LocationIcon locationType={t.location_type} />
                    {LOCATION_TYPE_OPTIONS.find((o) => o.value === t.location_type)?.label ??
                      t.location_type}
                  </span>

                  {t.assigned_staff.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--color-muted)',
                        color: 'var(--color-foreground)',
                      }}
                    >
                      <Users size={11} />
                      {t.assigned_staff.length} staff
                    </span>
                  )}
                </div>

                {/* Description preview */}
                {t.description && (
                  <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                    {t.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-[var(--color-border)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(t)}
                    className="h-8 min-h-0 px-2"
                  >
                    <Pencil size={14} />
                    <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Edit</span>
                  </Button>

                  {t.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(t)}
                      className="h-8 min-h-0 px-2 text-[var(--color-destructive)]"
                    >
                      <Archive size={14} />
                      <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Deactivate</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyBookingLink(t.slug)}
                    className="h-8 min-h-0 px-2 ml-auto"
                  >
                    {copiedSlug === t.slug ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-xs text-green-600 ml-1">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Copy Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* Create Dialog                                                      */}
      {/* ================================================================= */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogOverlay onClick={() => setCreateOpen(false)} />
        <DialogContent
          title="New Appointment Type"
          description="Create a new type of appointment that parents can book."
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setCreateOpen(false)} />
          <AppointmentTypeForm
            form={form}
            updateForm={updateForm}
            onNameChange={handleNameChange}
            slugTouched={slugTouched}
            onSlugTouch={() => setSlugTouched(true)}
            staff={staff}
            error={error}
            isPending={isPending}
            onCancel={() => setCreateOpen(false)}
            onSubmit={handleCreate}
            submitLabel="Create Appointment Type"
          />
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Edit Dialog                                                        */}
      {/* ================================================================= */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogOverlay onClick={() => setEditOpen(false)} />
        <DialogContent
          title="Edit Appointment Type"
          description={editingType ? `Editing: ${editingType.name}` : ''}
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setEditOpen(false)} />
          <AppointmentTypeForm
            form={form}
            updateForm={updateForm}
            onNameChange={handleNameChange}
            slugTouched={slugTouched}
            onSlugTouch={() => setSlugTouched(true)}
            staff={staff}
            error={error}
            isPending={isPending}
            onCancel={() => {
              setEditOpen(false)
              setEditingType(null)
            }}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Delete / Deactivate Dialog                                         */}
      {/* ================================================================= */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogOverlay onClick={() => setDeleteOpen(false)} />
        <DialogContent
          title="Deactivate Appointment Type"
          description="This will prevent new bookings for this appointment type."
        >
          <DialogClose onClick={() => setDeleteOpen(false)} />
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}
            >
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">
                  This will deactivate &ldquo;{deletingType?.name}&rdquo;.
                </p>
                <p className="mt-1 opacity-90">
                  Existing bookings will remain but new bookings will be prevented.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteOpen(false)
                  setDeletingType(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeactivate}
                loading={isPending}
                className="bg-[var(--color-destructive)] text-white hover:opacity-90"
              >
                <Archive size={12} className="mr-1" />
                Deactivate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared form component used by both Create and Edit dialogs
// ---------------------------------------------------------------------------

interface AppointmentTypeFormProps {
  form: FormState
  updateForm: (patch: Partial<FormState>) => void
  onNameChange: (name: string) => void
  slugTouched: boolean
  onSlugTouch: () => void
  staff: StaffMember[]
  error: string | null
  isPending: boolean
  onCancel: () => void
  onSubmit: () => void
  submitLabel: string
}

function AppointmentTypeForm({
  form,
  updateForm,
  onNameChange,
  slugTouched,
  onSlugTouch,
  staff,
  error,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: AppointmentTypeFormProps) {
  return (
    <div className="space-y-5">
      {/* ─── Basic Info ─── */}
      <FormSection title="Basic Info">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="at-name" className="text-sm font-medium text-[var(--color-foreground)]">
            Name <span className="text-[var(--color-destructive)]">*</span>
          </label>
          <Input
            id="at-name"
            inputSize="sm"
            placeholder="e.g. School Tour & Interview"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="at-slug" className="text-sm font-medium text-[var(--color-foreground)]">
            Slug <span className="text-[var(--color-destructive)]">*</span>
          </label>
          <Input
            id="at-slug"
            inputSize="sm"
            placeholder="school-tour"
            value={form.slug}
            onChange={(e) => {
              onSlugTouch()
              updateForm({ slug: e.target.value })
            }}
            required
          />
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            URL path for public booking page. Auto-generated from name.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="at-description"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Description
          </label>
          <Textarea
            id="at-description"
            placeholder="Brief description shown to parents when booking..."
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            className="min-h-[80px]"
          />
        </div>
      </FormSection>

      {/* ─── Scheduling ─── */}
      <FormSection title="Scheduling">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-duration"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Duration
            </label>
            <Select
              id="at-duration"
              value={String(form.duration_minutes)}
              onChange={(e) => updateForm({ duration_minutes: parseInt(e.target.value, 10) })}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-buffer-before"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Buffer Before (min)
            </label>
            <Input
              id="at-buffer-before"
              inputSize="sm"
              type="number"
              min={0}
              value={form.buffer_before_minutes}
              onChange={(e) =>
                updateForm({ buffer_before_minutes: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-buffer-after"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Buffer After (min)
            </label>
            <Input
              id="at-buffer-after"
              inputSize="sm"
              type="number"
              min={0}
              value={form.buffer_after_minutes}
              onChange={(e) =>
                updateForm({ buffer_after_minutes: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-booking-window"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Booking Window (days)
            </label>
            <Input
              id="at-booking-window"
              inputSize="sm"
              type="number"
              min={1}
              value={form.booking_window_days}
              onChange={(e) =>
                updateForm({ booking_window_days: parseInt(e.target.value, 10) || 30 })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-min-notice"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Min Notice (hours)
            </label>
            <Input
              id="at-min-notice"
              inputSize="sm"
              type="number"
              min={0}
              value={form.min_notice_hours}
              onChange={(e) => updateForm({ min_notice_hours: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-max-per-day"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Max Per Day
            </label>
            <Input
              id="at-max-per-day"
              inputSize="sm"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.max_per_day}
              onChange={(e) => updateForm({ max_per_day: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-max-per-slot"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Max Per Slot
            </label>
            <Input
              id="at-max-per-slot"
              inputSize="sm"
              type="number"
              min={1}
              value={form.max_per_slot}
              onChange={(e) => updateForm({ max_per_slot: parseInt(e.target.value, 10) || 1 })}
            />
          </div>
        </div>
      </FormSection>

      {/* ─── Location ─── */}
      <FormSection title="Location">
        <div className="flex flex-wrap gap-2">
          {LOCATION_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = form.location_type === opt.value
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors"
                style={{
                  borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
                  color: selected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                }}
              >
                <input
                  type="radio"
                  name="location_type"
                  value={opt.value}
                  checked={selected}
                  onChange={() => updateForm({ location_type: opt.value })}
                  className="sr-only"
                />
                <Icon size={16} />
                {opt.label}
              </label>
            )
          })}
        </div>

        {(form.location_type === 'in_person' || form.location_type === 'phone') && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-location"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              {form.location_type === 'phone' ? 'Phone Number' : 'Location Address'}
            </label>
            <Input
              id="at-location"
              inputSize="sm"
              placeholder={
                form.location_type === 'phone' ? '(555) 123-4567' : '123 Main Street, Suite 100'
              }
              value={form.location}
              onChange={(e) => updateForm({ location: e.target.value })}
            />
          </div>
        )}

        {form.location_type === 'virtual' && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-meeting-url"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Virtual Meeting URL
            </label>
            <Input
              id="at-meeting-url"
              inputSize="sm"
              placeholder="https://zoom.us/j/..."
              value={form.virtual_meeting_url}
              onChange={(e) => updateForm({ virtual_meeting_url: e.target.value })}
            />
          </div>
        )}
      </FormSection>

      {/* ─── Pricing ─── */}
      <FormSection title="Pricing">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={form.is_paid}
            onChange={(e) => updateForm({ is_paid: e.target.checked })}
            className="rounded"
          />
          Paid appointment
        </label>

        {form.is_paid && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-price"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Price ($)
            </label>
            <Input
              id="at-price"
              inputSize="sm"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.price_dollars}
              onChange={(e) => updateForm({ price_dollars: e.target.value })}
            />
          </div>
        )}
      </FormSection>

      {/* ─── Color ─── */}
      <FormSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateForm({ color })}
              className="relative h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: color,
                borderColor: form.color === color ? 'var(--color-foreground)' : 'transparent',
              }}
              aria-label={`Select color ${color}`}
            >
              {form.color === color && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </FormSection>

      {/* ─── Staff Assignment ─── */}
      <FormSection title="Staff Assignment">
        {staff.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            No active staff members found.
          </p>
        ) : (
          <>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {staff.map((s) => {
                const isAssigned = form.assigned_staff.includes(s.user_id)
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--color-muted)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => {
                        const next = isAssigned
                          ? form.assigned_staff.filter((id) => id !== s.user_id)
                          : [...form.assigned_staff, s.user_id]
                        updateForm({ assigned_staff: next })
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-[var(--color-foreground)]">
                      {s.first_name} {s.last_name}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] ml-auto">
                      {s.role.replace(/_/g, ' ')}
                    </span>
                  </label>
                )
              })}
            </div>

            {form.assigned_staff.length >= 2 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-foreground)] mt-2">
                <input
                  type="checkbox"
                  checked={form.round_robin}
                  onChange={(e) => updateForm({ round_robin: e.target.checked })}
                  className="rounded"
                />
                Round Robin (distribute bookings evenly among assigned staff)
              </label>
            )}
          </>
        )}
      </FormSection>

      {/* ─── Confirmation ─── */}
      <FormSection title="Confirmation">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={form.require_confirmation}
            onChange={(e) => updateForm({ require_confirmation: e.target.checked })}
            className="rounded"
          />
          Require Confirmation
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={form.auto_confirm}
            onChange={(e) => updateForm({ auto_confirm: e.target.checked })}
            className="rounded"
          />
          Auto Confirm
        </label>

        {form.require_confirmation && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="at-confirmation-msg"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              Confirmation Message
            </label>
            <Textarea
              id="at-confirmation-msg"
              placeholder="Message shown to parents after booking..."
              value={form.confirmation_message}
              onChange={(e) => updateForm({ confirmation_message: e.target.value })}
              className="min-h-[60px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-foreground)]">
            Reminder Hours
          </label>
          <div className="flex flex-wrap gap-2">
            {REMINDER_PRESETS.map((preset) => {
              const active = form.reminder_hours.includes(preset.value)
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? form.reminder_hours.filter((h) => h !== preset.value)
                      : [...form.reminder_hours, preset.value]
                    updateForm({ reminder_hours: next })
                  }}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors border"
                  style={{
                    backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            Select when to send booking reminders before the appointment.
          </p>
        </div>
      </FormSection>

      {/* ─── Advanced ─── */}
      <FormSection title="Advanced">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="at-pipeline-stage"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Linked Pipeline Stage
          </label>
          <Input
            id="at-pipeline-stage"
            inputSize="sm"
            placeholder="e.g. interview_scheduled"
            value={form.linked_pipeline_stage}
            onChange={(e) => updateForm({ linked_pipeline_stage: e.target.value })}
          />
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            Automatically move applicants to this pipeline stage when they book.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateForm({ is_active: e.target.checked })}
            className="rounded"
          />
          Active (visible on public booking page)
        </label>
      </FormSection>

      {/* Error */}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}

      {/* Footer buttons */}
      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-[var(--color-card)] pb-1">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          loading={isPending}
          disabled={!form.name.trim() || !form.slug.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form section wrapper
// ---------------------------------------------------------------------------

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {title}
      </h3>
      {children}
    </div>
  )
}
