'use client'

// @anchor: cca.checklist.tracking-client

import { useState, useMemo, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { CheckCircle2, Circle } from 'lucide-react'
import {
  completeChecklistRunItem,
  completeChecklistRun,
} from '@/lib/actions/checklists/manage-runs'

interface Run {
  id: string
  template_id: string
  assigned_to: string | null
  assigned_date: string
  due_date: string | null
  status: string
  completed_at: string | null
  notes: string | null
}

interface RunItem {
  id: string
  run_id: string
  item_id: string
  is_checked: boolean
  checked_at: string | null
  notes: string | null
  photo_path: string | null
}

interface Item {
  id: string
  template_id: string
  title: string
  item_type: string
  required: boolean
  sort_order: number
}

interface Template {
  id: string
  name: string
}

interface Profile {
  id: string
  full_name: string
}

interface Props {
  runs: Run[]
  runItems: RunItem[]
  items: Item[]
  templates: Template[]
  profiles: Profile[]
  filters: {
    template?: string
    assignee?: string
    status?: string
    from?: string
    to?: string
    run?: string
  }
}

const STATUSES = ['pending', 'in_progress', 'completed', 'overdue', 'skipped']

export function ChecklistTrackingClient({
  runs,
  runItems,
  items,
  templates,
  profiles,
  filters,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const urlParams = useSearchParams()
  const [err, setErr] = useState<string | null>(null)
  const [openRunId, setOpenRunId] = useState<string | null>(filters.run ?? null)

  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t.name])), [templates])
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.full_name])), [profiles])
  const runItemsByRun = useMemo(() => {
    const m = new Map<string, RunItem[]>()
    for (const ri of runItems) {
      const arr = m.get(ri.run_id) ?? []
      arr.push(ri)
      m.set(ri.run_id, arr)
    }
    return m
  }, [runItems])
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const { today, weekAgo } = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    const w = new Date(t)
    w.setDate(w.getDate() - 7)
    return { today: t, weekAgo: w }
  }, [])

  const stats = useMemo(() => {
    let pending = 0
    let overdue = 0
    let completedWeek = 0
    let totalDone = 0
    const totalRuns = runs.length
    for (const r of runs) {
      if (r.status === 'pending' || r.status === 'in_progress') {
        pending += 1
        if (r.due_date && new Date(r.due_date) < today) overdue += 1
      }
      if (r.status === 'completed') {
        totalDone += 1
        if (r.completed_at && new Date(r.completed_at) >= weekAgo) completedWeek += 1
      }
    }
    const rate = totalRuns > 0 ? Math.round((totalDone / totalRuns) * 100) : 0
    return { pending, overdue, completedWeek, rate }
  }, [runs, today, weekAgo])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(urlParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const openRun = runs.find((r) => r.id === openRunId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Checklist Tracking</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Monitor assigned checklists, completion rates, and overdue items.
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Pending', value: stats.pending.toString() },
          { label: 'Overdue', value: stats.overdue.toString() },
          { label: 'Done this week', value: stats.completedWeek.toString() },
          { label: 'Completion rate', value: `${stats.rate}%` },
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

      {/* Filters */}
      <div
        className="rounded-xl p-4 grid grid-cols-1 gap-3 sm:grid-cols-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)]">Template</label>
          <Select
            value={filters.template ?? ''}
            onChange={(e) => updateFilter('template', e.target.value)}
          >
            <option value="">All</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)]">Assignee</label>
          <Select
            value={filters.assignee ?? ''}
            onChange={(e) => updateFilter('assignee', e.target.value)}
          >
            <option value="">All</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)]">Status</label>
          <Select
            value={filters.status ?? ''}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)]">From</label>
          <Input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => updateFilter('from', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)]">To</label>
          <Input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => updateFilter('to', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Template', 'Assignee', 'Assigned', 'Due', 'Status', 'Progress'].map((h) => (
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
              {runs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                  >
                    No checklist runs match these filters.
                  </td>
                </tr>
              )}
              {runs.map((r) => {
                const rItems = runItemsByRun.get(r.id) ?? []
                const total = rItems.length
                const done = rItems.filter((x) => x.is_checked).length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                const overdue =
                  (r.status === 'pending' || r.status === 'in_progress') &&
                  r.due_date &&
                  new Date(r.due_date) < today
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onClick={() => setOpenRunId(r.id)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                      {templateMap.get(r.template_id) ?? r.template_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {r.assigned_to
                        ? (profileMap.get(r.assigned_to) ?? r.assigned_to.slice(0, 8))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {r.assigned_date ? new Date(r.assigned_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: overdue
                            ? 'var(--color-destructive)'
                            : r.status === 'completed'
                              ? 'var(--color-success, var(--color-primary))'
                              : 'var(--color-muted)',
                          color: overdue
                            ? 'var(--color-destructive-foreground)'
                            : r.status === 'completed'
                              ? 'var(--color-primary-foreground)'
                              : 'var(--color-muted-foreground)',
                        }}
                      >
                        {overdue ? 'overdue' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {done}/{total} ({pct}%)
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openRun && (
        <RunDetailDialog
          run={openRun}
          runItems={runItemsByRun.get(openRun.id) ?? []}
          items={items}
          itemsById={itemsById}
          templateName={templateMap.get(openRun.template_id) ?? ''}
          assigneeName={openRun.assigned_to ? (profileMap.get(openRun.assigned_to) ?? '—') : '—'}
          onClose={() => setOpenRunId(null)}
          onError={setErr}
        />
      )}
    </div>
  )
}

function RunDetailDialog({
  run,
  runItems,
  itemsById,
  templateName,
  assigneeName,
  onClose,
  onError,
}: {
  run: Run
  runItems: RunItem[]
  items: Item[]
  itemsById: Map<string, Item>
  templateName: string
  assigneeName: string
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [runNotes, setRunNotes] = useState(run.notes ?? '')

  const sorted = [...runItems].sort((a, b) => {
    const ia = itemsById.get(a.item_id)
    const ib = itemsById.get(b.item_id)
    return (ia?.sort_order ?? 0) - (ib?.sort_order ?? 0)
  })

  const toggle = (ri: RunItem) => {
    startTransition(async () => {
      const res = await completeChecklistRunItem({
        run_item_id: ri.id,
        is_checked: !ri.is_checked,
        notes: ri.notes,
        photo_path: ri.photo_path,
      })
      if (!res.ok) onError(res.error ?? 'Update failed')
    })
  }

  const finalize = () => {
    startTransition(async () => {
      const res = await completeChecklistRun({ run_id: run.id, notes: runNotes || null })
      if (!res.ok) onError(res.error ?? 'Complete failed')
      else onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={`${templateName} — ${assigneeName}`} className="max-w-2xl">
        <DialogClose onClick={onClose} />
        <div className="space-y-3 max-h-[75vh] overflow-y-auto">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Assigned {run.assigned_date ? new Date(run.assigned_date).toLocaleDateString() : '—'}
            {run.due_date && ` · due ${new Date(run.due_date).toLocaleDateString()}`}
            {' · '}status: {run.status}
          </p>

          <div className="space-y-2">
            {sorted.map((ri) => {
              const meta = itemsById.get(ri.item_id)
              return (
                <div
                  key={ri.id}
                  className="flex items-start gap-3 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-3"
                >
                  <button
                    type="button"
                    onClick={() => toggle(ri)}
                    disabled={isPending}
                    className="shrink-0 mt-0.5"
                    aria-label={ri.is_checked ? 'Uncheck' : 'Check'}
                  >
                    {ri.is_checked ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--color-foreground)]">
                      {meta?.title ?? ri.item_id.slice(0, 8)}
                      {meta?.required && (
                        <span className="ml-2 text-xs text-[var(--color-destructive)]">
                          required
                        </span>
                      )}
                    </p>
                    {ri.notes && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">{ri.notes}</p>
                    )}
                    {ri.checked_at && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        checked {new Date(ri.checked_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {sorted.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">No items on this run.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Run notes
            </label>
            <Textarea value={runNotes} onChange={(e) => setRunNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {run.status !== 'completed' && (
              <Button size="sm" loading={isPending} onClick={finalize}>
                Mark run completed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
