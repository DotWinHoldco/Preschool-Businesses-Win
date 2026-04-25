'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Layout, Filter, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_STAGES,
  SOURCE_LABELS,
  CONTACT_SOURCES,
} from '@/lib/schemas/crm'
import type { FilterCondition, FilterTree } from '@/lib/crm/audience-filter'
import { createAudience, updateAudience } from '@/lib/actions/crm/audiences'

interface TagOpt {
  id: string
  label: string
  color: string
}

interface InitialAudience {
  id: string
  name: string
  description: string | null
  type: 'static' | 'dynamic'
  filter_json: FilterTree
  color: string
  kanban_enabled: boolean
  kanban_columns: string[]
}

export function AudienceBuilderClient({
  tags,
  initial,
}: {
  tags: TagOpt[]
  initial?: InitialAudience
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [type, setType] = useState<'static' | 'dynamic'>(initial?.type ?? 'static')
  const [color, setColor] = useState(initial?.color ?? '#3b70b0')
  const [filter, setFilter] = useState<FilterTree>(
    initial?.filter_json ?? { match: 'all', conditions: [] },
  )
  const [kanbanEnabled, setKanbanEnabled] = useState(initial?.kanban_enabled ?? false)
  const [kanbanColumns, setKanbanColumns] = useState<string[]>(
    initial?.kanban_columns ?? ['New', 'Contacted', 'Qualified', 'Won'],
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addCondition() {
    setFilter((f) => ({
      ...f,
      conditions: [...f.conditions, { field: 'lifecycle_stage', operator: 'eq', value: 'lead' }],
    }))
  }
  function updateCondition(i: number, patch: Partial<FilterCondition>) {
    setFilter((f) => ({
      ...f,
      conditions: f.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }))
  }
  function removeCondition(i: number) {
    setFilter((f) => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }))
  }

  function addColumn() {
    setKanbanColumns((cols) => [...cols, `Column ${cols.length + 1}`])
  }
  function updateColumn(i: number, value: string) {
    setKanbanColumns((cols) => cols.map((c, idx) => (idx === i ? value : c)))
  }
  function removeColumn(i: number) {
    if (kanbanColumns.length <= 1) return
    setKanbanColumns((cols) => cols.filter((_, idx) => idx !== i))
  }

  function save() {
    setError(null)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (kanbanEnabled && kanbanColumns.filter((c) => c.trim()).length === 0) {
      setError('Kanban audiences need at least one column.')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      type,
      color,
      filter_json: type === 'dynamic' ? filter : { match: 'all', conditions: [] },
      kanban_enabled: kanbanEnabled,
      kanban_columns: kanbanColumns.map((c) => c.trim()).filter(Boolean),
    }

    startTransition(async () => {
      const result = initial
        ? await updateAudience({ id: initial.id, ...payload })
        : await createAudience(payload)
      if (!result.ok || !result.id) {
        setError(result.error ?? 'Save failed')
        return
      }
      toast({ variant: 'success', title: initial ? 'Audience updated' : 'Audience created' })
      router.push(`/portal/admin/crm/audiences/${result.id}`)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/audiences"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{initial ? 'Edit audience' : 'New audience'}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Define who belongs in this group, and how members move through it.
            </p>
          </div>
        </div>
        <Button onClick={save} loading={pending} disabled={pending}>
          <Save size={14} />
          {initial ? 'Save changes' : 'Create audience'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VIP families, Hot leads, Waitlist…"
              />
            </Field>
            <Field label="Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-16 cursor-pointer rounded-md border border-[var(--color-border)]"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </Field>
          <div>
            <p className="text-xs font-medium mb-1.5">Membership type</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {(['static', 'dynamic'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-left rounded-lg border-2 p-3 transition-all ${type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-foreground)]/30'}`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {t === 'static' ? <Users size={14} /> : <Filter size={14} />}
                    {t === 'static' ? 'Static list' : 'Dynamic segment'}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                    {t === 'static'
                      ? 'Hand-picked members. Add or remove manually.'
                      : 'Auto-matches contacts on rules you define. Refreshes automatically.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {type === 'dynamic' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Filter rules</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Contacts matching these rules will be auto-included.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filter.match}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, match: e.target.value as 'all' | 'any' }))
                  }
                  className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9"
                >
                  <option value="all">Match ALL conditions</option>
                  <option value="any">Match ANY condition</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              {filter.conditions.map((c, i) => (
                <ConditionRow
                  key={i}
                  condition={c}
                  tags={tags}
                  onChange={(patch) => updateCondition(i, patch)}
                  onRemove={() => removeCondition(i)}
                />
              ))}
              {filter.conditions.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)] py-3 text-center border border-dashed border-[var(--color-border)] rounded-md">
                  No conditions yet — every contact matches.
                </p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={addCondition}>
              <Plus size={14} />
              Add condition
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Layout size={16} />
                Kanban pipeline
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1 max-w-md">
                When on, this audience appears as a draggable kanban so you can move contacts
                between stages (Tour, Application, Offer, Enrolled, etc.) — perfect for tracking the
                enrollment funnel.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={kanbanEnabled}
                onChange={(e) => setKanbanEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--color-muted)] rounded-full peer peer-checked:bg-[var(--color-primary)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </div>
          {kanbanEnabled && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Columns (drag-drop preserves order)</p>
              {kanbanColumns.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted-foreground)] w-6 text-right">
                    {i + 1}.
                  </span>
                  <Input
                    inputSize="sm"
                    value={col}
                    onChange={(e) => updateColumn(i, e.target.value)}
                    placeholder="Column name"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(i)}
                    disabled={kanbanColumns.length <= 1}
                    aria-label="Remove column"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addColumn}>
                <Plus size={12} />
                Add column
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

function ConditionRow({
  condition,
  tags,
  onChange,
  onRemove,
}: {
  condition: FilterCondition
  tags: TagOpt[]
  onChange: (patch: Partial<FilterCondition>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] p-2 bg-[var(--color-background)]">
      <select
        value={condition.field}
        onChange={(e) =>
          onChange({
            field: e.target.value as FilterCondition['field'],
            operator: 'eq',
            value: '',
          })
        }
        className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
      >
        <option value="lifecycle_stage">Lifecycle stage</option>
        <option value="source">Source</option>
        <option value="tag">Tag</option>
        <option value="has_email">Has email</option>
        <option value="has_phone">Has phone</option>
        <option value="email_subscribed">Subscribed</option>
        <option value="created_within_days">Created in last N days</option>
        <option value="last_activity_within_days">Active in last N days</option>
        <option value="utm_source">UTM source</option>
        <option value="utm_campaign">UTM campaign</option>
        <option value="owner_user_id">Has owner</option>
      </select>

      <ConditionValue condition={condition} tags={tags} onChange={onChange} />

      <button
        type="button"
        onClick={onRemove}
        className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
        aria-label="Remove condition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ConditionValue({
  condition,
  tags,
  onChange,
}: {
  condition: FilterCondition
  tags: TagOpt[]
  onChange: (patch: Partial<FilterCondition>) => void
}) {
  const f = condition.field
  switch (f) {
    case 'lifecycle_stage':
      return (
        <>
          <OperatorEqNeq condition={condition} onChange={onChange} />
          <select
            value={String(condition.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value })}
            className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
          >
            {LIFECYCLE_STAGES.map((s) => (
              <option key={s} value={s}>
                {LIFECYCLE_LABELS[s]}
              </option>
            ))}
          </select>
        </>
      )
    case 'source':
      return (
        <>
          <OperatorEqNeq condition={condition} onChange={onChange} />
          <select
            value={String(condition.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value })}
            className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
          >
            {CONTACT_SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </>
      )
    case 'tag':
      return (
        <>
          <select
            value={condition.operator === 'not_in' ? 'not_in' : 'in'}
            onChange={(e) => onChange({ operator: e.target.value as FilterCondition['operator'] })}
            className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
          >
            <option value="in">has any of</option>
            <option value="not_in">does NOT have</option>
          </select>
          <select
            multiple
            value={Array.isArray(condition.value) ? (condition.value as string[]) : []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map((o) => o.value)
              onChange({ value: values })
            }}
            className="text-sm rounded-md border border-[var(--color-border)] px-2 py-1 bg-white min-w-[160px]"
            size={Math.min(4, Math.max(2, tags.length))}
          >
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </>
      )
    case 'has_email':
    case 'has_phone':
    case 'email_subscribed':
      return (
        <select
          value={condition.operator === 'is_false' ? 'is_false' : 'is_true'}
          onChange={(e) => onChange({ operator: e.target.value as FilterCondition['operator'] })}
          className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
        >
          <option value="is_true">is true</option>
          <option value="is_false">is false</option>
        </select>
      )
    case 'created_within_days':
    case 'last_activity_within_days':
      return (
        <Input
          inputSize="sm"
          type="number"
          min={1}
          value={String(condition.value ?? 30)}
          onChange={(e) => onChange({ value: parseInt(e.target.value, 10) || 30 })}
          className="w-24"
        />
      )
    case 'utm_source':
    case 'utm_campaign':
      return (
        <Input
          inputSize="sm"
          value={String(condition.value ?? '')}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="value"
        />
      )
    case 'owner_user_id':
      return (
        <select
          value={condition.operator === 'is_true' ? 'is_true' : 'is_false'}
          onChange={(e) => onChange({ operator: e.target.value as FilterCondition['operator'] })}
          className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
        >
          <option value="is_true">is assigned</option>
          <option value="is_false">is unassigned</option>
        </select>
      )
  }
  return null
}

function OperatorEqNeq({
  condition,
  onChange,
}: {
  condition: FilterCondition
  onChange: (patch: Partial<FilterCondition>) => void
}) {
  return (
    <select
      value={condition.operator === 'neq' ? 'neq' : 'eq'}
      onChange={(e) => onChange({ operator: e.target.value as FilterCondition['operator'] })}
      className="text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
    >
      <option value="eq">is</option>
      <option value="neq">is not</option>
    </select>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1">{label}</span>
      {children}
    </label>
  )
}
