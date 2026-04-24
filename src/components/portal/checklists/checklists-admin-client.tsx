'use client'

// @anchor: cca.checklist.admin-client

import { useState, useMemo, useEffect, useTransition } from 'react'
import { Plus, Pencil, Trash2, Archive, Layers, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  createChecklistTemplate,
  updateChecklistTemplate,
  createChecklistItem,
} from '@/lib/actions/checklists/admin-templates'
import {
  archiveChecklistTemplate,
  updateChecklistItem,
  deleteChecklistItem,
  assignChecklist,
} from '@/lib/actions/checklists/manage-runs'

interface Template {
  id: string
  name: string
  target_type: string
  description: string | null
  is_active: boolean
  sort_order: number
}

interface Item {
  id: string
  template_id: string
  title: string
  description: string | null
  item_type: string
  required: boolean
  sort_order: number
  deadline_days_from_assignment: number | null
}

interface Profile {
  id: string
  full_name: string
  role: string
}

const TARGET_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'opening', label: 'Opening' },
  { value: 'closing', label: 'Closing' },
]

const ITEM_TYPES = [
  { value: 'check', label: 'Check' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'text', label: 'Text' },
  { value: 'photo', label: 'Photo' },
]

interface Props {
  templates: Template[]
  items: Item[]
  profiles: Profile[]
}

export function ChecklistsAdminClient({ templates, items, profiles }: Props) {
  const [err, setErr] = useState<string | null>(null)
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; initial: Template | null }>(
    { open: false, initial: null },
  )
  const [itemsDrawer, setItemsDrawer] = useState<Template | null>(null)
  const [assignDialog, setAssignDialog] = useState<Template | null>(null)

  const itemsByTemplate = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const it of items) {
      const arr = m.get(it.template_id) ?? []
      arr.push(it)
      m.set(it.template_id, arr)
    }
    return m
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Checklist Templates</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage daily, weekly, and monthly checklists for your team.
          </p>
        </div>
        <Button onClick={() => setTemplateDialog({ open: true, initial: null })}>
          <Plus size={16} />
          New Template
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: templates.length.toString() },
          { label: 'Active', value: templates.filter((t) => t.is_active).length.toString() },
          { label: 'Archived', value: templates.filter((t) => !t.is_active).length.toString() },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Target', 'Items', 'Status', 'Actions'].map((h) => (
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
              {templates.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                  >
                    No templates yet.
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {t.target_type}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {itemsByTemplate.get(t.id)?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: t.is_active
                          ? 'var(--color-primary)'
                          : 'var(--color-muted)',
                        color: t.is_active
                          ? 'var(--color-primary-foreground)'
                          : 'var(--color-muted-foreground)',
                      }}
                    >
                      {t.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setItemsDrawer(t)}
                        className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
                      >
                        <Layers size={12} />
                        Items
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignDialog(t)}
                        className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
                      >
                        <UserPlus size={12} />
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateDialog({ open: true, initial: t })}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <ArchiveButton templateId={t.id} onError={setErr} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TemplateDialog
        open={templateDialog.open}
        initial={templateDialog.initial}
        onClose={() => setTemplateDialog({ open: false, initial: null })}
        onError={setErr}
      />

      {itemsDrawer && (
        <ItemsDrawer
          template={itemsDrawer}
          items={itemsByTemplate.get(itemsDrawer.id) ?? []}
          onClose={() => setItemsDrawer(null)}
          onError={setErr}
        />
      )}

      {assignDialog && (
        <AssignDialog
          template={assignDialog}
          profiles={profiles}
          onClose={() => setAssignDialog(null)}
          onError={setErr}
        />
      )}
    </div>
  )
}

function ArchiveButton({
  templateId,
  onError,
}: {
  templateId: string
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm('Archive this template?')) return
        startTransition(async () => {
          const res = await archiveChecklistTemplate({ template_id: templateId })
          if (!res.ok) onError(res.error ?? 'Archive failed')
        })
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
      aria-label="Archive"
    >
      <Archive size={14} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Template dialog
// ---------------------------------------------------------------------------

function TemplateDialog({
  open,
  initial,
  onClose,
  onError,
}: {
  open: boolean
  initial: Template | null
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initial?.name ?? '')
  const [targetType, setTargetType] = useState(initial?.target_type ?? 'daily')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  useEffect(() => {
    setName(initial?.name ?? '')
    setTargetType(initial?.target_type ?? 'daily')
    setDescription(initial?.description ?? '')
    setIsActive(initial?.is_active ?? true)
  }, [initial])

  if (!open) return null

  const handleSave = () => {
    startTransition(async () => {
      if (initial) {
        const res = await updateChecklistTemplate({
          template_id: initial.id,
          name,
          target_type: targetType as never,
          description: description || undefined,
          is_active: isActive,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onClose()
      } else {
        const res = await createChecklistTemplate({
          name,
          target_type: targetType as never,
          description: description || undefined,
          is_active: isActive,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={initial ? 'Edit Template' : 'New Template'}>
        <DialogClose onClick={onClose} />
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Target type">
            <Select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              {TARGET_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isPending}
              onClick={handleSave}
              disabled={!name || isPending}
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
// Items drawer
// ---------------------------------------------------------------------------

function ItemsDrawer({
  template,
  items,
  onClose,
  onError,
}: {
  template: Template
  items: Item[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<string>('check')
  const [required, setRequired] = useState(true)
  const [sortOrder, setSortOrder] = useState(items.length)
  const [deadlineDays, setDeadlineDays] = useState<string>('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  const startEdit = (it: Item) => {
    setEditingItem(it)
    setTitle(it.title)
    setDescription(it.description ?? '')
    setItemType(it.item_type)
    setRequired(it.required)
    setSortOrder(it.sort_order)
    setDeadlineDays(it.deadline_days_from_assignment?.toString() ?? '')
  }

  const resetForm = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setItemType('check')
    setRequired(true)
    setSortOrder(items.length)
    setDeadlineDays('')
  }

  const handleSave = () => {
    startTransition(async () => {
      const deadlineNum = deadlineDays ? Number(deadlineDays) : undefined
      if (editingItem) {
        const res = await updateChecklistItem({
          item_id: editingItem.id,
          title,
          description: description || null,
          item_type: itemType as never,
          required,
          sort_order: sortOrder,
          deadline_days_from_assignment: deadlineNum ?? null,
        })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else resetForm()
      } else {
        const res = await createChecklistItem({
          template_id: template.id,
          title,
          description: description || undefined,
          item_type: itemType as never,
          required,
          sort_order: sortOrder,
          deadline_days_from_assignment: deadlineNum,
        })
        if (!res.ok) onError(res.error ?? 'Create failed')
        else resetForm()
      }
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={`Items — ${template.name}`} className="max-w-2xl">
        <DialogClose onClick={onClose} />
        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No items yet. Add the first one below.
              </p>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-foreground)]">
                    {it.sort_order}. {it.title}
                    {it.required && (
                      <span className="ml-2 text-xs text-[var(--color-destructive)]">required</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {it.item_type}
                    {it.description ? ` · ${it.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(it)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                    aria-label="Edit item"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm('Delete this item?')) return
                      startTransition(async () => {
                        const res = await deleteChecklistItem({ item_id: it.id })
                        if (!res.ok) onError(res.error ?? 'Delete failed')
                      })
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                    aria-label="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-[var(--radius,0.75rem)] p-4 space-y-3"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {editingItem ? 'Edit item' : 'Add new item'}
            </h3>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                  {ITEM_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Deadline (days from assignment, optional)">
              <Input
                type="number"
                min={1}
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              Required
            </label>
            <div className="flex justify-end gap-2">
              {editingItem && (
                <Button variant="secondary" size="sm" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
              <Button
                size="sm"
                loading={isPending}
                disabled={!title || isPending}
                onClick={handleSave}
              >
                {editingItem ? 'Update item' : 'Add item'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Assign dialog
// ---------------------------------------------------------------------------

function AssignDialog({
  template,
  profiles,
  onClose,
  onError,
}: {
  template: Template
  profiles: Profile[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [targetEntityType, setTargetEntityType] = useState('')
  const [targetEntityId, setTargetEntityId] = useState('')
  const [notes, setNotes] = useState('')

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const handleAssign = () => {
    startTransition(async () => {
      const res = await assignChecklist({
        template_id: template.id,
        assignees: selected,
        due_date: dueDate || null,
        target_entity_type: targetEntityType || null,
        target_entity_id: targetEntityId || null,
        notes: notes || null,
      })
      if (!res.ok) onError(res.error ?? 'Assign failed')
      else onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={`Assign — ${template.name}`}>
        <DialogClose onClick={onClose} />
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Assignees">
            <div className="max-h-60 overflow-y-auto rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-2 space-y-1">
              {profiles.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 rounded-[var(--radius,0.5rem)] p-2 hover:bg-[var(--color-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="text-sm text-[var(--color-foreground)]">
                    {p.full_name}
                    <span className="text-[var(--color-muted-foreground)]"> · {p.role}</span>
                  </span>
                </label>
              ))}
              {profiles.length === 0 && (
                <p className="p-2 text-sm text-[var(--color-muted-foreground)]">
                  No staff available to assign.
                </p>
              )}
            </div>
          </Field>
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target entity type (optional)">
              <Input
                value={targetEntityType}
                onChange={(e) => setTargetEntityType(e.target.value)}
                placeholder="e.g. classroom"
              />
            </Field>
            <Field label="Target entity ID (optional)">
              <Input
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                placeholder="UUID"
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isPending}
              onClick={handleAssign}
              disabled={selected.length === 0 || isPending}
            >
              Assign to {selected.length || 0}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
