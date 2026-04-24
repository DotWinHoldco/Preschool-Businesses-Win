'use client'

// @anchor: cca.curriculum.activity-library-client

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  createCurriculumActivity,
  updateCurriculumActivity,
  deleteCurriculumActivity,
} from '@/lib/actions/curriculum/activity-library'

interface Activity {
  id: string
  title: string
  description: string | null
  subject_area: string | null
  age_range_min_months: number | null
  age_range_max_months: number | null
  duration_minutes: number | null
  materials: string | null
  instructions: string | null
  domain_ids: string[]
  tags: string[]
}

interface Domain {
  id: string
  name: string
  framework: string
}

interface Props {
  activities: Activity[]
  domains: Domain[]
}

export default function ActivityLibraryClient({ activities, domains }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [search, setSearch] = useState('')

  const filtered = activities.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      (a.subject_area ?? '').toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(a: Activity) {
    setEditing(a)
    setDialogOpen(true)
  }
  function handleDelete(a: Activity) {
    if (!confirm(`Archive "${a.title}"?`)) return
    startTransition(async () => {
      const res = await deleteCurriculumActivity({ id: a.id })
      if (!res.ok) alert(res.error ?? 'Failed')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          inputSize="sm"
          placeholder="Search by title, subject, tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button size="sm" onClick={openNew}>
          <Plus size={14} /> New Activity
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Library
            className="mx-auto mb-2"
            size={32}
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {activities.length === 0
              ? 'No activities yet. Add your first activity.'
              : 'No activities match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  {a.subject_area ? <CardDescription>{a.subject_area}</CardDescription> : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    aria-label="Edit"
                    className="rounded p-1 hover:bg-[var(--color-muted)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    aria-label="Archive"
                    className="rounded p-1 hover:bg-[var(--color-muted)]"
                    style={{ color: 'var(--color-destructive)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent
                className="space-y-2 text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {a.description ? <p>{a.description}</p> : null}
                <div className="flex flex-wrap gap-1">
                  {a.duration_minutes ? (
                    <Badge variant="secondary">{a.duration_minutes} min</Badge>
                  ) : null}
                  {a.age_range_min_months != null && a.age_range_max_months != null ? (
                    <Badge variant="secondary">
                      {a.age_range_min_months}–{a.age_range_max_months} mo
                    </Badge>
                  ) : null}
                  {a.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
                {a.materials ? (
                  <p>
                    <span className="font-medium">Materials:</span> {a.materials}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ActivityDialog
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

function ActivityDialog({
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
  editing: Activity | null
  domains: Domain[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
  onSaved: () => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [subjectArea, setSubjectArea] = useState(editing?.subject_area ?? '')
  const [duration, setDuration] = useState<number | ''>(editing?.duration_minutes ?? '')
  const [ageMin, setAgeMin] = useState<number | ''>(editing?.age_range_min_months ?? '')
  const [ageMax, setAgeMax] = useState<number | ''>(editing?.age_range_max_months ?? '')
  const [materials, setMaterials] = useState(editing?.materials ?? '')
  const [instructions, setInstructions] = useState(editing?.instructions ?? '')
  const [domainIds, setDomainIds] = useState<string[]>(editing?.domain_ids ?? [])
  const [tagsInput, setTagsInput] = useState((editing?.tags ?? []).join(', '))
  const [error, setError] = useState<string | null>(null)

  if (editing && title === '' && !error) {
    // sync when editing changes
    setTitle(editing.title)
    setDescription(editing.description ?? '')
    setSubjectArea(editing.subject_area ?? '')
    setDuration(editing.duration_minutes ?? '')
    setAgeMin(editing.age_range_min_months ?? '')
    setAgeMax(editing.age_range_max_months ?? '')
    setMaterials(editing.materials ?? '')
    setInstructions(editing.instructions ?? '')
    setDomainIds(editing.domain_ids ?? [])
    setTagsInput((editing.tags ?? []).join(', '))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError(null)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subject_area: subjectArea.trim() || null,
      duration_minutes: duration === '' ? null : Number(duration),
      age_range_min_months: ageMin === '' ? null : Number(ageMin),
      age_range_max_months: ageMax === '' ? null : Number(ageMax),
      materials: materials.trim() || null,
      instructions: instructions.trim() || null,
      domain_ids: domainIds,
      tags,
    }
    startTransition(async () => {
      const res = editing
        ? await updateCurriculumActivity({ id: editing.id, ...payload })
        : await createCurriculumActivity(payload)
      if (!res.ok) setError(res.error ?? 'Failed')
      else onSaved()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent
        title={editing ? 'Edit activity' : 'New activity'}
        description="Activities can be added to any lesson plan."
      >
        <DialogClose onClick={onClose} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            inputSize="sm"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            inputSize="sm"
            placeholder="Subject area (e.g. math, literacy)"
            value={subjectArea}
            onChange={(e) => setSubjectArea(e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              inputSize="sm"
              type="number"
              placeholder="Duration (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            />
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
          <Textarea
            rows={2}
            placeholder="Materials needed"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="Step-by-step instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />

          <Input
            inputSize="sm"
            placeholder="Tags (comma-separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          {domains.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Learning domains
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => {
                  const active = domainIds.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setDomainIds((cur) =>
                          active ? cur.filter((x) => x !== d.id) : [...cur, d.id],
                        )
                      }
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                        color: active
                          ? 'var(--color-primary-foreground)'
                          : 'var(--color-foreground)',
                      }}
                    >
                      {d.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
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
