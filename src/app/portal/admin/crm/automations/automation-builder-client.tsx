'use client'

// @anchor: cca.crm.automation-builder
// Visual rule builder. Trigger pick, optional conditions (any/all), and
// an ordered action list. Saves through upsertAutomation server action.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Mail,
  Tag,
  TagsIcon,
  GitBranch,
  Layers,
  ListTodo,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { CRM_EVENT_KINDS } from '@/lib/crm/events'
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from '@/lib/schemas/crm'
import { upsertAutomation } from '@/lib/actions/crm/automations'

type ActionType =
  | 'send_email'
  | 'add_tag'
  | 'remove_tag'
  | 'set_lifecycle'
  | 'add_to_audience'
  | 'enroll_in_drip'
  | 'create_task'

type Action =
  | { type: 'send_email'; template_id: string }
  | { type: 'add_tag'; tag_id: string }
  | { type: 'remove_tag'; tag_id: string }
  | { type: 'set_lifecycle'; stage: string }
  | { type: 'add_to_audience'; audience_id: string }
  | { type: 'enroll_in_drip'; campaign_id: string }
  | { type: 'create_task'; title: string; description?: string }

type Rule = {
  field:
    | 'contact.lifecycle_stage'
    | 'contact.has_tag'
    | 'contact.email_subscribed'
    | 'contact.source'
    | 'payload.equals'
  op: 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_true' | 'is_false' | 'has_any' | 'has_all'
  value?: unknown
  key?: string
}

interface Initial {
  id: string
  name: string
  description: string
  trigger_kind: string
  conditions_json: { match: 'all' | 'any'; rules: Rule[] | unknown[] }
  actions_json: unknown[]
  is_enabled: boolean
  cooldown_minutes: number
  max_runs_per_contact: number | null
}

export function AutomationBuilderClient({
  templates,
  tags,
  audiences,
  dripCampaigns,
  initial,
}: {
  templates: { id: string; name: string; subject: string }[]
  tags: { id: string; label: string; color: string }[]
  audiences: { id: string; name: string; type: string }[]
  dripCampaigns: { id: string; name: string }[]
  initial?: Initial
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? 'Untitled automation')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [trigger, setTrigger] = useState<string>(initial?.trigger_kind ?? 'application.submitted')
  const [match, setMatch] = useState<'all' | 'any'>(
    (initial?.conditions_json?.match as 'all' | 'any') ?? 'all',
  )
  const [rules, setRules] = useState<Rule[]>(
    ((initial?.conditions_json?.rules as Rule[]) ?? []) as Rule[],
  )
  const [actions, setActions] = useState<Action[]>((initial?.actions_json as Action[]) ?? [])
  const [enabled, setEnabled] = useState(initial?.is_enabled ?? false)
  const [cooldown, setCooldown] = useState<number>(initial?.cooldown_minutes ?? 0)
  const [maxRuns, setMaxRuns] = useState<string>(
    initial?.max_runs_per_contact ? String(initial.max_runs_per_contact) : '',
  )
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addAction(type: ActionType) {
    let next: Action
    switch (type) {
      case 'send_email':
        next = { type, template_id: templates[0]?.id ?? '' }
        break
      case 'add_tag':
      case 'remove_tag':
        next = { type, tag_id: tags[0]?.id ?? '' }
        break
      case 'set_lifecycle':
        next = { type, stage: 'enrolled_parent' }
        break
      case 'add_to_audience':
        next = { type, audience_id: audiences.find((a) => a.type === 'static')?.id ?? '' }
        break
      case 'enroll_in_drip':
        next = { type, campaign_id: dripCampaigns[0]?.id ?? '' }
        break
      case 'create_task':
        next = { type, title: 'Follow up with this family' }
        break
    }
    setActions([...actions, next])
  }

  function updateAction(idx: number, patch: Partial<Action>) {
    setActions(actions.map((a, i) => (i === idx ? ({ ...a, ...patch } as Action) : a)))
  }

  function removeAction(idx: number) {
    setActions(actions.filter((_, i) => i !== idx))
  }

  function addRule() {
    setRules([...rules, { field: 'contact.lifecycle_stage', op: 'equals', value: 'lead' } as Rule])
  }

  function updateRule(idx: number, patch: Partial<Rule>) {
    setRules(rules.map((r, i) => (i === idx ? ({ ...r, ...patch } as Rule) : r)))
  }

  function removeRule(idx: number) {
    setRules(rules.filter((_, i) => i !== idx))
  }

  async function save() {
    setError(null)
    if (!name.trim()) {
      setError('Give your automation a name.')
      return
    }
    if (actions.length === 0) {
      setError('Add at least one action.')
      return
    }
    // Quick validate that each action has the required ids selected.
    for (const a of actions) {
      if (a.type === 'send_email' && !a.template_id)
        return setError('Pick a template for the send-email step.')
      if ((a.type === 'add_tag' || a.type === 'remove_tag') && !a.tag_id)
        return setError('Pick a tag for the tag step.')
      if (a.type === 'add_to_audience' && !a.audience_id)
        return setError('Pick an audience for the add-to-audience step.')
      if (a.type === 'enroll_in_drip' && !a.campaign_id)
        return setError('Pick a drip campaign for the enroll step.')
    }

    start(async () => {
      const r = await upsertAutomation({
        id: initial?.id,
        name: name.trim(),
        description: description.trim() || null,
        trigger_kind: trigger,
        conditions_json: { match, rules },
        actions_json: actions,
        is_enabled: enabled,
        cooldown_minutes: cooldown,
        max_runs_per_contact: maxRuns ? Number(maxRuns) : null,
      })
      if (!r.ok || !r.id) {
        setError(r.error ?? 'Save failed')
        return
      }
      toast({ variant: 'success', title: 'Saved' })
      if (!initial) router.push(`/portal/admin/crm/automations/${r.id}`)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/automations"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <Input
            inputSize="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold w-72"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Enabled
          </label>
          <Button onClick={save} loading={pending} disabled={pending}>
            <Save size={14} />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this automation do?"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Trigger event</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white"
            >
              {Object.entries(groupKinds()).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-[var(--color-primary)]" />
              <h3 className="font-semibold text-sm">Conditions</h3>
              <Badge variant="outline">
                {rules.length === 0
                  ? 'Always run'
                  : `${rules.length} rule${rules.length === 1 ? '' : 's'}`}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={match}
                onChange={(e) => setMatch(e.target.value as 'all' | 'any')}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
              >
                <option value="all">Match all</option>
                <option value="any">Match any</option>
              </select>
              <Button variant="secondary" size="sm" onClick={addRule}>
                <Plus size={12} />
                Add rule
              </Button>
            </div>
          </div>
          {rules.length === 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              No conditions — every event of this type will fire the actions below.
            </p>
          )}
          {rules.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-md bg-[var(--color-muted)]/40 flex-wrap"
            >
              <select
                value={r.field}
                onChange={(e) => {
                  const field = e.target.value as Rule['field']
                  const next: Rule = { field, op: defaultOpFor(field) }
                  updateRule(i, next)
                }}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
              >
                <option value="contact.lifecycle_stage">Contact lifecycle stage</option>
                <option value="contact.has_tag">Contact has tag</option>
                <option value="contact.email_subscribed">Contact email subscribed</option>
                <option value="contact.source">Contact source</option>
                <option value="payload.equals">Event payload field</option>
              </select>
              <select
                value={r.op}
                onChange={(e) => updateRule(i, { op: e.target.value as Rule['op'] })}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
              >
                {opsFor(r.field).map((op) => (
                  <option key={op} value={op}>
                    {op.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {needsValue(r) &&
                (r.field === 'contact.lifecycle_stage' ? (
                  <select
                    value={(r.value as string) ?? ''}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                  >
                    {LIFECYCLE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {LIFECYCLE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                ) : r.field === 'contact.has_tag' ? (
                  <select
                    value={
                      Array.isArray(r.value) ? (r.value[0] as string) : ((r.value as string) ?? '')
                    }
                    onChange={(e) => updateRule(i, { value: [e.target.value] })}
                    className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                  >
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                ) : r.field === 'payload.equals' ? (
                  <>
                    <Input
                      inputSize="sm"
                      value={r.key ?? ''}
                      onChange={(e) => updateRule(i, { key: e.target.value })}
                      placeholder="payload key"
                      className="w-36"
                    />
                    <Input
                      inputSize="sm"
                      value={(r.value as string) ?? ''}
                      onChange={(e) => updateRule(i, { value: e.target.value })}
                      placeholder="value"
                      className="w-36"
                    />
                  </>
                ) : (
                  <Input
                    inputSize="sm"
                    value={(r.value as string) ?? ''}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    className="w-40"
                  />
                ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRule(i)}
                aria-label="Remove rule"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[var(--color-primary)]" />
              <h3 className="font-semibold text-sm">Actions (run in order)</h3>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <ActionAddButton
                icon={Mail}
                label="Send email"
                onClick={() => addAction('send_email')}
              />
              <ActionAddButton icon={Tag} label="Add tag" onClick={() => addAction('add_tag')} />
              <ActionAddButton
                icon={TagsIcon}
                label="Remove tag"
                onClick={() => addAction('remove_tag')}
              />
              <ActionAddButton
                icon={Users}
                label="Add to audience"
                onClick={() => addAction('add_to_audience')}
              />
              <ActionAddButton
                icon={Layers}
                label="Enroll in drip"
                onClick={() => addAction('enroll_in_drip')}
              />
              <ActionAddButton
                icon={GitBranch}
                label="Set lifecycle"
                onClick={() => addAction('set_lifecycle')}
              />
              <ActionAddButton
                icon={ListTodo}
                label="Create task"
                onClick={() => addAction('create_task')}
              />
            </div>
          </div>
          {actions.length === 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Add actions to run when the trigger fires for a matching contact.
            </p>
          )}
          {actions.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-md bg-[var(--color-muted)]/40 flex-wrap"
            >
              <span className="h-6 w-6 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {a.type.replace(/_/g, ' ')}
              </span>
              {a.type === 'send_email' && (
                <select
                  value={a.template_id}
                  onChange={(e) => updateAction(i, { template_id: e.target.value })}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white flex-1 min-w-0"
                >
                  <option value="">Pick a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subject.slice(0, 60)}
                    </option>
                  ))}
                </select>
              )}
              {(a.type === 'add_tag' || a.type === 'remove_tag') && (
                <select
                  value={a.tag_id}
                  onChange={(e) => updateAction(i, { tag_id: e.target.value })}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                >
                  <option value="">Pick a tag…</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
              {a.type === 'set_lifecycle' && (
                <select
                  value={a.stage}
                  onChange={(e) => updateAction(i, { stage: e.target.value })}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                >
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {LIFECYCLE_LABELS[s]}
                    </option>
                  ))}
                </select>
              )}
              {a.type === 'add_to_audience' && (
                <select
                  value={a.audience_id}
                  onChange={(e) => updateAction(i, { audience_id: e.target.value })}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                >
                  <option value="">Pick a static audience…</option>
                  {audiences
                    .filter((au) => au.type === 'static')
                    .map((au) => (
                      <option key={au.id} value={au.id}>
                        {au.name}
                      </option>
                    ))}
                </select>
              )}
              {a.type === 'enroll_in_drip' && (
                <select
                  value={a.campaign_id}
                  onChange={(e) => updateAction(i, { campaign_id: e.target.value })}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs bg-white"
                >
                  <option value="">Pick a drip…</option>
                  {dripCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {a.type === 'create_task' && (
                <Input
                  inputSize="sm"
                  value={a.title}
                  onChange={(e) => updateAction(i, { title: e.target.value })}
                  placeholder="Task title"
                  className="flex-1 min-w-0"
                />
              )}
              <Button variant="ghost" size="sm" onClick={() => removeAction(i)} aria-label="Remove">
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1">Cooldown per contact (minutes)</label>
            <Input
              type="number"
              min={0}
              value={cooldown}
              onChange={(e) => setCooldown(parseInt(e.target.value, 10) || 0)}
            />
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
              Prevents firing again for the same contact within this many minutes.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Max runs per contact</label>
            <Input
              type="number"
              min={1}
              placeholder="unlimited"
              value={maxRuns}
              onChange={(e) => setMaxRuns(e.target.value)}
            />
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
              Cap how many times this automation can ever run for a single contact.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
            {error}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ActionAddButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Mail
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-muted)]/30"
    >
      <Icon size={11} />
      {label}
    </button>
  )
}

function groupKinds() {
  const groups: Record<string, typeof CRM_EVENT_KINDS> = {}
  for (const k of CRM_EVENT_KINDS) {
    ;(groups[k.group] ??= []).push(k)
  }
  return groups
}

function defaultOpFor(field: Rule['field']): Rule['op'] {
  if (field === 'contact.email_subscribed') return 'is_true'
  if (field === 'contact.has_tag') return 'has_any'
  return 'equals'
}

function opsFor(field: Rule['field']): Rule['op'][] {
  if (field === 'contact.email_subscribed') return ['is_true', 'is_false']
  if (field === 'contact.has_tag') return ['has_any', 'has_all']
  if (field === 'contact.lifecycle_stage') return ['equals', 'not_equals', 'in', 'not_in']
  return ['equals', 'not_equals']
}

function needsValue(r: Rule) {
  return r.op !== 'is_true' && r.op !== 'is_false'
}
