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
} from 'lucide-react'
import { createObservation } from '@/lib/actions/portfolios/create-observation'
import { createLearningStory } from '@/lib/actions/portfolios/create-learning-story'

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
  quarterEnd: string
}

const ENTRY_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  observation: { label: 'Observation', color: 'var(--color-primary)' },
  learning_story: { label: 'Learning Story', color: 'var(--color-accent, #8b5cf6)' },
  work_sample: { label: 'Work Sample', color: 'var(--color-secondary)' },
  photo: { label: 'Photo', color: 'var(--color-success)' },
  video: { label: 'Video', color: 'var(--color-warning)' },
  milestone: { label: 'Milestone', color: 'var(--color-success)' },
}

export function PortfoliosClient({
  students,
  domains,
  entries,
  stats,
  quarterLabel,
  quarterEnd,
}: PortfoliosClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entryMode, setEntryMode] = useState<'observation' | 'learning_story' | 'milestone'>('observation')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [narrative, setNarrative] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'parent' | 'staff_only'>('parent')
  // Learning story fields
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

  // Group domains by domain_name for picker
  const domainGroups = domains.reduce<Record<string, Domain[]>>((acc, d) => {
    const key = d.domain_name
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

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

                      <div className="flex justify-end">
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
          <CardDescription>Students needing developmental assessments this quarter.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.assessmentsDue === 0 ? (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
              <BarChart3 className="mx-auto mb-2" size={28} style={{ color: 'var(--color-success)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>All caught up!</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                All students have been assessed for {quarterLabel}.
              </p>
            </div>
          ) : (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
              <BarChart3 className="mx-auto mb-2" size={28} style={{ color: 'var(--color-warning)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {quarterLabel} Assessments
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {stats.assessmentsDue} student{stats.assessmentsDue !== 1 ? 's' : ''} due for assessment by {quarterEnd}.
              </p>
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
            {/* Entry type toggle */}
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

            {/* Student */}
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

            {/* Title */}
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

            {/* Observation / Milestone: narrative */}
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

            {/* Learning Story: three-part narrative */}
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
                              setSelectedDomains((prev) =>
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

            {/* Visibility */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Visibility:
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'parent'}
                  onChange={() => setVisibility('parent')}
                />
                <Eye size={14} /> Visible to parents
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'staff_only'}
                  onChange={() => setVisibility('staff_only')}
                />
                <EyeOff size={14} /> Staff only
              </label>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{error}</p>
            )}

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
              <Button size="sm" onClick={handleSubmit} loading={isPending} disabled={!studentId || !title.trim()}>
                {entryMode === 'learning_story' ? 'Save Learning Story' : entryMode === 'milestone' ? 'Save Milestone' : 'Save Observation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
