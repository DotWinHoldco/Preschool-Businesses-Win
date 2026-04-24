'use client'

// @anchor: cca.leads.detail-actions

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Send, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import {
  updateLead,
  deleteLead,
  convertLeadToApplication,
  addLeadNote,
} from '@/lib/actions/leads/convert-and-notes'

export interface LeadData {
  id: string
  parent_first_name: string
  parent_last_name: string
  parent_email: string | null
  parent_phone: string | null
  child_name: string | null
  child_age_months: number | null
  program_interest: string | null
  priority: string
  status: string
  notes: string | null
}

const STATUSES = [
  'new',
  'contacted',
  'tour_scheduled',
  'tour_completed',
  'application_sent',
  'application_received',
  'enrolled',
  'lost',
] as const

const PRIORITIES = ['hot', 'warm', 'cold'] as const

export function LeadActions({ lead }: { lead: LeadData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    parent_first_name: lead.parent_first_name ?? '',
    parent_last_name: lead.parent_last_name ?? '',
    parent_email: lead.parent_email ?? '',
    parent_phone: lead.parent_phone ?? '',
    child_name: lead.child_name ?? '',
    child_age_months:
      lead.child_age_months !== null && lead.child_age_months !== undefined
        ? String(lead.child_age_months)
        : '',
    program_interest: lead.program_interest ?? '',
    priority: lead.priority,
    status: lead.status,
    notes: lead.notes ?? '',
  })

  // Note form
  const [note, setNote] = useState('')

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) => {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setError(r.error ?? 'Action failed')
      else onOk?.()
    })
  }

  const submitEdit = () =>
    run(
      () =>
        updateLead({
          id: lead.id,
          parent_first_name: form.parent_first_name,
          parent_last_name: form.parent_last_name,
          parent_email: form.parent_email || null,
          parent_phone: form.parent_phone || null,
          child_name: form.child_name || null,
          child_age_months: form.child_age_months ? Number(form.child_age_months) : null,
          program_interest: form.program_interest || null,
          priority: form.priority as 'hot' | 'warm' | 'cold',
          status: form.status as (typeof STATUSES)[number],
          notes: form.notes || null,
        }),
      () => setEditOpen(false),
    )

  const submitConvert = () =>
    run(async () => {
      const r = await convertLeadToApplication({ lead_id: lead.id })
      if (r.ok && r.id) {
        router.push(`/portal/admin/enrollment/${r.id}`)
      }
      return r
    })

  const submitDelete = () => {
    if (!confirm('Delete this lead permanently?')) return
    run(
      () => deleteLead({ id: lead.id }),
      () => router.push('/portal/admin/leads'),
    )
  }

  const submitNote = () => {
    if (!note.trim()) {
      setError('Note body is required')
      return
    }
    run(
      () => addLeadNote({ lead_id: lead.id, note_body: note.trim() }),
      () => setNote(''),
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[var(--radius)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={submitConvert} loading={pending}>
          <Send className="h-3.5 w-3.5 mr-1" />
          Convert to application
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit lead
        </Button>
        <Button size="sm" variant="ghost" onClick={submitDelete} loading={pending}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>

      {/* Add note */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          <span className="text-sm font-semibold text-[var(--color-foreground)]">Add note</span>
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Left voicemail, parent asked about pricing..."
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submitNote} loading={pending}>
            Save note
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogOverlay onClick={() => setEditOpen(false)} />
        <DialogContent title="Edit lead" className="max-w-xl">
          <DialogClose onClick={() => setEditOpen(false)} />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">First name</label>
                <Input
                  value={form.parent_first_name}
                  onChange={(e) => setForm({ ...form, parent_first_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last name</label>
                <Input
                  value={form.parent_last_name}
                  onChange={(e) => setForm({ ...form, parent_last_name: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.parent_email}
                  onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={form.parent_phone}
                  onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Child name</label>
                <Input
                  value={form.child_name}
                  onChange={(e) => setForm({ ...form, child_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Child age (months)</label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={form.child_age_months}
                  onChange={(e) => setForm({ ...form, child_age_months: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Program interest</label>
              <Input
                value={form.program_interest}
                onChange={(e) => setForm({ ...form, program_interest: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="mt-1"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitEdit} loading={pending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
