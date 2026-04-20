'use client'

import { useState, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { GraduationCap, Camera, FileText, BarChart3, Plus, ChevronDown, ChevronUp } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Observation {
  id: string
  student: string
  title: string
  domain: string
  date: string
  teacher: string
  notes: string
}

// ---------------------------------------------------------------------------
// Initial mock data
// ---------------------------------------------------------------------------

const initialObservations: Observation[] = [
  { id: '1', student: 'Sophia Martinez', title: 'Building with blocks — spatial reasoning', domain: 'Math & Logic', date: '2026-04-08', teacher: 'Mrs. Johnson', notes: '' },
  { id: '2', student: 'Liam Chen', title: 'First time sharing toys unprompted', domain: 'Social-Emotional', date: '2026-04-08', teacher: 'Ms. Davis', notes: '' },
  { id: '3', student: 'Emma Wilson', title: 'Recognizing all letters in her name', domain: 'Literacy', date: '2026-04-07', teacher: 'Mrs. Johnson', notes: '' },
  { id: '4', student: 'Noah Brown', title: 'Counting to 20 independently', domain: 'Math & Logic', date: '2026-04-07', teacher: 'Ms. Davis', notes: '' },
]

const students = [
  'Sophia Martinez',
  'Liam Chen',
  'Emma Wilson',
  'Noah Brown',
  'Ava Johnson',
  'Oliver Davis',
]

const domains = [
  'Math & Logic',
  'Social-Emotional',
  'Literacy',
  'Physical Development',
  'Creative Arts',
  'Science & Nature',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPortfoliosClient() {
  const [observations, setObservations] = useState<Observation[]>(initialObservations)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [student, setStudent] = useState('')
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')

  const stats = [
    { label: 'Total Observations', value: String(observations.length), icon: Camera },
    { label: 'Learning Stories', value: '42', icon: FileText },
    { label: 'Assessments Due', value: '12', icon: BarChart3 },
    { label: 'Students with Portfolios', value: '58', icon: GraduationCap },
  ]

  function resetForm() {
    setStudent('')
    setTitle('')
    setDomain('')
    setDate('')
    setNotes('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !student) return

    const newObs: Observation = {
      id: String(Date.now()),
      student: student,
      title: title.trim(),
      domain: domain || 'General',
      date: date || new Date().toISOString().slice(0, 10),
      teacher: 'Current User',
      notes: notes.trim(),
    }

    setObservations(prev => [newObs, ...prev])
    resetForm()
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Portfolios
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Track child development through observations, learning stories, and formal assessments aligned to learning domains.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          Add Entry
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
                  style={{ backgroundColor: 'var(--color-secondary, var(--color-primary))', color: 'var(--color-primary-foreground)' }}
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

      {/* Recent Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Observations</CardTitle>
          <CardDescription>Latest developmental observations logged by teachers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {observations.map((obs) => (
              <div key={obs.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left transition-colors rounded-lg px-2 py-1 -mx-2 hover:bg-[var(--color-muted)]"
                  onClick={() => setExpandedId(expandedId === obs.id ? null : obs.id)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {obs.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {obs.student} &middot; {obs.teacher} &middot; {obs.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                    >
                      {obs.domain}
                    </span>
                    {expandedId === obs.id ? (
                      <ChevronUp size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expandedId === obs.id && (
                  <div
                    className="mt-2 rounded-lg p-4 text-sm"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Student</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{obs.student}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Domain</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{obs.domain}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Teacher</p>
                        <p style={{ color: 'var(--color-foreground)' }}>{obs.teacher}</p>
                      </div>
                    </div>
                    {obs.notes ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Notes</p>
                        <p className="mt-1" style={{ color: 'var(--color-foreground)' }}>{obs.notes}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Detailed observation notes, photos, and developmental milestones will be available when connected to the database.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {observations.length === 0 && (
              <div className="py-8 text-center">
                <Camera className="mx-auto mb-2" size={32} style={{ color: 'var(--color-muted-foreground)' }} />
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No observations yet. Click &ldquo;+ Add Entry&rdquo; to log one.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
          <CardDescription>Quarterly developmental assessments scheduled for completion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
            <BarChart3 className="mx-auto mb-2" size={32} style={{ color: 'var(--color-muted-foreground)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Q2 2026 Assessments
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              12 students due for quarterly assessment by April 30, 2026.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title="Add Portfolio Entry" description="Log a new developmental observation for a student.">
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-student" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Student <span style={{ color: 'var(--color-destructive)' }} aria-hidden="true">*</span>
              </label>
              <Select
                id="pe-student"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                required
              >
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-title" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Title <span style={{ color: 'var(--color-destructive)' }} aria-hidden="true">*</span>
              </label>
              <Input
                id="pe-title"
                inputSize="sm"
                placeholder="e.g. Building with blocks — spatial reasoning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Domain */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-domain" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Learning Domain
              </label>
              <Select
                id="pe-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="">Select domain...</option>
                {domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-date" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Date
              </label>
              <Input
                id="pe-date"
                inputSize="sm"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-notes" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Notes
              </label>
              <Textarea
                id="pe-notes"
                placeholder="Describe what you observed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
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
                Add Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
