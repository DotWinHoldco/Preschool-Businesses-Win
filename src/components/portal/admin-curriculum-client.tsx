'use client'

// @anchor: cca.curriculum.admin-client
// Client component: list of lesson plans with real CRUD (create, delete, link to detail).

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { createLessonPlan, deleteLessonPlan } from '@/lib/actions/curriculum/lesson-plans'

interface PlanRow {
  id: string
  title: string
  classroomId: string
  classroomName: string
  weekStart: string
  theme: string | null
  status: 'draft' | 'published' | 'archived'
}

interface ClassroomOption {
  id: string
  name: string
}

interface Props {
  initialPlans: PlanRow[]
  classrooms: ClassroomOption[]
}

export default function AdminCurriculumClient({ initialPlans, classrooms }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id ?? '')
  const [weekStart, setWeekStart] = useState('')
  const [theme, setTheme] = useState('')
  const [objectives, setObjectives] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  function resetForm() {
    setTitle('')
    setClassroomId(classrooms[0]?.id ?? '')
    setWeekStart('')
    setTheme('')
    setObjectives('')
    setStatus('draft')
    setError(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !classroomId || !weekStart) {
      setError('Title, classroom, and week start are required.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createLessonPlan({
        title: title.trim(),
        classroom_id: classroomId,
        week_start_date: weekStart,
        theme: theme.trim() || null,
        objectives: objectives.trim() || null,
        status,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed to create lesson plan')
        return
      }
      resetForm()
      setDialogOpen(false)
      if (result.id) router.push(`/portal/admin/curriculum/${result.id}`)
      else router.refresh()
    })
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete lesson plan "${title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteLessonPlan({ id })
      if (!result.ok) alert(result.error ?? 'Failed to delete')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          New Lesson Plan
        </Button>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {initialPlans.map((plan) => (
          <div key={plan.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
            <Link
              href={`/portal/admin/curriculum/${plan.id}`}
              className="flex flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-[var(--color-muted)]"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                  {plan.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {plan.classroomName} · Week of {plan.weekStart}
                  {plan.theme ? ` · ${plan.theme}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      plan.status === 'published'
                        ? 'var(--color-success, #10B981)'
                        : plan.status === 'archived'
                          ? 'var(--color-muted)'
                          : 'var(--color-muted)',
                    color: plan.status === 'published' ? '#fff' : 'var(--color-muted-foreground)',
                  }}
                >
                  {plan.status === 'published'
                    ? 'Published'
                    : plan.status === 'archived'
                      ? 'Archived'
                      : 'Draft'}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--color-muted-foreground)' }} />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(plan.id, plan.title)}
              disabled={isPending}
              aria-label={`Delete ${plan.title}`}
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
              style={{ color: 'var(--color-destructive)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {initialPlans.length === 0 && (
          <div className="py-8 text-center">
            <BookOpen
              className="mx-auto mb-2"
              size={32}
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No lesson plans yet. Click &ldquo;+ New Lesson Plan&rdquo; to create one.
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => !isPending && setDialogOpen(false)} />
        <DialogContent
          title="New Lesson Plan"
          description="Create a new weekly lesson plan for a classroom."
        >
          <DialogClose onClick={() => !isPending && setDialogOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lp-title"
                className="text-sm font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                Title <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <Input
                id="lp-title"
                inputSize="sm"
                placeholder="e.g. Spring Flowers & Growth"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="lp-classroom"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Classroom <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>
                <Select
                  id="lp-classroom"
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  required
                >
                  <option value="">Select classroom…</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="lp-week"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Week Starting <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>
                <Input
                  id="lp-week"
                  inputSize="sm"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lp-theme"
                className="text-sm font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                Theme
              </label>
              <Input
                id="lp-theme"
                inputSize="sm"
                placeholder="e.g. Spring & Growth"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lp-objectives"
                className="text-sm font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                Objectives
              </label>
              <Textarea
                id="lp-objectives"
                rows={3}
                placeholder="Learning objectives for the week…"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lp-status"
                className="text-sm font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                Status
              </label>
              <Select
                id="lp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetForm()
                  setDialogOpen(false)
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
