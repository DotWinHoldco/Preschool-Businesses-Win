'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, X, Mail, Phone, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { addContactsToAudience, removeContactFromAudience } from '@/lib/actions/crm/audiences'
import { LIFECYCLE_COLORS, type LifecycleStage } from '@/lib/schemas/crm'

interface Member {
  contact_id: string
  source: string
  added_at: string
  kanban_column: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  lifecycle_stage: LifecycleStage
}

export function AudienceMembersClient({
  audienceId,
  audienceType,
  members,
  lifecycleLabels,
}: {
  audienceId: string
  audienceType: 'static' | 'dynamic'
  members: Member[]
  lifecycleLabels: Record<LifecycleStage, string>
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const filtered = members.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (m.full_name ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').toLowerCase().includes(q)
    )
  })

  function handleRemove(contactId: string) {
    startTransition(async () => {
      const r = await removeContactFromAudience(audienceId, contactId)
      if (!r.ok) {
        toast({ variant: 'error', title: 'Remove failed', description: r.error })
        return
      }
      toast({ variant: 'success', title: 'Removed' })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-border)]">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
              size={14}
            />
            <Input
              inputSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter members…"
              className="pl-9"
            />
          </div>
          {audienceType === 'static' && (
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <UserPlus size={14} />
              Add contacts
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-muted-foreground)]">
            {members.length === 0 ? 'No members yet.' : 'No members match your filter.'}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {filtered.map((m) => (
              <li
                key={m.contact_id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-muted)]/30"
              >
                <Link
                  href={`/portal/admin/crm/contacts/${m.contact_id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span
                    className="h-8 w-8 rounded-full shrink-0"
                    style={{ backgroundColor: LIFECYCLE_COLORS[m.lifecycle_stage] }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {m.full_name || m.email || m.phone || 'Unnamed contact'}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">
                      {lifecycleLabels[m.lifecycle_stage]}
                      {m.email && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Mail size={10} />
                          {m.email}
                        </span>
                      )}
                      {!m.email && m.phone && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Phone size={10} />
                          {m.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
                {audienceType === 'static' && (
                  <button
                    onClick={() => handleRemove(m.contact_id)}
                    disabled={pending}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Remove from audience"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {pickerOpen && (
        <ContactPickerModal
          audienceId={audienceId}
          alreadyMember={new Set(members.map((m) => m.contact_id))}
          onClose={() => setPickerOpen(false)}
          onAdded={() => router.refresh()}
        />
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
function ContactPickerModal({
  audienceId,
  alreadyMember,
  onClose,
  onAdded,
}: {
  audienceId: string
  alreadyMember: Set<string>
  onClose: () => void
  onAdded: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  async function search(q: string) {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const params = new URLSearchParams({ q: q.trim() })
    const res = await fetch(`/api/crm/contact-search?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as {
      contacts: { id: string; full_name: string | null; email: string | null }[]
    }
    setResults(data.contacts.filter((c) => !alreadyMember.has(c.id)))
  }

  function add() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    startTransition(async () => {
      const r = await addContactsToAudience({ audience_id: audienceId, contact_ids: ids })
      if (!r.ok) {
        toast({ variant: 'error', title: 'Add failed', description: r.error })
        return
      }
      toast({ variant: 'success', title: `Added ${r.count ?? 0}` })
      onAdded()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !pending && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">Add contacts</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search by name or email…"
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto space-y-1">
            {query.length < 2 && (
              <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
                Type at least 2 characters to search.
              </p>
            )}
            {results.length === 0 && query.length >= 2 && (
              <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
                No contacts found (or all matches are already members).
              </p>
            )}
            {results.map((r) => {
              const checked = selected.has(r.id)
              return (
                <label
                  key={r.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${checked ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-muted)]/40'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = new Set(selected)
                      if (next.has(r.id)) next.delete(r.id)
                      else next.add(r.id)
                      setSelected(next)
                    }}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.full_name || r.email}</p>
                    {r.full_name && r.email && (
                      <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                        {r.email}
                      </p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={add} loading={pending} disabled={pending || selected.size === 0}>
            Add {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
