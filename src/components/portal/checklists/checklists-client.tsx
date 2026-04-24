'use client'

// @anchor: cca.checklist.checklists-client
// Checklists admin — Templates + Runs tabs with full CRUD

import { useState, useCallback } from 'react'
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Frequency = 'daily' | 'weekly' | 'monthly'

interface TemplateItem {
  id: string
  text: string
}

interface ChecklistTemplate {
  id: string
  title: string
  frequency: Frequency
  items: TemplateItem[]
}

type RunStatus = 'complete' | 'incomplete'

interface ChecklistRun {
  id: string
  templateId: string
  templateName: string
  date: string
  completedBy: string
  status: RunStatus
  checkedItems: string[]
  totalItems: number
}

// ---------------------------------------------------------------------------
// Mock staff for "Assign to"
// ---------------------------------------------------------------------------

const STAFF = ['Jane Smith', 'Maria Garcia', 'Tom Wilson', 'Sarah Johnson']

// ---------------------------------------------------------------------------
// Initial mock data
// ---------------------------------------------------------------------------

const INITIAL_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 't1',
    title: 'Opening Checklist',
    frequency: 'daily',
    items: [
      { id: 'i1', text: 'Unlock all doors' },
      { id: 'i2', text: 'Check indoor temperature' },
      { id: 'i3', text: 'Inspect playground equipment' },
      { id: 'i4', text: 'Review attendance board' },
      { id: 'i5', text: 'Prepare snack stations' },
    ],
  },
  {
    id: 't2',
    title: 'Closing Checklist',
    frequency: 'daily',
    items: [
      { id: 'i6', text: 'All children signed out' },
      { id: 'i7', text: 'Lock all entry points' },
      { id: 'i8', text: 'Turn off lights and HVAC' },
      { id: 'i9', text: 'Set alarm system' },
    ],
  },
  {
    id: 't3',
    title: 'Monthly Safety Inspection',
    frequency: 'monthly',
    items: [
      { id: 'i10', text: 'Check fire extinguishers' },
      { id: 'i11', text: 'Test smoke detectors' },
      { id: 'i12', text: 'Inspect outlet covers' },
      { id: 'i13', text: 'Review first aid supplies' },
      { id: 'i14', text: 'Check cabinet locks' },
      { id: 'i15', text: 'Inspect exterior fencing' },
    ],
  },
  {
    id: 't4',
    title: 'Fire Drill Prep',
    frequency: 'monthly',
    items: [
      { id: 'i16', text: 'Review evacuation routes' },
      { id: 'i17', text: 'Brief all staff on roles' },
      { id: 'i18', text: 'Ensure headcount sheets are printed' },
      { id: 'i19', text: 'Check assembly point markers' },
    ],
  },
]

const INITIAL_RUNS: ChecklistRun[] = [
  {
    id: 'r1',
    templateId: 't1',
    templateName: 'Opening Checklist',
    date: '2026-04-20',
    completedBy: 'Jane Smith',
    status: 'complete',
    checkedItems: ['i1', 'i2', 'i3', 'i4', 'i5'],
    totalItems: 5,
  },
  {
    id: 'r2',
    templateId: 't2',
    templateName: 'Closing Checklist',
    date: '2026-04-19',
    completedBy: 'Tom Wilson',
    status: 'complete',
    checkedItems: ['i6', 'i7', 'i8', 'i9'],
    totalItems: 4,
  },
  {
    id: 'r3',
    templateId: 't3',
    templateName: 'Monthly Safety Inspection',
    date: '2026-04-15',
    completedBy: 'Maria Garcia',
    status: 'incomplete',
    checkedItems: ['i10', 'i11', 'i13'],
    totalItems: 6,
  },
  {
    id: 'r4',
    templateId: 't1',
    templateName: 'Opening Checklist',
    date: '2026-04-19',
    completedBy: 'Sarah Johnson',
    status: 'complete',
    checkedItems: ['i1', 'i2', 'i3', 'i4', 'i5'],
    totalItems: 5,
  },
]

// ---------------------------------------------------------------------------
// Frequency badge helpers
// ---------------------------------------------------------------------------

const FREQ_VARIANT: Record<Frequency, 'default' | 'secondary' | 'warning'> = {
  daily: 'default',
  weekly: 'secondary',
  monthly: 'warning',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChecklistsClient() {
  const [tab, setTab] = useState<'templates' | 'runs'>('templates')
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(INITIAL_TEMPLATES)
  const [runs, setRuns] = useState<ChecklistRun[]>(INITIAL_RUNS)

  // Template expansion
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assignTo, setAssignTo] = useState<Record<string, string>>({})

  // New template dialog
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newFrequency, setNewFrequency] = useState<Frequency>('daily')
  const [newItems, setNewItems] = useState<string[]>([''])

  // New run dialog
  const [showNewRun, setShowNewRun] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const resetNewTemplate = useCallback(() => {
    setNewTitle('')
    setNewFrequency('daily')
    setNewItems([''])
  }, [])

  const handleCreateTemplate = useCallback(() => {
    if (!newTitle.trim()) return
    const items: TemplateItem[] = newItems
      .filter((t) => t.trim())
      .map((text) => ({ id: crypto.randomUUID(), text }))
    if (items.length === 0) return
    const template: ChecklistTemplate = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      frequency: newFrequency,
      items,
    }
    setTemplates((prev) => [...prev, template])
    setShowNewTemplate(false)
    resetNewTemplate()
  }, [newTitle, newFrequency, newItems, resetNewTemplate])

  const handleStartRun = useCallback(() => {
    if (!selectedTemplateId) return
    const tmpl = templates.find((t) => t.id === selectedTemplateId)
    if (!tmpl) return
    const run: ChecklistRun = {
      id: crypto.randomUUID(),
      templateId: tmpl.id,
      templateName: tmpl.title,
      date: new Date().toISOString().split('T')[0],
      completedBy: STAFF[0],
      status: 'incomplete',
      checkedItems: [],
      totalItems: tmpl.items.length,
    }
    setRuns((prev) => [run, ...prev])
    setShowNewRun(false)
    setSelectedTemplateId('')
    setTab('runs')
  }, [selectedTemplateId, templates])

  const toggleRunItem = useCallback((runId: string, itemId: string) => {
    setRuns((prev) =>
      prev.map((run) => {
        if (run.id !== runId) return run
        const checked = run.checkedItems.includes(itemId)
          ? run.checkedItems.filter((i) => i !== itemId)
          : [...run.checkedItems, itemId]
        const status = checked.length === run.totalItems ? 'complete' : 'incomplete'
        return { ...run, checkedItems: checked, status }
      }),
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-muted)] p-1 w-fit">
        <button
          onClick={() => setTab('templates')}
          className={cn(
            'rounded-[calc(var(--radius,0.75rem)-4px)] px-4 py-2 text-sm font-medium transition-colors',
            tab === 'templates'
              ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          Templates
        </button>
        <button
          onClick={() => setTab('runs')}
          className={cn(
            'rounded-[calc(var(--radius,0.75rem)-4px)] px-4 py-2 text-sm font-medium transition-colors',
            tab === 'runs'
              ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          Runs
        </button>
      </div>

      {/* ================================================================= */}
      {/* TEMPLATES TAB                                                     */}
      {/* ================================================================= */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {templates.length} template{templates.length !== 1 && 's'}
            </p>
            <Button size="sm" onClick={() => setShowNewTemplate(true)}>
              <Plus size={16} />
              New Template
            </Button>
          </div>

          <div className="space-y-3">
            {templates.map((tmpl) => {
              const expanded = expandedId === tmpl.id
              return (
                <Card key={tmpl.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : tmpl.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                        <ClipboardList size={20} className="text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-foreground)] truncate">
                          {tmpl.title}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {tmpl.items.length} item{tmpl.items.length !== 1 && 's'}
                        </p>
                      </div>
                      <Badge variant={FREQ_VARIANT[tmpl.frequency]}>{tmpl.frequency}</Badge>
                      {expanded ? (
                        <ChevronDown
                          size={18}
                          className="text-[var(--color-muted-foreground)] shrink-0"
                        />
                      ) : (
                        <ChevronRight
                          size={18}
                          className="text-[var(--color-muted-foreground)] shrink-0"
                        />
                      )}
                    </CardContent>
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-3">
                      <div className="space-y-2">
                        {tmpl.items.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2.5 text-sm text-[var(--color-foreground)]"
                          >
                            <input
                              type="checkbox"
                              disabled
                              className="h-4 w-4 rounded border-[var(--color-border)]"
                            />
                            {item.text}
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <label className="text-sm font-medium text-[var(--color-foreground)]">
                          Assign to:
                        </label>
                        <select
                          value={assignTo[tmpl.id] ?? ''}
                          onChange={(e) =>
                            setAssignTo((prev) => ({
                              ...prev,
                              [tmpl.id]: e.target.value,
                            }))
                          }
                          className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-foreground)]"
                        >
                          <option value="">Select staff...</option>
                          {STAFF.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* New Template Dialog */}
          <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
            <DialogOverlay onClick={() => setShowNewTemplate(false)} />
            <DialogContent title="New Checklist Template">
              <DialogClose onClick={() => setShowNewTemplate(false)} />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Title
                  </label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Weekly Cleaning Checklist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as Frequency)}
                    className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)] min-h-[48px]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Items
                  </label>
                  <div className="space-y-2">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const copy = [...newItems]
                            copy[idx] = e.target.value
                            setNewItems(copy)
                          }}
                          placeholder={`Item ${idx + 1}`}
                          inputSize="sm"
                        />
                        {newItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="shrink-0 p-1 text-[var(--color-destructive)] hover:bg-[var(--color-muted)] rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewItems((prev) => [...prev, ''])}
                      className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      <Plus size={14} />
                      Add item
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowNewTemplate(false)
                      resetNewTemplate()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateTemplate}
                    disabled={!newTitle.trim() || newItems.filter((i) => i.trim()).length === 0}
                  >
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================================================================= */}
      {/* RUNS TAB                                                          */}
      {/* ================================================================= */}
      {tab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {runs.length} run{runs.length !== 1 && 's'}
            </p>
            <Button size="sm" onClick={() => setShowNewRun(true)}>
              <Play size={16} />
              Start Run
            </Button>
          </div>

          <div className="space-y-3">
            {runs.map((run) => {
              const pct =
                run.totalItems > 0
                  ? Math.round((run.checkedItems.length / run.totalItems) * 100)
                  : 0
              const tmpl = templates.find((t) => t.id === run.templateId)
              return (
                <Card key={run.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          run.status === 'complete'
                            ? 'bg-[var(--color-success)]/10'
                            : 'bg-[var(--color-warning)]/10',
                        )}
                      >
                        {run.status === 'complete' ? (
                          <CheckCircle2 size={20} className="text-[var(--color-success)]" />
                        ) : (
                          <Clock size={20} className="text-[var(--color-warning)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-foreground)] truncate">
                          {run.templateName}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {run.date} &middot; {run.completedBy}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={run.status === 'complete' ? 'success' : 'warning'}>
                          {run.status === 'complete' ? 'Complete' : 'In Progress'}
                        </Badge>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{pct}%</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-[var(--color-muted)]">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          run.status === 'complete'
                            ? 'bg-[var(--color-success)]'
                            : 'bg-[var(--color-warning)]',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Interactive items (only for incomplete runs) */}
                    {run.status !== 'complete' && tmpl && (
                      <div className="space-y-1 pt-1">
                        {tmpl.items.map((item) => {
                          const checked = run.checkedItems.includes(item.id)
                          return (
                            <label
                              key={item.id}
                              className="flex items-center gap-2.5 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRunItem(run.id, item.id)}
                                className="h-4 w-4 rounded border-[var(--color-border)]"
                              />
                              <span
                                className={cn(
                                  checked
                                    ? 'text-[var(--color-muted-foreground)] line-through'
                                    : 'text-[var(--color-foreground)]',
                                )}
                              >
                                {item.text}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Start Run Dialog */}
          <Dialog open={showNewRun} onOpenChange={setShowNewRun}>
            <DialogOverlay onClick={() => setShowNewRun(false)} />
            <DialogContent title="Start a New Run">
              <DialogClose onClick={() => setShowNewRun(false)} />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)] min-h-[48px]"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.items.length} items)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowNewRun(false)
                      setSelectedTemplateId('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleStartRun} disabled={!selectedTemplateId}>
                    <Play size={16} />
                    Start Run
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
