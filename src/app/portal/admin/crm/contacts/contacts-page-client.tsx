'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Filter,
  Plus,
  Users,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Briefcase,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { createContact, createTag } from '@/lib/actions/crm/contacts'

export interface ContactRow {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  lifecycle_stage: LifecycleStage
  source: ContactSource
  source_detail: string | null
  owner_user_id: string | null
  last_activity_at: string
  created_at: string
  has_lead: boolean
  has_application: boolean
  has_family: boolean
  is_staff: boolean
  tag_ids: string[]
}

export interface TagRow {
  id: string
  slug: string
  label: string
  color: string
  description: string | null
  is_system: boolean
}

interface Props {
  contacts: ContactRow[]
  tags: TagRow[]
  total: number
  page: number
  pageSize: number
  filters: { q: string; stage: string; source: string; tag: string }
}

export function ContactsPageClient(props: Props) {
  const { contacts, tags, total, page, pageSize, filters } = props
  const router = useRouter()
  const sp = useSearchParams()

  const [createOpen, setCreateOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.q)

  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function pushParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.delete('page')
    router.push(`/portal/admin/crm/contacts?${next.toString()}`)
  }

  function clearFilters() {
    setSearchValue('')
    router.push('/portal/admin/crm/contacts')
  }

  const activeFilterCount =
    (filters.q ? 1 : 0) + (filters.stage ? 1 : 0) + (filters.source ? 1 : 0) + (filters.tag ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Contacts</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Every person who touches your school — leads, applicants, parents, alumni, staff. One
            unified record per person.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setTagModalOpen(true)}>
            <TagIcon size={16} />
            Manage tags
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                pushParams({ q: searchValue.trim() || null })
              }}
              className="flex-1 relative"
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
                size={16}
              />
              <Input
                inputSize="sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="pl-10"
              />
            </form>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.stage}
                onChange={(e) => pushParams({ stage: e.target.value || null })}
                className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-9 text-sm text-[var(--color-foreground)]"
              >
                <option value="">All stages</option>
                {LIFECYCLE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {LIFECYCLE_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                value={filters.source}
                onChange={(e) => pushParams({ source: e.target.value || null })}
                className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-9 text-sm text-[var(--color-foreground)]"
              >
                <option value="">All sources</option>
                {CONTACT_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                value={filters.tag}
                onChange={(e) => pushParams({ tag: e.target.value || null })}
                className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-9 text-sm text-[var(--color-foreground)]"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <Filter size={12} />
            <span>
              {total.toLocaleString()} contact{total === 1 ? '' : 's'}
              {activeFilterCount > 0 && ` matching filters`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Users size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold text-[var(--color-foreground)]">No contacts yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm">
              Contacts populate automatically from leads, enrollment forms, family records, and
              staff accounts. You can also create one manually.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              New contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Source</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Tags</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-muted)]/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/portal/admin/crm/contacts/${c.id}`} className="block group">
                          <div className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                            {c.full_name || c.email || c.phone || 'Unnamed contact'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                            {c.email && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                                <Mail size={11} />
                                {c.email}
                              </span>
                            )}
                            {c.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone size={11} />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <LifecyclePill stage={c.lifecycle_stage} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {SOURCE_LABELS[c.source]}
                          {c.source_detail && (
                            <span className="text-[var(--color-foreground)]/50">
                              {' · '}
                              {c.source_detail}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {c.tag_ids.slice(0, 3).map((tid) => {
                            const t = tagsById.get(tid)
                            if (!t) return null
                            return (
                              <span
                                key={tid}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ backgroundColor: t.color + '20', color: t.color }}
                              >
                                {t.label}
                              </span>
                            )
                          })}
                          {c.tag_ids.length > 3 && (
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">
                              +{c.tag_ids.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {relativeTime(c.last_activity_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              <ChevronLeft size={14} />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => pushParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {createOpen && (
        <NewContactModal
          tags={tags}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false)
            router.push(`/portal/admin/crm/contacts/${id}`)
          }}
        />
      )}
      {tagModalOpen && <TagsModal tags={tags} onClose={() => setTagModalOpen(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
function LifecyclePill({ stage }: { stage: LifecycleStage }) {
  const color = LIFECYCLE_COLORS[stage]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: color + '20', color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {LIFECYCLE_LABELS[stage]}
    </span>
  )
}

function relativeTime(iso: string): string {
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

// ---------------------------------------------------------------------------
function NewContactModal({
  tags,
  onClose,
  onCreated,
}: {
  tags: TagRow[]
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('lead')
  const [source, setSource] = useState<ContactSource>('manual_admin')
  const [notes, setNotes] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email && !phone) {
      setError('Email or phone is required.')
      return
    }
    startTransition(async () => {
      const result = await createContact({
        email: email.trim() || null,
        phone: phone.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        lifecycle_stage: lifecycleStage,
        source,
        notes: notes.trim() || null,
        tag_ids: Array.from(selectedTagIds),
      })
      if (!result.ok || !result.id) {
        setError(result.error ?? 'Failed to create contact.')
        return
      }
      toast({ variant: 'success', title: 'Contact created' })
      onCreated(result.id)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-3 py-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !pending && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-lg text-[var(--color-foreground)]">New contact</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <select
                value={lifecycleStage}
                onChange={(e) => setLifecycleStage(e.target.value as LifecycleStage)}
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
          {tags.length > 0 && (
            <Field label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const active = selectedTagIds.has(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? t.color : t.color + '20',
                        color: active ? '#fff' : t.color,
                      }}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}
          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </Field>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} disabled={pending} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={pending} disabled={pending}>
            Create contact
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-foreground)] mb-1">{label}</span>
      {children}
    </label>
  )
}

// ---------------------------------------------------------------------------
function TagsModal({ tags, onClose }: { tags: TagRow[]; onClose: () => void }) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#3b70b0')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const PRESET_COLORS = [
    '#3b70b0',
    '#5cb961',
    '#f2b020',
    '#f878af',
    '#4abdac',
    '#f15a50',
    '#94a3b8',
  ]

  function submitNewTag(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!label.trim()) {
      setError('Tag name is required.')
      return
    }
    startTransition(async () => {
      const result = await createTag({ label: label.trim(), color })
      if (!result.ok) {
        setError(result.error ?? 'Failed to create tag.')
        return
      }
      setLabel('')
      toast({ variant: 'success', title: 'Tag created' })
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-3 py-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !pending && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-lg text-[var(--color-foreground)]">Manage tags</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <form onSubmit={submitNewTag} className="space-y-3">
            <Field label="New tag name">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VIP, Tour requested, Sibling discount…"
              />
            </Field>
            <div>
              <span className="block text-xs font-medium mb-1">Color</span>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" loading={pending} disabled={pending} size="sm">
              <Plus size={14} />
              Create tag
            </Button>
          </form>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-xs font-medium mb-2 text-[var(--color-muted-foreground)] uppercase tracking-wider">
              Existing tags ({tags.length})
            </p>
            {tags.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No tags yet.</p>
            ) : (
              <div className="space-y-1.5">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-muted)]/40"
                  >
                    <span
                      className="inline-flex items-center gap-2 text-sm font-medium"
                      style={{ color: t.color }}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                      {t.is_system && (
                        <Badge variant="outline">
                          <Briefcase size={10} />
                          system
                        </Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
