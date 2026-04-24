'use client'

// @anchor: cca.compliance.incident-create-dialog

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createIncident } from '@/lib/actions/compliance/incidents'
import { Plus } from 'lucide-react'

export type ClassroomOpt = { id: string; name: string }

export function IncidentCreateDialog({ classrooms }: { classrooms: ClassroomOpt[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    incident_date: new Date().toISOString().slice(0, 10),
    incident_time: new Date().toTimeString().slice(0, 5),
    incident_type: 'injury' as
      | 'injury'
      | 'accident'
      | 'allegation'
      | 'behavior'
      | 'medical'
      | 'property'
      | 'other',
    severity: 'minor' as 'minor' | 'moderate' | 'serious' | 'critical',
    classroom_id: '',
    title: '',
    description: '',
    injury_description: '',
    treatment_provided: '',
    parents_notified: false,
    medical_followup_required: false,
    state_report_required: false,
  })

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createIncident({
        ...form,
        classroom_id: form.classroom_id || null,
        injury_description: form.injury_description || null,
        treatment_provided: form.treatment_provided || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to create incident')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New Incident
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title="New Incident Report"
          description="Document the incident accurately. This record is immutable once closed."
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setOpen(false)} />
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input
                  type="date"
                  required
                  value={form.incident_date}
                  onChange={(e) => onChange('incident_date', e.target.value)}
                />
              </Field>
              <Field label="Time">
                <Input
                  type="time"
                  value={form.incident_time}
                  onChange={(e) => onChange('incident_time', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select
                  value={form.incident_type}
                  onChange={(e) =>
                    onChange('incident_type', e.target.value as typeof form.incident_type)
                  }
                >
                  <option value="injury">Injury</option>
                  <option value="accident">Accident</option>
                  <option value="allegation">Allegation</option>
                  <option value="behavior">Behavior</option>
                  <option value="medical">Medical</option>
                  <option value="property">Property</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Severity">
                <Select
                  value={form.severity}
                  onChange={(e) => onChange('severity', e.target.value as typeof form.severity)}
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="serious">Serious</option>
                  <option value="critical">Critical</option>
                </Select>
              </Field>
            </div>

            <Field label="Classroom">
              <Select
                value={form.classroom_id}
                onChange={(e) => onChange('classroom_id', e.target.value)}
              >
                <option value="">— none —</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title">
              <Input
                required
                value={form.title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="Brief summary (e.g. 'Student fell on playground')"
              />
            </Field>

            <Field label="Description">
              <Textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="What happened, who was involved, where"
              />
            </Field>

            <Field label="Injury description (if any)">
              <Textarea
                rows={2}
                value={form.injury_description}
                onChange={(e) => onChange('injury_description', e.target.value)}
              />
            </Field>

            <Field label="Treatment provided">
              <Textarea
                rows={2}
                value={form.treatment_provided}
                onChange={(e) => onChange('treatment_provided', e.target.value)}
              />
            </Field>

            <div
              className="space-y-2 rounded-lg p-3"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              <CheckboxRow
                label="Parents notified"
                checked={form.parents_notified}
                onChange={(v) => onChange('parents_notified', v)}
              />
              <CheckboxRow
                label="Medical follow-up required"
                checked={form.medical_followup_required}
                onChange={(v) => onChange('medical_followup_required', v)}
              />
              <CheckboxRow
                label="State report required"
                checked={form.state_report_required}
                onChange={(v) => onChange('state_report_required', v)}
              />
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
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={pending}>
                Create Incident
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  )
}
