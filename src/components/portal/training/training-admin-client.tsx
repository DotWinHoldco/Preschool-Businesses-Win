'use client'

// @anchor: cca.training.admin-client

import { useState, useMemo, useEffect, useTransition } from 'react'
import { Plus, Award, Pencil, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  createTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  verifyTrainingRecord,
} from '@/lib/actions/training/manage-records'
import {
  createTrainingRequirement,
  updateTrainingRequirement,
  deleteTrainingRequirement,
} from '@/lib/actions/training/manage-requirements'

interface Profile {
  id: string
  full_name: string
  role: string
}

interface TrainingRecord {
  id: string
  user_id: string
  training_name: string
  provider: string | null
  training_type: string | null
  topic_category: string | null
  hours: number
  completed_date: string | null
  certificate_path: string | null
  verified_by: string | null
  verified_at: string | null
  notes: string | null
}

interface TrainingRequirement {
  id: string
  title: string
  topic_category: string
  cadence: string
  required_hours: number
  required_for_roles: string[]
  description: string | null
}

const STAFF_ROLES = ['admin', 'director', 'lead_teacher', 'assistant_teacher', 'aide', 'front_desk']

const TRAINING_TYPES = [
  { value: 'in_person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'conference', label: 'Conference' },
  { value: 'self_study', label: 'Self-study' },
]

const TOPIC_CATEGORIES = [
  { value: 'health_safety', label: 'Health & safety' },
  { value: 'child_development', label: 'Child development' },
  { value: 'dfps_required', label: 'DFPS required' },
  { value: 'classroom_management', label: 'Classroom management' },
  { value: 'faith_integration', label: 'Faith integration' },
  { value: 'other', label: 'Other' },
]

const CADENCES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'annual', label: 'Annual' },
  { value: 'every_6_months', label: 'Every 6 months' },
  { value: 'every_3_months', label: 'Every 3 months' },
]

interface Props {
  records: TrainingRecord[]
  profiles: Profile[]
  requirements: TrainingRequirement[]
}

export function TrainingAdminClient({ records, profiles, requirements }: Props) {
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)

  const [reqDialogOpen, setReqDialogOpen] = useState(false)
  const [editingReq, setEditingReq] = useState<TrainingRequirement | null>(null)

  const nameMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.full_name])), [profiles])
  const staffProfiles = useMemo(
    () => profiles.filter((p) => p.role !== 'parent' && p.role !== 'applicant_parent'),
    [profiles],
  )

  const totalHours = records.reduce((s, r) => s + (r.hours ?? 0), 0)
  const uniqueStaff = new Set(records.map((r) => r.user_id)).size
  const categories = [...new Set(records.map((r) => r.topic_category).filter(Boolean))]

  const today = new Date()
  function isExpired(rec: TrainingRecord): boolean {
    if (!rec.completed_date) return false
    // Lookup whether a requirement exists for this topic with annual cadence
    const annualReq = requirements.find(
      (q) => q.topic_category === rec.topic_category && q.cadence === 'annual',
    )
    if (!annualReq) return false
    const completed = new Date(rec.completed_date)
    const expires = new Date(completed)
    expires.setFullYear(expires.getFullYear() + 1)
    return expires < today
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Staff Training Overview
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track certifications, expirations, and compliance across your team.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null)
            setRecordDialogOpen(true)
          }}
        >
          <Award size={16} />
          Record Training
        </Button>
      </div>

      {err && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            backgroundColor: 'var(--color-destructive)',
            color: 'var(--color-destructive-foreground)',
          }}
        >
          {err}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Records', value: records.length.toString() },
          { label: 'Total Hours', value: totalHours.toFixed(1) },
          { label: 'Staff Trained', value: uniqueStaff.toString() },
          { label: 'Categories', value: categories.length.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Training Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Staff', 'Training', 'Type', 'Hours', 'Completed', 'Verified', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                  >
                    No training records yet.
                  </td>
                </tr>
              )}
              {records.map((rec) => {
                const expired = isExpired(rec)
                return (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                      {nameMap.get(rec.user_id) ?? rec.user_id?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground)]">
                      <div className="flex items-center gap-2">
                        {rec.training_name}
                        {expired && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: 'var(--color-destructive)',
                              color: 'var(--color-destructive-foreground)',
                            }}
                          >
                            <AlertTriangle size={12} />
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {rec.training_type ?? rec.topic_category ?? '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--color-foreground)]">
                      {rec.hours ?? 0}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {rec.completed_date ? new Date(rec.completed_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {rec.verified_at ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                          Yes
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await verifyTrainingRecord({ id: rec.id })
                              if (!res.ok) setErr(res.error ?? 'Verify failed')
                            })
                          }
                          className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(rec)
                            setRecordDialogOpen(true)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (!confirm('Delete this training record?')) return
                            startTransition(async () => {
                              const res = await deleteTrainingRecord({ id: rec.id })
                              if (!res.ok) setErr(res.error ?? 'Delete failed')
                            })
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirements */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Training Requirements
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingReq(null)
              setReqDialogOpen(true)
            }}
          >
            <Plus size={14} />
            Add Requirement
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Title', 'Category', 'Cadence', 'Hours', 'Roles', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                  >
                    No requirements defined yet.
                  </td>
                </tr>
              )}
              {requirements.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                    {q.title}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {q.topic_category}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{q.cadence}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--color-foreground)]">
                    {q.required_hours}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {(q.required_for_roles ?? []).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReq(q)
                          setReqDialogOpen(true)
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          if (!confirm('Delete this requirement?')) return
                          startTransition(async () => {
                            const res = await deleteTrainingRequirement({ id: q.id })
                            if (!res.ok) setErr(res.error ?? 'Delete failed')
                          })
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record dialog */}
      <RecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        profiles={staffProfiles}
        initial={editingRecord}
        onSaved={() => {
          setRecordDialogOpen(false)
          setEditingRecord(null)
        }}
        onError={setErr}
      />

      {/* Requirement dialog */}
      <RequirementDialog
        open={reqDialogOpen}
        onOpenChange={setReqDialogOpen}
        initial={editingReq}
        onSaved={() => {
          setReqDialogOpen(false)
          setEditingReq(null)
        }}
        onError={setErr}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Record dialog
// ---------------------------------------------------------------------------

function RecordDialog({
  open,
  onOpenChange,
  profiles,
  initial,
  onSaved,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profiles: Profile[]
  initial: TrainingRecord | null
  onSaved: () => void
  onError: (err: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [userId, setUserId] = useState(initial?.user_id ?? '')
  const [trainingName, setTrainingName] = useState(initial?.training_name ?? '')
  const [provider, setProvider] = useState(initial?.provider ?? '')
  const [trainingType, setTrainingType] = useState(initial?.training_type ?? 'in_person')
  const [topicCategory, setTopicCategory] = useState(initial?.topic_category ?? 'health_safety')
  const [hours, setHours] = useState(String(initial?.hours ?? ''))
  const [completedDate, setCompletedDate] = useState(
    initial?.completed_date ?? new Date().toISOString().split('T')[0],
  )
  const [certPath, setCertPath] = useState(initial?.certificate_path ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  // Reset on initial change
  useEffect(() => {
    setUserId(initial?.user_id ?? '')
    setTrainingName(initial?.training_name ?? '')
    setProvider(initial?.provider ?? '')
    setTrainingType(initial?.training_type ?? 'in_person')
    setTopicCategory(initial?.topic_category ?? 'health_safety')
    setHours(String(initial?.hours ?? ''))
    setCompletedDate(initial?.completed_date ?? new Date().toISOString().split('T')[0])
    setCertPath(initial?.certificate_path ?? '')
    setNotes(initial?.notes ?? '')
  }, [initial])

  if (!open) return null

  const handleSave = () => {
    startTransition(async () => {
      const hoursNum = Number(hours)
      if (initial) {
        const res = await updateTrainingRecord({
          id: initial.id,
          training_name: trainingName,
          provider: provider || null,
          training_type: trainingType as never,
          topic_category: topicCategory as never,
          hours: hoursNum,
          completed_date: completedDate,
          certificate_path: certPath || null,
          notes: notes || null,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onSaved()
      } else {
        const res = await createTrainingRecord({
          user_id: userId,
          training_name: trainingName,
          provider: provider || null,
          training_type: trainingType as never,
          topic_category: topicCategory as never,
          hours: hoursNum,
          completed_date: completedDate,
          certificate_path: certPath || null,
          notes: notes || null,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onSaved()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title={initial ? 'Edit Training Record' : 'Record Training'}>
        <DialogClose onClick={() => onOpenChange(false)} />
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {!initial && (
            <Field label="Staff">
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Select staff...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Training name">
            <Input value={trainingName} onChange={(e) => setTrainingName(e.target.value)} />
          </Field>
          <Field label="Provider">
            <Input value={provider ?? ''} onChange={(e) => setProvider(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Training type">
              <Select value={trainingType ?? ''} onChange={(e) => setTrainingType(e.target.value)}>
                {TRAINING_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Topic category">
              <Select
                value={topicCategory ?? ''}
                onChange={(e) => setTopicCategory(e.target.value)}
              >
                {TOPIC_CATEGORIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours">
              <Input
                type="number"
                min={0}
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </Field>
            <Field label="Completed date">
              <Input
                type="date"
                value={completedDate ?? ''}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Certificate URL">
            <Input
              value={certPath ?? ''}
              onChange={(e) => setCertPath(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Notes">
            <Textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isPending}
              onClick={handleSave}
              disabled={isPending || !trainingName || !completedDate || (!initial && !userId)}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Requirement dialog
// ---------------------------------------------------------------------------

function RequirementDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: TrainingRequirement | null
  onSaved: () => void
  onError: (err: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState(initial?.topic_category ?? 'health_safety')
  const [cadence, setCadence] = useState(initial?.cadence ?? 'annual')
  const [hours, setHours] = useState(String(initial?.required_hours ?? ''))
  const [roles, setRoles] = useState<string[]>(initial?.required_for_roles ?? [])
  const [description, setDescription] = useState(initial?.description ?? '')

  useEffect(() => {
    setTitle(initial?.title ?? '')
    setCategory(initial?.topic_category ?? 'health_safety')
    setCadence(initial?.cadence ?? 'annual')
    setHours(String(initial?.required_hours ?? ''))
    setRoles(initial?.required_for_roles ?? [])
    setDescription(initial?.description ?? '')
  }, [initial])

  if (!open) return null

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const handleSave = () => {
    startTransition(async () => {
      const hoursNum = Number(hours) || 0
      if (initial) {
        const res = await updateTrainingRequirement({
          id: initial.id,
          title,
          topic_category: category as never,
          cadence: cadence as never,
          required_hours: hoursNum,
          required_for_roles: roles,
          description: description || null,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onSaved()
      } else {
        const res = await createTrainingRequirement({
          title,
          topic_category: category as never,
          cadence: cadence as never,
          required_hours: hoursNum,
          required_for_roles: roles,
          description: description || null,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onSaved()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title={initial ? 'Edit Requirement' : 'Add Requirement'}>
        <DialogClose onClick={() => onOpenChange(false)} />
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {TOPIC_CATEGORIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cadence">
              <Select value={cadence} onChange={(e) => setCadence(e.target.value)}>
                {CADENCES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Required hours">
            <Input
              type="number"
              min={0}
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
          <Field label="Required for roles">
            <div className="flex flex-wrap gap-2">
              {STAFF_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="rounded-full border px-3 py-1.5 text-sm"
                  style={{
                    borderColor: roles.includes(role)
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                    backgroundColor: roles.includes(role) ? 'var(--color-primary)' : 'transparent',
                    color: roles.includes(role)
                      ? 'var(--color-primary-foreground)'
                      : 'var(--color-foreground)',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Description">
            <Textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isPending}
              onClick={handleSave}
              disabled={isPending || !title}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
