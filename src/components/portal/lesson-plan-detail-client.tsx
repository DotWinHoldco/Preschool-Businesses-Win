'use client'

// @anchor: cca.curriculum.plan-detail-client
// Interactive lesson plan editor: header metadata, 5-day grid with body/reflection,
// activity rows per day, standards mapping.

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Check, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { updateLessonPlan } from '@/lib/actions/curriculum/lesson-plans'
import { upsertLessonPlanDay } from '@/lib/actions/curriculum/plan-days'
import {
  attachPlanActivity,
  deletePlanActivity,
  completePlanActivity,
} from '@/lib/actions/curriculum/plan-activities'
import { mapPlanStandard, unmapPlanStandard } from '@/lib/actions/curriculum/standards'

const DAY_LABELS = [
  '',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

interface PlanData {
  id: string
  title: string
  theme: string | null
  classroom_id: string
  week_start_date: string
  objectives: string | null
  materials: string | null
  faith_component: string | null
  status: string
}

interface Classroom {
  id: string
  name: string
}

interface Day {
  id: string
  day_of_week: number
  title: string | null
  body: string | null
  reflection: string | null
}

interface Activity {
  id: string
  day_of_week: number
  time_slot: string | null
  activity_name: string
  description: string | null
  materials_needed: string | null
  duration_minutes: number | null
  standards_addressed: string[]
  completed: boolean
}

interface MappedStandard {
  standard_id: string
  code: string
  title: string
  framework: string
  coverage_level: 'introduced' | 'practiced' | 'assessed'
}

interface StandardOption {
  id: string
  framework: string
  code: string
  title: string
}

interface LibraryActivity {
  id: string
  title: string
  description: string | null
  subject_area: string | null
  duration_minutes: number | null
  materials: string | null
  instructions: string | null
}

interface Props {
  plan: PlanData
  classrooms: Classroom[]
  days: Day[]
  activities: Activity[]
  mappedStandards: MappedStandard[]
  allStandards: StandardOption[]
  activityLibrary: LibraryActivity[]
}

export default function LessonPlanDetailClient(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [headerEditing, setHeaderEditing] = useState(false)
  const [headerData, setHeaderData] = useState({
    title: props.plan.title,
    theme: props.plan.theme ?? '',
    classroom_id: props.plan.classroom_id,
    week_start_date: props.plan.week_start_date,
    objectives: props.plan.objectives ?? '',
    materials: props.plan.materials ?? '',
    faith_component: props.plan.faith_component ?? '',
    status: props.plan.status,
  })

  function saveHeader() {
    startTransition(async () => {
      const result = await updateLessonPlan({
        id: props.plan.id,
        title: headerData.title.trim(),
        theme: headerData.theme.trim() || null,
        classroom_id: headerData.classroom_id,
        week_start_date: headerData.week_start_date,
        objectives: headerData.objectives.trim() || null,
        materials: headerData.materials.trim() || null,
        faith_component: headerData.faith_component.trim() || null,
        status: headerData.status as 'draft' | 'published' | 'archived',
      })
      if (!result.ok) alert(result.error ?? 'Failed to save')
      else {
        setHeaderEditing(false)
        router.refresh()
      }
    })
  }

  const days = [1, 2, 3, 4, 5].map((dow) => {
    const existing = props.days.find((d) => d.day_of_week === dow)
    return (
      existing ?? {
        id: `new-${dow}`,
        day_of_week: dow,
        title: null,
        body: null,
        reflection: null,
      }
    )
  })

  const classroomName =
    props.classrooms.find((c) => c.id === props.plan.classroom_id)?.name ?? 'Unknown'
  const standardsById = new Map(props.allStandards.map((s) => [s.id, s]))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            {!headerEditing ? (
              <>
                <CardTitle>{props.plan.title}</CardTitle>
                <CardDescription>
                  {classroomName} · Week of {props.plan.week_start_date}
                  {props.plan.theme ? ` · ${props.plan.theme}` : ''}
                </CardDescription>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={props.plan.status === 'published' ? 'success' : 'secondary'}>
                    {props.plan.status}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Editing plan…
              </p>
            )}
          </div>
          {!headerEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setHeaderEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setHeaderEditing(false)
                  setHeaderData({
                    title: props.plan.title,
                    theme: props.plan.theme ?? '',
                    classroom_id: props.plan.classroom_id,
                    week_start_date: props.plan.week_start_date,
                    objectives: props.plan.objectives ?? '',
                    materials: props.plan.materials ?? '',
                    faith_component: props.plan.faith_component ?? '',
                    status: props.plan.status,
                  })
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveHeader} disabled={isPending}>
                <Check size={14} /> {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {headerEditing ? (
            <div className="grid gap-3 md:grid-cols-2">
              <LabeledInput
                label="Title"
                value={headerData.title}
                onChange={(v) => setHeaderData((h) => ({ ...h, title: v }))}
              />
              <LabeledInput
                label="Theme"
                value={headerData.theme}
                onChange={(v) => setHeaderData((h) => ({ ...h, theme: v }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Classroom
                </label>
                <Select
                  value={headerData.classroom_id}
                  onChange={(e) => setHeaderData((h) => ({ ...h, classroom_id: e.target.value }))}
                >
                  {props.classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <LabeledInput
                label="Week Starting"
                type="date"
                value={headerData.week_start_date}
                onChange={(v) => setHeaderData((h) => ({ ...h, week_start_date: v }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Status
                </label>
                <Select
                  value={headerData.status}
                  onChange={(e) => setHeaderData((h) => ({ ...h, status: e.target.value }))}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
              <LabeledTextarea
                label="Objectives"
                value={headerData.objectives}
                onChange={(v) => setHeaderData((h) => ({ ...h, objectives: v }))}
                rows={3}
                className="md:col-span-2"
              />
              <LabeledTextarea
                label="Materials Needed"
                value={headerData.materials}
                onChange={(v) => setHeaderData((h) => ({ ...h, materials: v }))}
                rows={3}
                className="md:col-span-2"
              />
              <LabeledTextarea
                label="Faith Integration"
                value={headerData.faith_component}
                onChange={(v) => setHeaderData((h) => ({ ...h, faith_component: v }))}
                rows={3}
                className="md:col-span-2"
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <Field label="Objectives">{props.plan.objectives ?? '—'}</Field>
              <Field label="Materials">{props.plan.materials ?? '—'}</Field>
              <Field label="Faith Integration">{props.plan.faith_component ?? '—'}</Field>
            </div>
          )}
        </CardContent>
      </Card>

      <StandardsSection
        planId={props.plan.id}
        mapped={props.mappedStandards}
        allStandards={props.allStandards}
        isPending={isPending}
        startTransition={startTransition}
        onChanged={() => router.refresh()}
      />

      <div className="grid gap-4 lg:grid-cols-1">
        {days.map((day) => (
          <DayCard
            key={day.day_of_week}
            planId={props.plan.id}
            day={day}
            activities={props.activities.filter((a) => a.day_of_week === day.day_of_week)}
            standardsById={standardsById}
            activityLibrary={props.activityLibrary}
            isPending={isPending}
            startTransition={startTransition}
            onChanged={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>
        {children}
      </p>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
        {required ? <span style={{ color: 'var(--color-destructive)' }}> *</span> : null}
      </label>
      <Input inputSize="sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function DayCard({
  planId,
  day,
  activities,
  standardsById,
  activityLibrary,
  isPending,
  startTransition,
  onChanged,
}: {
  planId: string
  day: Day
  activities: Activity[]
  standardsById: Map<string, StandardOption>
  activityLibrary: LibraryActivity[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(day.title ?? '')
  const [body, setBody] = useState(day.body ?? '')
  const [reflection, setReflection] = useState(day.reflection ?? '')
  const [addActivityOpen, setAddActivityOpen] = useState(false)

  function save() {
    startTransition(async () => {
      const result = await upsertLessonPlanDay({
        lesson_plan_id: planId,
        day_of_week: day.day_of_week,
        title: title.trim() || null,
        body: body.trim() || null,
        reflection: reflection.trim() || null,
      })
      if (!result.ok) alert(result.error ?? 'Failed to save day')
      else {
        setEditing(false)
        onChanged()
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{DAY_LABELS[day.day_of_week]}</CardTitle>
          {day.title && !editing ? <CardDescription>{day.title}</CardDescription> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAddActivityOpen(true)}>
            <Plus size={14} /> Activity
          </Button>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} />
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setTitle(day.title ?? '')
                  setBody(day.body ?? '')
                  setReflection(day.reflection ?? '')
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={isPending}>
                <Check size={14} />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <LabeledInput label="Day Title" value={title} onChange={setTitle} />
            <LabeledTextarea label="Lesson Body" value={body} onChange={setBody} rows={5} />
            <LabeledTextarea
              label="Reflection"
              value={reflection}
              onChange={setReflection}
              rows={3}
            />
          </div>
        ) : day.body || day.reflection ? (
          <div className="space-y-3 text-sm">
            {day.body ? <Field label="Body">{day.body}</Field> : null}
            {day.reflection ? <Field label="Reflection">{day.reflection}</Field> : null}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            No lesson content yet. Use Edit to add body and activities.
          </p>
        )}

        <div className="space-y-2">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Activities
          </p>
          {activities.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              No activities scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  standardsById={standardsById}
                  startTransition={startTransition}
                  isPending={isPending}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <AddActivityDialog
        open={addActivityOpen}
        onClose={() => setAddActivityOpen(false)}
        planId={planId}
        dayOfWeek={day.day_of_week}
        library={activityLibrary}
        standards={Array.from(standardsById.values())}
        isPending={isPending}
        startTransition={startTransition}
        onAdded={onChanged}
      />
    </Card>
  )
}

function ActivityRow({
  activity,
  standardsById,
  startTransition,
  isPending,
  onChanged,
}: {
  activity: Activity
  standardsById: Map<string, StandardOption>
  startTransition: React.TransitionStartFunction
  isPending: boolean
  onChanged: () => void
}) {
  function toggleComplete() {
    startTransition(async () => {
      const result = await completePlanActivity({
        id: activity.id,
        completed: !activity.completed,
      })
      if (!result.ok) alert(result.error ?? 'Failed to update')
      else onChanged()
    })
  }
  function remove() {
    if (!confirm(`Remove "${activity.activity_name}"?`)) return
    startTransition(async () => {
      const result = await deletePlanActivity({ id: activity.id })
      if (!result.ok) alert(result.error ?? 'Failed to delete')
      else onChanged()
    })
  }
  const linkedStandards = activity.standards_addressed
    .map((id) => standardsById.get(id))
    .filter((s): s is StandardOption => !!s)

  return (
    <li
      className="flex items-start gap-3 rounded-md border p-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        type="button"
        onClick={toggleComplete}
        disabled={isPending}
        aria-label={activity.completed ? 'Mark incomplete' : 'Mark complete'}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors"
        style={{
          borderColor: activity.completed ? 'var(--color-success, #10B981)' : 'var(--color-border)',
          backgroundColor: activity.completed ? 'var(--color-success, #10B981)' : 'transparent',
          color: activity.completed ? '#fff' : 'transparent',
        }}
      >
        <Check size={12} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-sm font-medium"
            style={{
              color: 'var(--color-foreground)',
              textDecoration: activity.completed ? 'line-through' : 'none',
              opacity: activity.completed ? 0.7 : 1,
            }}
          >
            {activity.activity_name}
          </p>
          {activity.time_slot ? (
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              · {activity.time_slot}
            </span>
          ) : null}
          {activity.duration_minutes ? (
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              · {activity.duration_minutes} min
            </span>
          ) : null}
        </div>
        {activity.description ? (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {activity.description}
          </p>
        ) : null}
        {activity.materials_needed ? (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <span className="font-medium">Materials:</span> {activity.materials_needed}
          </p>
        ) : null}
        {linkedStandards.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {linkedStandards.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-[10px]">
                {s.code}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        aria-label="Delete activity"
        className="rounded p-1 transition-colors hover:bg-[var(--color-muted)]"
        style={{ color: 'var(--color-destructive)' }}
      >
        <Trash2 size={14} />
      </button>
    </li>
  )
}

function AddActivityDialog({
  open,
  onClose,
  planId,
  dayOfWeek,
  library,
  standards,
  isPending,
  startTransition,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  planId: string
  dayOfWeek: number
  library: LibraryActivity[]
  standards: StandardOption[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
  onAdded: () => void
}) {
  const [mode, setMode] = useState<'library' | 'custom'>('library')
  const [libraryChoice, setLibraryChoice] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [materials, setMaterials] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setMode('library')
    setLibraryChoice('')
    setName('')
    setDescription('')
    setMaterials('')
    setTimeSlot('')
    setDuration('')
    setSelectedStandards([])
    setError(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let payload: {
      lesson_plan_id: string
      day_of_week: number
      time_slot: string | null
      activity_name: string
      description: string | null
      materials_needed: string | null
      duration_minutes: number | null
      standards_addressed: string[]
    }
    if (mode === 'library') {
      const choice = library.find((l) => l.id === libraryChoice)
      if (!choice) {
        setError('Pick an activity from the library')
        return
      }
      payload = {
        lesson_plan_id: planId,
        day_of_week: dayOfWeek,
        time_slot: timeSlot.trim() || null,
        activity_name: choice.title,
        description: choice.description ?? choice.instructions ?? null,
        materials_needed: choice.materials ?? null,
        duration_minutes: duration === '' ? (choice.duration_minutes ?? null) : Number(duration),
        standards_addressed: selectedStandards,
      }
    } else {
      if (!name.trim()) {
        setError('Activity name is required')
        return
      }
      payload = {
        lesson_plan_id: planId,
        day_of_week: dayOfWeek,
        time_slot: timeSlot.trim() || null,
        activity_name: name.trim(),
        description: description.trim() || null,
        materials_needed: materials.trim() || null,
        duration_minutes: duration === '' ? null : Number(duration),
        standards_addressed: selectedStandards,
      }
    }
    setError(null)
    startTransition(async () => {
      const result = await attachPlanActivity(payload)
      if (!result.ok) setError(result.error ?? 'Failed to add activity')
      else {
        reset()
        onClose()
        onAdded()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent
        title={`Add activity to ${DAY_LABELS[dayOfWeek]}`}
        description="Pick from the library or create a custom activity."
      >
        <DialogClose onClick={onClose} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'library' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('library')}
            >
              From Library
            </Button>
            <Button
              type="button"
              variant={mode === 'custom' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('custom')}
            >
              Custom
            </Button>
          </div>

          {mode === 'library' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Activity
              </label>
              <Select
                value={libraryChoice}
                onChange={(e) => setLibraryChoice(e.target.value)}
                required
              >
                <option value="">Select activity from library…</option>
                {library.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                    {l.subject_area ? ` — ${l.subject_area}` : ''}
                  </option>
                ))}
              </Select>
              {library.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Library is empty. Add activities under Activity Library, or switch to Custom.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <LabeledInput label="Activity name" value={name} onChange={setName} required />
              <LabeledTextarea label="Description" value={description} onChange={setDescription} />
              <LabeledTextarea
                label="Materials needed"
                value={materials}
                onChange={setMaterials}
                rows={2}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Time slot" value={timeSlot} onChange={setTimeSlot} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Duration (min)
              </label>
              <Input
                inputSize="sm"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          {standards.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Standards addressed
              </label>
              <div
                className="max-h-40 overflow-y-auto rounded-md border p-2"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {standards.map((s) => {
                  const checked = selectedStandards.includes(s.id)
                  return (
                    <label
                      key={s.id}
                      className="flex items-start gap-2 py-1 text-sm"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedStandards((cur) =>
                            e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id),
                          )
                        }
                      />
                      <span>
                        <span className="font-medium">{s.code}</span> — {s.title}
                      </span>
                    </label>
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
              {isPending ? 'Adding…' : 'Add activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StandardsSection({
  planId,
  mapped,
  allStandards,
  isPending,
  startTransition,
  onChanged,
}: {
  planId: string
  mapped: MappedStandard[]
  allStandards: StandardOption[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
  onChanged: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [standardId, setStandardId] = useState('')
  const [level, setLevel] = useState<'introduced' | 'practiced' | 'assessed'>('introduced')

  function addMapping(e: FormEvent) {
    e.preventDefault()
    if (!standardId) return
    startTransition(async () => {
      const result = await mapPlanStandard({
        lesson_plan_id: planId,
        standard_id: standardId,
        coverage_level: level,
      })
      if (!result.ok) alert(result.error ?? 'Failed to map')
      else {
        setStandardId('')
        setLevel('introduced')
        setDialogOpen(false)
        onChanged()
      }
    })
  }

  function remove(sid: string) {
    startTransition(async () => {
      const result = await unmapPlanStandard({ lesson_plan_id: planId, standard_id: sid })
      if (!result.ok) alert(result.error ?? 'Failed to remove')
      else onChanged()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Standards alignment</CardTitle>
          <CardDescription>Tag this plan with learning standards it covers.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} /> Map Standard
        </Button>
      </CardHeader>
      <CardContent>
        {mapped.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            No standards mapped yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {mapped.map((m) => (
              <li
                key={m.standard_id}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="min-w-0">
                  <p style={{ color: 'var(--color-foreground)' }}>
                    <span className="font-medium">{m.code}</span> — {m.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {m.framework} · {m.coverage_level}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(m.standard_id)}
                  disabled={isPending}
                  aria-label="Remove mapping"
                  className="rounded p-1 hover:bg-[var(--color-muted)]"
                  style={{ color: 'var(--color-destructive)' }}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent
          title="Map standard"
          description="Attach a learning standard to this lesson plan."
        >
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={addMapping} className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Standard
              </label>
              <Select value={standardId} onChange={(e) => setStandardId(e.target.value)} required>
                <option value="">Select standard…</option>
                {allStandards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                Coverage
              </label>
              <Select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
                <option value="introduced">Introduced</option>
                <option value="practiced">Practiced</option>
                <option value="assessed">Assessed</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Saving…' : 'Map'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
