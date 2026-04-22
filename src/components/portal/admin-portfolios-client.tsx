'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Camera, FileText, BarChart3, GraduationCap, Plus,
  ChevronDown, ChevronUp, BookOpen, Eye, EyeOff, ExternalLink,
  Pencil, Trash2, AlertTriangle, ClipboardCheck,
} from 'lucide-react'
import { createObservation } from '@/lib/actions/portfolios/create-observation'
import { createLearningStory } from '@/lib/actions/portfolios/create-learning-story'
import { updatePortfolioEntry } from '@/lib/actions/portfolios/update-entry'
import { deletePortfolioEntry } from '@/lib/actions/portfolios/delete-entry'
import { runAssessment } from '@/lib/actions/portfolios/run-assessment'

interface Student {
  id: string
  name: string
}

interface Domain {
  id: string
  framework: string
  domain_name: string
  subdomain_name: string | null
}

interface PortfolioEntry {
  id: string
  student_id: string
  student_name: string
  entry_type: string
  title: string
  narrative: string
  visibility: string
  learning_domain_ids: string[]
  created_at: string
}

interface Stats {
  observations: number
  learningStories: number
  assessmentsDue: number
  studentsWithPortfolios: number
}

interface PortfoliosClientProps {
  students: Student[]
  domains: Domain[]
  entries: PortfolioEntry[]
  stats: Stats
  quarterLabel: string
  quarterStart: string
  quarterEnd: string
  studentsNeedingAssessment: Student[]
}

const ENTRY_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  observation: { label: 'Observation', color: 'var(--color-primary)' },
  learning_story: { label: 'Learning Story', color: 'var(--color-accent, #8b5cf6)' },
  work_sample: { label: 'Work Sample', color: 'var(--color-secondary)' },
  photo: { label: 'Photo', color: 'var(--color-success)' },
  video: { label: 'Video', color: 'var(--color-warning)' },
  milestone: { label: 'Milestone', color: 'var(--color-success)' },
}

const RATING_OPTIONS = [
  { value: 'not_yet', label: 'Not Yet', color: '#94a3b8' },
  { value: 'emerging', label: 'Emerging', color: '#f59e0b' },
  { value: 'developing', label: 'Developing', color: '#3b82f6' },
  { value: 'proficient', label: 'Proficient', color: '#22c55e' },
  { value: 'exceeding', label: 'Exceeding', color: '#8b5cf6' },
] as const

export function PortfoliosClient({
  students,
  domains,
  entries,
  stats,
  quarterLabel,
  quarterStart,
  quarterEnd,
  studentsNeedingAssessment,
}: PortfoliosClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entryMode, setEntryMode] = useState<'observation' | 'learning_story' | 'milestone'>('observation')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PortfolioEntry | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNarrative, setEditNarrative] = useState('')
  const [editDomains, setEditDomains] = useState<string[]>([])
  const [editVisibility, setEditVisibility] = useState<'parent' | 'staff_only'>('parent')
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<PortfolioEntry | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Assessment state
  const [assessDialogOpen, setAssessDialogOpen] = useState(false)
  const [assessStudentId, setAssessStudentId] = useState('')
  const [assessRatings, setAssessRatings] = useState<Record<string, { rating: string; notes: string }>>({})
  const [assessError, setAssessError] = useState<string | null>(null)

  // Form state
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [narrative, setNarrative] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'parent' | 'staff_only'>('parent')
  const [whatHappened, setWhatHappened] = useState('')
  const [whatLearning, setWhatLearning] = useState('')
  const [whatNext, setWhatNext] = useState('')

  function resetForm() {
    setStudentId('')
    setTitle('')
    setNarrative('')
    setSelectedDomains([])
    setVisibility('parent')
    setWhatHappened('')
    setWhatLearning('')
    setWhatNext('')
    setError(null)
  }

  function handleSubmit() {
    if (!studentId || !title.trim()) return
    setError(null)

    startTransition(async () => {
      let result: { ok: boolean; error?: string }

      if (entryMode === 'learning_story') {
        if (!whatHappened.trim() || !whatLearning.trim()) {
          setError('Please fill in "What Happened" and "What Learning Occurred"')
          return
        }
        result = await createLearningStory({
          student_id: studentId,
          title: title.trim(),
          what_happened: whatHappened.trim(),
          what_learning_occurred: whatLearning.trim(),
          what_next: whatNext.trim() || undefined,
          learning_domain_ids: selectedDomains,
          visibility,
          media: [],
        })
      } else {
        if (!narrative.trim()) {
          setError(entryMode === 'milestone' ? 'Please describe the milestone' : 'Please describe what you observed')
          return
        }
        result = await createObservation({
          student_id: studentId,
          title: title.trim(),
          narrative: narrative.trim(),
          entry_type: entryMode === 'milestone' ? 'milestone' : 'observation',
          learning_domain_ids: selectedDomains,
          visibility,
          media: [],
        })
      }

      if (!result.ok) {
        setError(result.error ?? 'Failed to save entry')
        return
      }

      resetForm()
      setDialogOpen(false)
      router.refresh()
    })
  }

  function openEditDialog(entry: PortfolioEntry) {
    setEditingEntry(entry)
    setEditTitle(entry.title)
    setEditNarrative(entry.narrative)
    setEditDomains([...entry.learning_domain_ids])
    setEditVisibility(entry.visibility as 'parent' | 'staff_only')
    setEditError(null)
    setEditDialogOpen(true)
  }

  function handleEditSubmit() {
    if (!editingEntry || !editTitle.trim() || !editNarrative.trim()) return
    setEditError(null)

    startTransition(async () => {
      const result = await updatePortfolioEntry({
        id: editingEntry!.id,
        title: editTitle.trim(),
        narrative: editNarrative.trim(),
        learning_domain_ids: editDomains,
        visibility: editVisibility,
      })

      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update entry')
        return
      }

      setEditDialogOpen(false)
      setEditingEntry(null)
      router.refresh()
    })
  }

  function openDeleteDialog(entry: PortfolioEntry) {
    setDeletingEntry(entry)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  function handleDeleteConfirm() {
    if (!deletingEntry) return
    setDeleteError(null)

    startTransition(async () => {
      const result = await deletePortfolioEntry({ id: deletingEntry!.id })

      if (!result.ok) {
        setDeleteError(result.error ?? 'Failed to delete entry')
        return
      }

      setDeleteDialogOpen(false)
      setDeletingEntry(null)
      setExpandedId(null)
      router.refresh()
    })
  }

  function openAssessDialog(studentId: string) {
    setAssessStudentId(studentId)
    const initialRatings: Record<string, { rating: string; notes: string }> = {}
    for (const d of domains) {
      initialRatings[d.id] = { rating: 'not_yet', notes: '' }
    }
    setAssessRatings(initialRatings)
    setAssessError(null)
    setAssessDialogOpen(true)
  }

  function handleAssessSubmit() {
    if (!assessStudentId) return
    setAssessError(null)

    const ratings = Object.entries(assessRatings).map(([domainId, val]) => ({
      learning_domain_id: domainId,
      rating: val.rating as 'not_yet' | 'emerging' | 'developing' | 'proficient' | 'exceeding',
      evidence_notes: val.notes || undefined,
      linked_portfolio_entry_ids: [],
    }))

    startTransition(async () => {
      const result = await runAssessment({
        student_id: assessStudentId,
        assessment_period_start: quarterStart,
        assessment_period_end: quarterEnd,
        ratings,
      })

      if (!result.ok) {
        setAssessError(result.error ?? 'Failed to save assessment')
        return
      }

      setAssessDialogOpen(false)
      setAssessStudentId('')
      router.refresh()
    })
  }

  const domainMap = new Map(domains.map((d) => [d.id, d]))

  function getDomainLabel(id: string): string {
    const d = domainMap.get(id)
    if (!d) return ''
    return d.subdomain_name ? `${d.domain_name} › ${d.subdomain_name}` : d.domain_name
  }

  const filteredEntries = filterType === 'all'
    ? entries
    : entries.filter((e) => e.entry_type === filterType)

  const statCards = [
    { label: 'Total Observations', value: stats.observations, icon: Camera },
    { label: 'Learning Stories', value: stats.learningStories, icon: BookOpen },
    { label: 'Assessments Due', value: stats.assessmentsDue, icon: BarChart3 },
    { label: 'Students with Portfolios', value: stats.studentsWithPortfolios, icon: GraduationCap },
  ]

  const domainGroups = domains.reduce<Record<string, Domain[]>>((acc, d) => {
    const key = d.domain_name
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  const assessStudentName = students.find((s) => s.id === assessStudentId)?.name ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Portfolios
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Track child development through observations, learning stories, and formal assessments aligned to learning domains.
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true) }}>
          <Plus size={16} />
          Add Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
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

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Show:</span>
        {[
          { value: 'all', label: 'All' },
          { value: 'observation', label: 'Observations' },
          { value: 'learning_story', label: 'Learning Stories' },
          { value: 'milestone', label: 'Milestones' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilterType(f.value)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: filterType === f.value ? 'var(--color-primary)' : 'var(--color-muted)',
              color: filterType === f.value ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>
            {filteredEntries.length === 0
              ? 'No entries yet. Click "+ Add Entry" to log an observation or learning story.'
              : `${filteredEntries.length} ${filterType === 'all' ? 'entries' : filterType.replace('_', ' ') + 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {filteredEntries.map((entry) => {
              const config = ENTRY_TYPE_CONFIG[entry.entry_type] ?? { label: entry.entry_type, color: 'var(--color-muted-foreground)' }
              const isExpanded = expandedId === entry.id
              return (
                <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left transition-colors rounded-lg px-2 py-1.5 -mx-2 hover:bg-[var(--color-muted)]"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--color-foreground)' }}>
                          {entry.title}
                        </p>
                      </div>
                      <p className="text-xs mt-0.5 pl-4" style={{ color: 'var(--color-muted-foreground)' }}>
                        <Link
                          href={`/portal/admin/students/${entry.student_id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.student_name}
                        </Link>
                        {' · '}
                        {new Date(entry.created_at).toLocaleDateString()}
                        {entry.visibility === 'staff_only' && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] opacity-70">
                            <EyeOff size={10} /> Staff only
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" size="sm">{config.label}</Badge>
                      {isExpanded ? (
                        <ChevronUp size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 rounded-lg p-4 text-sm space-y-3" style={{ backgroundColor: 'var(--color-muted)' }}>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Student</p>
                          <Link
                            href={`/portal/admin/students/${entry.student_id}`}
                            className="text-[var(--color-primary)] hover:underline"
                          >
                            {entry.student_name}
                          </Link>
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Type</p>
                          <p style={{ color: 'var(--color-foreground)' }}>{config.label}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Visibility</p>
                          <p className="flex items-center gap-1" style={{ color: 'var(--color-foreground)' }}>
                            {entry.visibility === 'parent' ? <><Eye size={12} /> Visible to parents</> : <><EyeOff size={12} /> Staff only</>}
                          </p>
                        </div>
                      </div>

                      {entry.learning_domain_ids.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Learning Domains</p>
                          <div className="flex flex-wrap gap-1">
                            {entry.learning_domain_ids.map((id) => (
                              <span
                                key={id}
                                className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' }}
                              >
                                {getDomainLabel(id)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.narrative && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                            {entry.entry_type === 'learning_story' ? 'Story' : 'Notes'}
                          </p>
                          <p className="whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>{entry.narrative}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(entry) }}
                          >
                            <Pencil size={12} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(entry) }}
                            className="text-[var(--color-destructive)] hover:bg-[var(--color-destructive)] hover:text-white"
                          >
                            <Trash2 size={12} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/portal/admin/students/${entry.student_id}`}>
                            <ExternalLink size={12} className="mr-1" />
                            View Student Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredEntries.length === 0 && (
              <div className="py-8 text-center">
                <Camera className="mx-auto mb-2" size={32} style={{ color: 'var(--color-muted-foreground)' }} />
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No entries yet. Click &ldquo;+ Add Entry&rdquo; to log one.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessments Due */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments Due</CardTitle>
          <CardDescription>
            {quarterLabel} developmental assessments — rate each student across all learning domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsNeedingAssessment.length === 0 ? (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
              <BarChart3 className="mx-auto mb-2" size={28} style={{ color: 'var(--color-success)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>All caught up!</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                All students have been assessed for {quarterLabel}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {studentsNeedingAssessment.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
                    >
                      {student.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {student.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Due by {quarterEnd}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openAssessDialog(student.id)}>
                    <ClipboardCheck size={14} className="mr-1" />
                    Assess
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent
          title={entryMode === 'learning_story' ? 'Add Learning Story' : entryMode === 'milestone' ? 'Record Milestone' : 'Add Observation'}
          description={
            entryMode === 'learning_story'
              ? 'Document a child\'s learning journey with a three-part narrative: what happened, what learning occurred, and what\'s next.'
              : entryMode === 'milestone'
                ? 'Record a significant developmental achievement — first steps, first words, a new skill mastered.'
                : 'Log a developmental observation for a student.'
          }
        >
          <DialogClose onClick={() => setDialogOpen(false)} />
          <div className="space-y-4">
            <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--color-muted)' }}>
              {([
                { key: 'observation' as const, label: 'Observation', Icon: Camera },
                { key: 'learning_story' as const, label: 'Learning Story', Icon: BookOpen },
                { key: 'milestone' as const, label: 'Milestone', Icon: GraduationCap },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: entryMode === key ? 'var(--color-card)' : 'transparent',
                    color: 'var(--color-foreground)',
                    boxShadow: entryMode === key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                  onClick={() => setEntryMode(key)}
                >
                  <Icon size={14} className="inline mr-1" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-student" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Student <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <Select id="pe-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-title" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Title <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <Input
                id="pe-title"
                inputSize="sm"
                placeholder={entryMode === 'learning_story' ? 'e.g. The Block Tower Collaboration' : entryMode === 'milestone' ? 'e.g. First time writing full name' : 'e.g. Building with blocks — spatial reasoning'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {(entryMode === 'observation' || entryMode === 'milestone') && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pe-narrative" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {entryMode === 'milestone' ? 'Describe the milestone' : 'What did you observe?'} <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>
                <Textarea
                  id="pe-narrative"
                  placeholder={entryMode === 'milestone'
                    ? 'e.g. First time writing their full name independently...'
                    : 'Describe the behavior, interaction, or milestone you observed...'}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {entryMode === 'learning_story' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pe-what-happened" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    What Happened? <span style={{ color: 'var(--color-destructive)' }}>*</span>
                  </label>
                  <Textarea
                    id="pe-what-happened"
                    placeholder="Describe the event, activity, or interaction..."
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pe-what-learning" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    What Learning Occurred? <span style={{ color: 'var(--color-destructive)' }}>*</span>
                  </label>
                  <Textarea
                    id="pe-what-learning"
                    placeholder="What developmental skills, knowledge, or dispositions were demonstrated?"
                    value={whatLearning}
                    onChange={(e) => setWhatLearning(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pe-what-next" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    What&apos;s Next?
                  </label>
                  <Textarea
                    id="pe-what-next"
                    placeholder="How will you extend or support this learning?"
                    value={whatNext}
                    onChange={(e) => setWhatNext(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              </>
            )}

            {/* Learning Domains */}
            <DomainPicker
              domainGroups={domainGroups}
              selectedDomains={selectedDomains}
              setSelectedDomains={setSelectedDomains}
            />

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Visibility:
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="visibility" checked={visibility === 'parent'} onChange={() => setVisibility('parent')} />
                <Eye size={14} /> Visible to parents
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="visibility" checked={visibility === 'staff_only'} onChange={() => setVisibility('staff_only')} />
                <EyeOff size={14} /> Staff only
              </label>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => { resetForm(); setDialogOpen(false) }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} loading={isPending} disabled={!studentId || !title.trim()}>
                {entryMode === 'learning_story' ? 'Save Learning Story' : entryMode === 'milestone' ? 'Save Milestone' : 'Save Observation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogOverlay onClick={() => setEditDialogOpen(false)} />
        <DialogContent title="Edit Entry" description={editingEntry ? `Editing: ${editingEntry.title}` : ''}>
          <DialogClose onClick={() => setEditDialogOpen(false)} />
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-title" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Title <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <Input
                id="edit-title"
                inputSize="sm"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-narrative" className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {editingEntry?.entry_type === 'learning_story' ? 'Story' : 'Notes'} <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <Textarea
                id="edit-narrative"
                value={editNarrative}
                onChange={(e) => setEditNarrative(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <DomainPicker
              domainGroups={domainGroups}
              selectedDomains={editDomains}
              setSelectedDomains={setEditDomains}
            />

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Visibility:
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="edit-visibility" checked={editVisibility === 'parent'} onChange={() => setEditVisibility('parent')} />
                <Eye size={14} /> Visible to parents
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="edit-visibility" checked={editVisibility === 'staff_only'} onChange={() => setEditVisibility('staff_only')} />
                <EyeOff size={14} /> Staff only
              </label>
            </div>

            {editError && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{editError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditSubmit} loading={isPending} disabled={!editTitle.trim() || !editNarrative.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogOverlay onClick={() => setDeleteDialogOpen(false)} />
        <DialogContent title="Delete Entry" description="This action cannot be undone.">
          <DialogClose onClick={() => setDeleteDialogOpen(false)} />
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}>
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Are you sure you want to delete this entry?</p>
                <p className="mt-1 opacity-90">
                  &ldquo;{deletingEntry?.title}&rdquo; for {deletingEntry?.student_name} will be permanently removed. This is logged in the audit trail.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{deleteError}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteConfirm}
                loading={isPending}
                className="bg-[var(--color-destructive)] text-white hover:opacity-90"
              >
                <Trash2 size={12} className="mr-1" />
                Delete Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={assessDialogOpen} onOpenChange={setAssessDialogOpen}>
        <DialogOverlay onClick={() => setAssessDialogOpen(false)} />
        <DialogContent
          title={`Developmental Assessment — ${assessStudentName}`}
          description={`${quarterLabel} assessment (${quarterStart} to ${quarterEnd}). Rate each learning domain.`}
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setAssessDialogOpen(false)} />
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {RATING_OPTIONS.map((r) => (
                <span key={r.value} className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.label}
                </span>
              ))}
            </div>

            {Object.entries(domainGroups).map(([groupName, groupDomains]) => (
              <div key={groupName}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>
                  {groupName}
                </p>
                <div className="space-y-2">
                  {groupDomains.map((d) => {
                    const current = assessRatings[d.id] ?? { rating: 'not_yet', notes: '' }
                    return (
                      <div
                        key={d.id}
                        className="rounded-lg border p-3"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                          {d.subdomain_name ?? d.domain_name}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {RATING_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setAssessRatings((prev) => ({
                                  ...prev,
                                  [d.id]: { ...current, rating: opt.value },
                                }))
                              }
                              className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border"
                              style={{
                                backgroundColor: current.rating === opt.value ? opt.color : 'transparent',
                                color: current.rating === opt.value ? 'white' : 'var(--color-foreground)',
                                borderColor: current.rating === opt.value ? opt.color : 'var(--color-border)',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <Input
                          inputSize="sm"
                          placeholder="Evidence notes (optional)"
                          value={current.notes}
                          onChange={(e) =>
                            setAssessRatings((prev) => ({
                              ...prev,
                              [d.id]: { ...current, notes: e.target.value },
                            }))
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {assessError && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{assessError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-[var(--color-card)] pb-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAssessDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAssessSubmit} loading={isPending}>
                <ClipboardCheck size={14} className="mr-1" />
                Complete Assessment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DomainPicker({
  domainGroups,
  selectedDomains,
  setSelectedDomains,
}: {
  domainGroups: Record<string, Domain[]>
  selectedDomains: string[]
  setSelectedDomains: (fn: string[] | ((prev: string[]) => string[])) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        Learning Domains
      </label>
      <div className="max-h-[180px] overflow-y-auto rounded-lg border p-2 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        {Object.entries(domainGroups).map(([groupName, groupDomains]) => (
          <div key={groupName}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
              {groupName}
            </p>
            <div className="flex flex-wrap gap-1">
              {groupDomains.map((d) => {
                const isSelected = selectedDomains.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setSelectedDomains((prev: string[]) =>
                        isSelected ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                      )
                    }
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                  >
                    {d.subdomain_name ?? d.domain_name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
