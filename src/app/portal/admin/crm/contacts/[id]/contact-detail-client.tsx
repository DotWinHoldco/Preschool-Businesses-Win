'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Phone,
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  StickyNote,
  Activity,
  Link2,
  Save,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_COLORS,
  LIFECYCLE_STAGES,
  SOURCE_LABELS,
  CONTACT_SOURCES,
  type LifecycleStage,
  type ContactSource,
} from '@/lib/schemas/crm'
import {
  updateContact,
  softDeleteContact,
  addTagToContact,
  removeTagFromContact,
  addContactNote,
} from '@/lib/actions/crm/contacts'

interface TagRow {
  id: string
  slug: string
  label: string
  color: string
  description: string | null
  is_system: boolean
}

interface Activity {
  id: string
  activity_type: string
  title: string
  body: string | null
  occurred_at: string
  actor_user_id: string | null
  payload: Record<string, unknown>
  related_entity_type: string | null
  related_entity_id: string | null
}

interface Props {
  contact: Record<string, unknown>
  activities: Activity[]
  assignments: string[]
  tags: TagRow[]
  lead: Record<string, unknown> | null
  application: Record<string, unknown> | null
  family: Record<string, unknown> | null
}

type Tab = 'overview' | 'timeline' | 'tags' | 'linked'

export function ContactDetailClient({
  contact,
  activities,
  assignments: initialAssignments,
  tags,
  lead,
  application,
  family,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [assignments, setAssignments] = useState<Set<string>>(new Set(initialAssignments))
  const [pending, startTransition] = useTransition()

  // tagsById reserved for future per-tag color renderings in the timeline.
  useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])
  const stage = (contact.lifecycle_stage as LifecycleStage) ?? 'lead'
  const stageColor = LIFECYCLE_COLORS[stage]
  const fullName =
    (contact.full_name as string | null) ||
    (contact.email as string) ||
    (contact.phone as string) ||
    'Unnamed contact'
  const initials = (() => {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '·'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  function handleAddTag(tagId: string) {
    setAssignments((prev) => new Set(prev).add(tagId))
    startTransition(async () => {
      const result = await addTagToContact({ contact_id: contact.id as string, tag_id: tagId })
      if (!result.ok) {
        setAssignments((prev) => {
          const n = new Set(prev)
          n.delete(tagId)
          return n
        })
        toast({ variant: 'error', title: 'Failed to add tag', description: result.error })
      } else {
        toast({ variant: 'success', title: 'Tag added' })
        router.refresh()
      }
    })
  }

  function handleRemoveTag(tagId: string) {
    const prev = new Set(assignments)
    setAssignments((p) => {
      const n = new Set(p)
      n.delete(tagId)
      return n
    })
    startTransition(async () => {
      const result = await removeTagFromContact({ contact_id: contact.id as string, tag_id: tagId })
      if (!result.ok) {
        setAssignments(prev)
        toast({ variant: 'error', title: 'Failed to remove tag', description: result.error })
      } else {
        toast({ variant: 'success', title: 'Tag removed' })
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/admin/crm/contacts"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label="Back to contacts"
          >
            <ArrowLeft size={20} />
          </Link>
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg text-white"
            style={{ backgroundColor: stageColor }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{fullName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted-foreground)]">
              {contact.email != null && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                >
                  <Mail size={13} />
                  {String(contact.email)}
                </a>
              )}
              {contact.phone != null && (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                >
                  <Phone size={13} />
                  {String(contact.phone)}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: stageColor + '20', color: stageColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageColor }} />
            {LIFECYCLE_LABELS[stage]}
          </span>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Edit3 size={14} />
              Edit
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X size={14} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-[var(--color-border)] -mt-2">
        {(
          [
            ['overview', 'Overview'],
            ['timeline', 'Timeline'],
            ['tags', 'Tags'],
            ['linked', 'Linked records'],
          ] as [Tab, string][]
        ).map(([t, label]) => {
          const active = tab === t
          return (
            <button
              key={t}
              role="tab"
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-medium min-h-[44px] transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}
            >
              {label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-primary)]" />
              )}
            </button>
          )
        })}
      </div>

      {tab === 'overview' &&
        (editing ? (
          <EditOverview
            contact={contact}
            onSaved={() => {
              setEditing(false)
              router.refresh()
            }}
          />
        ) : (
          <ViewOverview contact={contact} />
        ))}

      {tab === 'timeline' && (
        <TimelineTab contactId={contact.id as string} activities={activities} />
      )}

      {tab === 'tags' && (
        <TagsTab
          assignments={assignments}
          tags={tags}
          tagPickerOpen={tagPickerOpen}
          setTagPickerOpen={setTagPickerOpen}
          onAdd={handleAddTag}
          onRemove={handleRemoveTag}
          pending={pending}
        />
      )}

      {tab === 'linked' && (
        <LinkedRecordsTab lead={lead} application={application} family={family} contact={contact} />
      )}

      {/* Footer destructive zone */}
      <div className="pt-6 mt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Created {new Date(contact.created_at as string).toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  'Soft-delete this contact? Linked role records (lead/application/family) are kept intact.',
                )
              )
                return
              startTransition(async () => {
                const result = await softDeleteContact(contact.id as string)
                if (!result.ok) {
                  toast({ variant: 'error', title: 'Delete failed', description: result.error })
                  return
                }
                toast({ variant: 'success', title: 'Contact deleted' })
                router.push('/portal/admin/crm/contacts')
              })
            }}
          >
            <Trash2 size={14} />
            Delete contact
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function ViewOverview({ contact }: { contact: Record<string, unknown> }) {
  const fields: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Stage',
      value: LIFECYCLE_LABELS[(contact.lifecycle_stage as LifecycleStage) ?? 'lead'],
    },
    { label: 'Source', value: SOURCE_LABELS[(contact.source as ContactSource) ?? 'manual_admin'] },
    { label: 'Source detail', value: (contact.source_detail as string | null) ?? '—' },
    { label: 'First name', value: (contact.first_name as string | null) ?? '—' },
    { label: 'Last name', value: (contact.last_name as string | null) ?? '—' },
    { label: 'Email', value: (contact.email as string | null) ?? '—' },
    { label: 'Phone', value: (contact.phone as string | null) ?? '—' },
    {
      label: 'Email subscribed',
      value: contact.email_subscribed
        ? 'Yes'
        : `No${contact.email_unsubscribe_reason ? ` (${contact.email_unsubscribe_reason})` : ''}`,
    },
    {
      label: 'First seen',
      value: contact.first_seen_at
        ? new Date(contact.first_seen_at as string).toLocaleString()
        : '—',
    },
    {
      label: 'Last activity',
      value: contact.last_activity_at
        ? new Date(contact.last_activity_at as string).toLocaleString()
        : '—',
    },
    {
      label: 'First touch',
      value:
        [contact.utm_source_first, contact.utm_medium_first, contact.utm_campaign_first]
          .filter(Boolean)
          .join(' · ') || '—',
    },
  ]
  return (
    <Card>
      <CardContent className="p-5">
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {f.label}
              </dt>
              <dd className="text-[var(--color-foreground)] mt-0.5 break-words">{f.value}</dd>
            </div>
          ))}
        </dl>
        {contact.notes != null && String(contact.notes).length > 0 && (
          <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
              Notes
            </p>
            <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
              {String(contact.notes)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EditOverview({
  contact,
  onSaved,
}: {
  contact: Record<string, unknown>
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState((contact.first_name as string | null) ?? '')
  const [lastName, setLastName] = useState((contact.last_name as string | null) ?? '')
  const [email, setEmail] = useState((contact.email as string | null) ?? '')
  const [phone, setPhone] = useState((contact.phone as string | null) ?? '')
  const [stage, setStage] = useState<LifecycleStage>(
    (contact.lifecycle_stage as LifecycleStage) ?? 'lead',
  )
  const [source, setSource] = useState<ContactSource>(
    (contact.source as ContactSource) ?? 'manual_admin',
  )
  const [notes, setNotes] = useState((contact.notes as string | null) ?? '')
  const [emailSubscribed, setEmailSubscribed] = useState(
    (contact.email_subscribed as boolean) ?? true,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateContact({
        id: contact.id as string,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        lifecycle_stage: stage,
        source,
        notes: notes.trim() || null,
        email_subscribed: emailSubscribed,
      })
      if (!result.ok) {
        setError(result.error ?? 'Update failed')
        return
      }
      toast({ variant: 'success', title: 'Contact updated' })
      onSaved()
    })
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LifecycleStage)}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-12 text-base"
            >
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LIFECYCLE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ContactSource)}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-12 text-base"
            >
              {CONTACT_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emailSubscribed}
            onChange={(e) => setEmailSubscribed(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Subscribed to email</span>
        </label>
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" loading={pending} onClick={save}>
            <Save size={14} />
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function TimelineTab({ contactId, activities }: { contactId: string; activities: Activity[] }) {
  const router = useRouter()
  const [noteDraft, setNoteDraft] = useState('')
  const [pending, startTransition] = useTransition()

  function submitNote() {
    const body = noteDraft.trim()
    if (body.length === 0) return
    startTransition(async () => {
      const result = await addContactNote({ contact_id: contactId, body })
      if (!result.ok) {
        toast({ variant: 'error', title: 'Note failed', description: result.error })
        return
      }
      setNoteDraft('')
      toast({ variant: 'success', title: 'Note added' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <StickyNote size={14} className="text-[var(--color-primary)]" />
            Add a note
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            placeholder="Logged a call, sent a tour invite, parent asked about pricing…"
            className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={submitNote}
              loading={pending}
              disabled={pending || !noteDraft.trim()}
            >
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="p-10 text-center">
              <Activity size={20} className="mx-auto text-[var(--color-muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--color-muted-foreground)]">No activity yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {activities.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{a.title}</p>
                    <span className="text-[11px] text-[var(--color-muted-foreground)] shrink-0">
                      {relTime(a.occurred_at)}
                    </span>
                  </div>
                  {a.body && (
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap">
                      {a.body}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]/70">
                    {a.activity_type}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
function TagsTab({
  assignments,
  tags,
  tagPickerOpen,
  setTagPickerOpen,
  onAdd,
  onRemove,
  pending,
}: {
  assignments: Set<string>
  tags: TagRow[]
  tagPickerOpen: boolean
  setTagPickerOpen: (b: boolean) => void
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  pending: boolean
}) {
  const assigned: TagRow[] = []
  const available: TagRow[] = []
  for (const t of tags) {
    if (assignments.has(t.id)) assigned.push(t)
    else available.push(t)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--color-foreground)]">Tags</h3>
          <Button variant="secondary" size="sm" onClick={() => setTagPickerOpen(!tagPickerOpen)}>
            <Plus size={14} />
            Add tag
          </Button>
        </div>
        {assigned.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No tags applied yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigned.map((t) => (
              <button
                key={t.id}
                onClick={() => onRemove(t.id)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-30"
                style={{ backgroundColor: t.color + '20', color: t.color }}
              >
                {t.label}
                <X size={11} />
              </button>
            ))}
          </div>
        )}
        {tagPickerOpen && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-muted-foreground)] mb-2">Click a tag to add</p>
            {available.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                All tags are already applied. Create new tags from the list view.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {available.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onAdd(t.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-30"
                    style={{ color: t.color, borderColor: t.color + '40' }}
                  >
                    <Plus size={11} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function LinkedRecordsTab({
  lead,
  application,
  family,
  contact,
}: {
  lead: Record<string, unknown> | null
  application: Record<string, unknown> | null
  family: Record<string, unknown> | null
  contact: Record<string, unknown>
}) {
  const items: { title: string; href: string; subtitle: string; meta: string }[] = []
  if (lead) {
    items.push({
      title: 'Lead record',
      href: `/portal/admin/leads/${lead.id}`,
      subtitle: `${lead.status} · ${lead.priority}`,
      meta: lead.source ? `From ${lead.source}` : '',
    })
  }
  if (application) {
    items.push({
      title:
        `Application — ${application.student_first_name ?? ''} ${application.student_last_name ?? ''}`.trim(),
      href: `/portal/admin/enrollment`,
      subtitle: `Stage: ${application.pipeline_stage ?? 'unknown'} · Program: ${application.program_type ?? '—'}`,
      meta: application.desired_start_date ? `Start: ${application.desired_start_date}` : '',
    })
  }
  if (family) {
    items.push({
      title: family.family_name ? `Family — ${family.family_name}` : 'Family record',
      href: `/portal/admin/families/${family.id}`,
      subtitle: 'Active enrolled family',
      meta: '',
    })
  }
  if (contact.staff_user_id) {
    items.push({
      title: 'Staff profile',
      href: `/portal/admin/staff`,
      subtitle: 'Active staff member',
      meta: '',
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <Link2 size={20} className="mx-auto text-[var(--color-muted-foreground)] mb-2" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This contact isn&rsquo;t linked to any role records yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--color-border)]">
          {items.map((it) => (
            <li key={it.href + it.title}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--color-muted)]/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-foreground)]">{it.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {it.subtitle}
                    {it.meta && <span className="ml-2">· {it.meta}</span>}
                  </p>
                </div>
                <ExternalLink size={14} className="text-[var(--color-muted-foreground)] shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-foreground)] mb-1">{label}</span>
      {children}
    </label>
  )
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.round(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}
