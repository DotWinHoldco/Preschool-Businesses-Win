'use client'

// @anchor: cca.curriculum.standards-client

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  createLearningStandard,
  updateLearningStandard,
  deleteLearningStandard,
} from '@/lib/actions/curriculum/standards'

interface Standard {
  id: string
  framework: string
  code: string
  title: string
  description: string | null
  domain_id: string | null
  age_range_min_months: number | null
  age_range_max_months: number | null
  sort_order: number
}

interface Domain {
  id: string
  name: string
  framework: string
}

interface Props {
  standards: Standard[]
  domains: Domain[]
}

const FRAMEWORKS = ['texas_prek_guidelines', 'naeyc', 'head_start_elof', 'cca_faith', 'custom']

export default function StandardsClient({ standards, domains }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Standard | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const frameworks = Array.from(new Set(standards.map((s) => s.framework)))
  const filtered = filter === 'all' ? standards : standards.filter((s) => s.framework === filter)

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(s: Standard) {
    setEditing(s)
    setDialogOpen(true)
  }
  function handleDelete(s: Standard) {
    if (!confirm(`Delete standard ${s.code}?`)) return
    startTransition(async () => {
      const res = await deleteLearningStandard({ id: s.id })
      if (!res.ok) alert(res.error ?? 'Failed')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: filter === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: filter === 'all' ? 'var(--color-primary)' : 'transparent',
              color:
                filter === 'all' ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
            }}
          >
            All ({standards.length})
          </button>
          {frameworks.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: filter === f ? 'var(--color-primary)' : 'transparent',
                color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus size={14} /> New Standard
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <GraduationCap
            className="mx-auto mb-2"
            size={32}
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {standards.length === 0
              ? 'No standards yet. Add one to begin tracking alignment.'
              : 'No standards in this framework.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s.framework}</Badge>
                    <CardTitle className="text-sm font-bold">{s.code}</CardTitle>
                  </div>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {s.title}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    aria-label="Edit"
                    className="rounded p-1 hover:bg-[var(--color-muted)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    aria-label="Delete"
                    className="rounded p-1 hover:bg-[var(--color-muted)]"
                    style={{ color: 'var(--color-destructive)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardHeader>
              {s.description ? (
                <CardContent
                  className="py-2 text-xs"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {s.description}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <StandardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        domains={domains}
        isPending={isPending}
        startTransition={startTransition}
        onSaved={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

function StandardDialog({
  open,
  onClose,
  editing,
  domains,
  isPending,
  startTransition,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  editing: Standard | null
  domains: Domain[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
  onSaved: () => void
}) {
  const [framework, setFramework] = useState(editing?.framework ?? 'texas_prek_guidelines')
  const [code, setCode] = useState(editing?.code ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [domainId, setDomainId] = useState(editing?.domain_id ?? '')
  const [ageMin, setAgeMin] = useState<number | ''>(editing?.age_range_min_months ?? '')
  const [ageMax, setAgeMax] = useState<number | ''>(editing?.age_range_max_months ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim() || !title.trim()) {
      setError('Code and title are required')
      return
    }
    setError(null)
    const payload = {
      framework,
      code: code.trim(),
      title: title.trim(),
      description: description.trim() || null,
      domain_id: domainId || null,
      age_range_min_months: ageMin === '' ? null : Number(ageMin),
      age_range_max_months: ageMax === '' ? null : Number(ageMax),
      sort_order: editing?.sort_order ?? 0,
    }
    startTransition(async () => {
      const res = editing
        ? await updateLearningStandard({ id: editing.id, ...payload })
        : await createLearningStandard(payload)
      if (!res.ok) setError(res.error ?? 'Failed')
      else onSaved()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent
        title={editing ? 'Edit standard' : 'New standard'}
        description="Define a learning standard for plan alignment."
      >
        <DialogClose onClick={onClose} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Framework
              </label>
              <Select value={framework} onChange={(e) => setFramework(e.target.value)}>
                {FRAMEWORKS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              inputSize="sm"
              placeholder="Code (e.g. M1.A)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Input
            inputSize="sm"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            rows={3}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {domains.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Domain
              </label>
              <Select value={domainId} onChange={(e) => setDomainId(e.target.value)}>
                <option value="">None</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Input
              inputSize="sm"
              type="number"
              placeholder="Age min (mo)"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              inputSize="sm"
              type="number"
              placeholder="Age max (mo)"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          {error ? (
            <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
