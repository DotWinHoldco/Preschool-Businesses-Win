'use client'

import { useState, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { BookOpen, Calendar, Library, GraduationCap, Plus, ChevronDown, ChevronUp } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonPlan {
  id: string
  title: string
  classroom: string
  weekStart: string
  status: 'draft' | 'published'
}

// ---------------------------------------------------------------------------
// Initial mock data
// ---------------------------------------------------------------------------

const initialPlans: LessonPlan[] = [
  { id: '1', title: 'Spring Flowers & Growth', classroom: 'Butterfly Room', weekStart: '2026-04-06', status: 'published' },
  { id: '2', title: 'Community Helpers', classroom: 'Sunshine Room', weekStart: '2026-04-06', status: 'published' },
  { id: '3', title: 'Under the Sea', classroom: 'Rainbow Room', weekStart: '2026-04-06', status: 'draft' },
  { id: '4', title: 'Easter Week', classroom: 'Butterfly Room', weekStart: '2026-04-13', status: 'draft' },
]

const classrooms = ['Butterfly Room', 'Sunshine Room', 'Rainbow Room']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminCurriculumClient() {
  const [plans, setPlans] = useState<LessonPlan[]>(initialPlans)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [classroom, setClassroom] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  const stats = [
    { label: 'Active Lesson Plans', value: String(plans.filter(p => p.status === 'published').length), icon: Calendar },
    { label: 'Activity Library', value: '124', icon: Library },
    { label: 'Standards Mapped', value: '47', icon: GraduationCap },
    { label: 'This Week\'s Plans', value: String(plans.length), icon: BookOpen },
  ]

  function resetForm() {
    setTitle('')
    setClassroom('')
    setWeekStart('')
    setStatus('draft')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const newPlan: LessonPlan = {
      id: String(Date.now()),
      title: title.trim(),
      classroom: classroom || classrooms[0],
      weekStart: weekStart || new Date().toISOString().slice(0, 10),
      status,
    }

    setPlans(prev => [newPlan, ...prev])
    resetForm()
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Curriculum
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Manage lesson plans, browse the activity library, and track standards alignment across classrooms.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          New Lesson Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Lesson Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lesson Plans</CardTitle>
          <CardDescription>View and manage weekly lesson plans by classroom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {plans.map((plan) => (
              <div key={plan.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left transition-colors rounded-lg px-2 py-1 -mx-2 hover:bg-[var(--color-muted)]"
                  onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {plan.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {plan.classroom} &middot; Week of {plan.weekStart}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: plan.status === 'published'
                          ? 'var(--color-success, #10B981)'
                          : 'var(--color-muted)',
                        color: plan.status === 'published'
                          ? '#fff'
                          : 'var(--color-muted-foreground)',
                      }}
                    >
                      {plan.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    {expandedId === plan.id ? (
                      <ChevronUp size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expandedId === plan.id && (
                  <div
                    className="mt-2 rounded-lg p-4 text-sm"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Classroom</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{plan.classroom}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Week Starting</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{plan.weekStart}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Status</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{plan.status === 'published' ? 'Published' : 'Draft'}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      Full lesson plan details, activities, and standards alignment will be available when connected to the database.
                    </p>
                  </div>
                )}
              </div>
            ))}

            {plans.length === 0 && (
              <div className="py-8 text-center">
                <BookOpen className="mx-auto mb-2" size={32} style={{ color: 'var(--color-muted-foreground)' }} />
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No lesson plans yet. Click &ldquo;+ New Lesson Plan&rdquo; to create one.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Lesson Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title="New Lesson Plan" description="Create a new weekly lesson plan for a classroom.">
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lp-title" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Title <span style={{ color: 'var(--color-destructive)' }} aria-hidden="true">*</span>
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

            {/* Classroom */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lp-classroom" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Classroom
              </label>
              <Select
                id="lp-classroom"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
              >
                <option value="">Select classroom...</option>
                {classrooms.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            {/* Week Start */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lp-week" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Week Starting
              </label>
              <Input
                id="lp-week"
                inputSize="sm"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lp-status" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { resetForm(); setDialogOpen(false) }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Plan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
