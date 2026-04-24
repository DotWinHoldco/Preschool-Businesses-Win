'use client'

// @anchor: cca.compliance.dfps-standards-client

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import {
  createDfpsStandard,
  updateDfpsStandardStatus,
  deleteDfpsStandard,
} from '@/lib/actions/compliance/dfps-standards'

export type Standard = {
  id: string
  rule_code: string
  subchapter: string | null
  category: string | null
  rule_text: string
  compliance_status: 'compliant' | 'non_compliant' | 'unknown' | 'na'
  notes: string | null
  last_checked_at: string | null
}

export function DfpsStandardsClient({
  standards,
  categories,
}: {
  standards: Standard[]
  categories: string[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [pending, start] = useTransition()
  const [evidenceFor, setEvidenceFor] = useState<{
    id: string
    next: 'compliant' | 'non_compliant'
  } | null>(null)
  const [evidenceNote, setEvidenceNote] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return standards.filter((s) => {
      if (cat && s.category !== cat) return false
      if (status && s.compliance_status !== status) return false
      if (!q) return true
      return (
        s.rule_code.toLowerCase().includes(q) ||
        s.rule_text.toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q)
      )
    })
  }, [standards, search, cat, status])

  function applyStatus(id: string, next: 'compliant' | 'non_compliant') {
    setEvidenceFor({ id, next })
    setEvidenceNote('')
  }

  function confirmStatus() {
    if (!evidenceFor) return
    setError(null)
    start(async () => {
      const res = await updateDfpsStandardStatus({
        id: evidenceFor.id,
        compliance_status: evidenceFor.next,
        evidence_note: evidenceNote || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to update')
        return
      }
      setEvidenceFor(null)
      setEvidenceNote('')
      router.refresh()
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this standard?')) return
    start(async () => {
      const res = await deleteDfpsStandard({ id })
      if (!res.ok) setError(res.error ?? 'Failed to delete')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters + add */}
      <div
        className="flex flex-wrap gap-3 items-end rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Search
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, rule, category..."
              className="pl-9"
              inputSize="sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Category
          </label>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Status
          </label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9">
            <option value="">All</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-compliant</option>
            <option value="unknown">Unknown</option>
            <option value="na">N/A</option>
          </Select>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          Add Standard
        </Button>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
          {error}
        </p>
      )}

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div
            className="p-10 text-center text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            No standards match.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Rule', 'Category', 'Text', 'Status', 'Last checked', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td
                      className="px-4 py-3 font-mono text-xs whitespace-nowrap"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {s.rule_code}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {s.category ?? '—'}
                    </td>
                    <td className="px-4 py-3 max-w-md" style={{ color: 'var(--color-foreground)' }}>
                      <span className="line-clamp-2">{s.rule_text}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          s.compliance_status === 'compliant'
                            ? 'default'
                            : s.compliance_status === 'non_compliant'
                              ? 'danger'
                              : s.compliance_status === 'na'
                                ? 'secondary'
                                : 'outline'
                        }
                      >
                        {s.compliance_status}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {s.last_checked_at ? new Date(s.last_checked_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Mark compliant"
                          title="Mark compliant"
                          disabled={pending}
                          onClick={() => applyStatus(s.id, 'compliant')}
                          className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Mark non-compliant"
                          title="Mark non-compliant"
                          disabled={pending}
                          onClick={() => applyStatus(s.id, 'non_compliant')}
                          className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                          style={{ color: 'var(--color-destructive)' }}
                        >
                          <X size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          disabled={pending}
                          onClick={() => remove(s.id)}
                          className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evidence dialog */}
      <Dialog open={!!evidenceFor} onOpenChange={(v) => !v && setEvidenceFor(null)}>
        <DialogOverlay onClick={() => setEvidenceFor(null)} />
        <DialogContent
          title={evidenceFor?.next === 'compliant' ? 'Mark Compliant' : 'Mark Non-Compliant'}
          description="Add an evidence note (optional)."
        >
          <DialogClose onClick={() => setEvidenceFor(null)} />
          <div className="space-y-3">
            <Textarea
              rows={3}
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="What evidence supports this status?"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setEvidenceFor(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={evidenceFor?.next === 'non_compliant' ? 'danger' : 'primary'}
                className="flex-1"
                loading={pending}
                onClick={confirmStatus}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <AddStandardDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  )
}

function AddStandardDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    rule_code: '',
    category: '',
    subchapter: '',
    rule_text: '',
    compliance_status: 'unknown' as 'compliant' | 'non_compliant' | 'unknown' | 'na',
    notes: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createDfpsStandard({
        rule_code: form.rule_code,
        category: form.category || null,
        subchapter: form.subchapter || null,
        rule_text: form.rule_text,
        applies_to: [],
        compliance_status: form.compliance_status,
        notes: form.notes || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to create')
        return
      }
      onOpenChange(false)
      setForm({
        rule_code: '',
        category: '',
        subchapter: '',
        rule_text: '',
        compliance_status: 'unknown',
        notes: '',
      })
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent
        title="Add Custom Standard"
        description="Add a DFPS rule to the tracked library."
      >
        <DialogClose onClick={() => onOpenChange(false)} />
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              placeholder="Rule code (e.g. 746.1201)"
              value={form.rule_code}
              onChange={(e) => setForm((s) => ({ ...s, rule_code: e.target.value }))}
            />
            <Input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Subchapter"
            value={form.subchapter}
            onChange={(e) => setForm((s) => ({ ...s, subchapter: e.target.value }))}
          />
          <Textarea
            required
            rows={4}
            placeholder="Rule text"
            value={form.rule_text}
            onChange={(e) => setForm((s) => ({ ...s, rule_text: e.target.value }))}
          />
          <Select
            value={form.compliance_status}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                compliance_status: e.target.value as typeof form.compliance_status,
              }))
            }
          >
            <option value="unknown">Unknown</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-compliant</option>
            <option value="na">N/A</option>
          </Select>
          <Textarea
            rows={2}
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
