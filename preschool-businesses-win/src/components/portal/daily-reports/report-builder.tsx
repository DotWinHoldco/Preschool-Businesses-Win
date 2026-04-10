'use client'

// @anchor: cca.daily-report.builder
// Staff quick-entry interface for daily reports.
// Buttons: +Meal +Nap +Diaper +Activity +Photo +Note +Mood

import { useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { MoodSelector } from './mood-selector'
import {
  UtensilsCrossed,
  Moon,
  Baby,
  Palette,
  Camera,
  StickyNote,
  Smile,
  X,
  Send,
} from 'lucide-react'

type EntryType = 'meal' | 'nap' | 'diaper' | 'activity' | 'photo' | 'note' | 'mood'

const ENTRY_BUTTONS: Array<{ type: EntryType; icon: typeof UtensilsCrossed; label: string }> = [
  { type: 'meal', icon: UtensilsCrossed, label: 'Meal' },
  { type: 'nap', icon: Moon, label: 'Nap' },
  { type: 'diaper', icon: Baby, label: 'Diaper' },
  { type: 'activity', icon: Palette, label: 'Activity' },
  { type: 'photo', icon: Camera, label: 'Photo' },
  { type: 'note', icon: StickyNote, label: 'Note' },
  { type: 'mood', icon: Smile, label: 'Mood' },
]

interface ReportBuilderProps {
  studentId: string
  studentName: string
  classroomId: string
  reportId?: string
  onEntryAdded?: () => void
  className?: string
}

export function ReportBuilder({
  studentId,
  studentName,
  classroomId,
  reportId,
  onEntryAdded,
  className,
}: ReportBuilderProps) {
  const [activeType, setActiveType] = useState<EntryType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setSubmitting(true)
      setFeedback(null)

      try {
        const formData = new FormData()
        formData.set('report_id', reportId ?? 'auto')
        formData.set('student_id', studentId)
        formData.set('classroom_id', classroomId)
        formData.set('entry_type', activeType ?? '')
        formData.set('data', JSON.stringify(data))

        const res = await fetch('/api/daily-report/entry', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          setFeedback('Entry added!')
          setActiveType(null)
          onEntryAdded?.()
        } else {
          setFeedback('Failed to add entry')
        }
      } catch {
        setFeedback('Network error')
      } finally {
        setSubmitting(false)
        setTimeout(() => setFeedback(null), 2000)
      }
    },
    [activeType, studentId, classroomId, reportId, onEntryAdded],
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Student name */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {studentName}
        </h3>
        {feedback && (
          <span className="text-sm font-medium text-[var(--color-success)]">{feedback}</span>
        )}
      </div>

      {/* Quick-entry buttons */}
      <div className="flex flex-wrap gap-2">
        {ENTRY_BUTTONS.map((btn) => {
          const Icon = btn.icon
          return (
            <button
              key={btn.type}
              type="button"
              onClick={() => setActiveType(activeType === btn.type ? null : btn.type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium min-h-[44px]',
                'border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                activeType === btn.type
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
              )}
            >
              <Icon size={16} />
              +{btn.label}
            </button>
          )
        })}
      </div>

      {/* Active entry form */}
      {activeType && (
        <div className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)] capitalize">
              New {activeType} entry
            </h4>
            <button
              type="button"
              onClick={() => setActiveType(null)}
              className="rounded p-1 hover:bg-[var(--color-muted)]"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {activeType === 'meal' && (
            <MealForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'nap' && (
            <NapForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'diaper' && (
            <DiaperForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'activity' && (
            <ActivityForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'mood' && (
            <MoodForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'note' && (
            <NoteForm onSubmit={handleSubmit} submitting={submitting} />
          )}
          {activeType === 'photo' && (
            <PhotoForm onSubmit={handleSubmit} submitting={submitting} />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-forms
// ---------------------------------------------------------------------------

interface SubFormProps {
  onSubmit: (data: Record<string, unknown>) => void
  submitting: boolean
}

function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius,0.75rem)] px-4 py-2',
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold min-h-[44px]',
        'hover:brightness-110 disabled:opacity-50 transition-all',
      )}
    >
      <Send size={14} />
      {submitting ? 'Saving...' : 'Save'}
    </button>
  )
}

function MealForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          meal_type: fd.get('meal_type'),
          items_offered: (fd.get('items') as string)?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
          amount_eaten: fd.get('amount_eaten'),
          notes: fd.get('notes') || undefined,
        })
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex gap-2">
        {['breakfast', 'lunch', 'snack'].map((t) => (
          <label key={t} className="flex items-center gap-1 text-sm">
            <input type="radio" name="meal_type" value={t} defaultChecked={t === 'lunch'} className="accent-[var(--color-primary)]" />
            <span className="capitalize">{t}</span>
          </label>
        ))}
      </div>
      <input
        name="items"
        placeholder="Items offered (comma separated)"
        className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        {['all', 'most', 'some', 'none'].map((a) => (
          <label key={a} className="flex items-center gap-1 text-sm">
            <input type="radio" name="amount_eaten" value={a} defaultChecked={a === 'all'} className="accent-[var(--color-primary)]" />
            <span className="capitalize">{a}</span>
          </label>
        ))}
      </div>
      <textarea
        name="notes"
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm resize-none"
      />
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function NapForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          started_at: fd.get('started_at'),
          ended_at: fd.get('ended_at'),
          quality: fd.get('quality'),
        })
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex gap-3">
        <label className="flex-1 text-sm">
          <span className="block mb-1 text-[var(--color-muted-foreground)]">Start</span>
          <input type="time" name="started_at" defaultValue="12:00" required className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
        </label>
        <label className="flex-1 text-sm">
          <span className="block mb-1 text-[var(--color-muted-foreground)]">End</span>
          <input type="time" name="ended_at" defaultValue="14:00" required className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="flex gap-2">
        {['restful', 'restless', 'refused'].map((q) => (
          <label key={q} className="flex items-center gap-1 text-sm">
            <input type="radio" name="quality" value={q} defaultChecked={q === 'restful'} className="accent-[var(--color-primary)]" />
            <span className="capitalize">{q}</span>
          </label>
        ))}
      </div>
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function DiaperForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          type: fd.get('type'),
          notes: fd.get('notes') || undefined,
        })
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex gap-2">
        {['wet', 'dry', 'bm'].map((t) => (
          <label key={t} className="flex items-center gap-1 text-sm">
            <input type="radio" name="type" value={t} defaultChecked={t === 'wet'} className="accent-[var(--color-primary)]" />
            <span className="uppercase">{t}</span>
          </label>
        ))}
      </div>
      <input name="notes" placeholder="Notes (optional)" className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function ActivityForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          activity_name: fd.get('activity_name'),
          description: fd.get('description') || undefined,
          engagement_level: fd.get('engagement_level'),
          photo_paths: [],
        })
      }}
      className="flex flex-col gap-3"
    >
      <input name="activity_name" placeholder="Activity name" required className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm resize-none" />
      <div className="flex gap-2">
        {['high', 'medium', 'low'].map((l) => (
          <label key={l} className="flex items-center gap-1 text-sm">
            <input type="radio" name="engagement_level" value={l} defaultChecked={l === 'high'} className="accent-[var(--color-primary)]" />
            <span className="capitalize">{l}</span>
          </label>
        ))}
      </div>
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function MoodForm({ onSubmit, submitting }: SubFormProps) {
  const [mood, setMood] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          overall: mood,
          notes: fd.get('notes') || undefined,
        })
      }}
      className="flex flex-col gap-3"
    >
      <MoodSelector value={mood} onChange={setMood} />
      <input name="notes" placeholder="Notes (optional)" className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function NoteForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          text: fd.get('text'),
          visibility: fd.get('visibility') ?? 'parent',
        })
      }}
      className="flex flex-col gap-3"
    >
      <textarea name="text" placeholder="Note text..." required rows={3} className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm resize-none" />
      <div className="flex gap-2">
        {['parent', 'staff_only'].map((v) => (
          <label key={v} className="flex items-center gap-1 text-sm">
            <input type="radio" name="visibility" value={v} defaultChecked={v === 'parent'} className="accent-[var(--color-primary)]" />
            <span>{v === 'parent' ? 'Visible to parents' : 'Staff only'}</span>
          </label>
        ))}
      </div>
      <SubmitButton submitting={submitting} />
    </form>
  )
}

function PhotoForm({ onSubmit, submitting }: SubFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onSubmit({
          path: fd.get('path') ?? '/placeholder-photo.jpg',
          caption: fd.get('caption') || undefined,
          visibility: fd.get('visibility') ?? 'parent',
        })
      }}
      className="flex flex-col gap-3"
    >
      <div className="rounded-[var(--radius,0.75rem)] border-2 border-dashed border-[var(--color-border)] p-6 text-center">
        <Camera size={24} className="mx-auto mb-2 text-[var(--color-muted-foreground)]" />
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Tap to take a photo or select from gallery
        </p>
        <input type="file" accept="image/*" capture="environment" className="mt-2 text-sm" />
        <input type="hidden" name="path" value="/placeholder-photo.jpg" />
      </div>
      <input name="caption" placeholder="Caption (optional)" className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm" />
      <div className="flex gap-2">
        {['parent', 'staff_only'].map((v) => (
          <label key={v} className="flex items-center gap-1 text-sm">
            <input type="radio" name="visibility" value={v} defaultChecked={v === 'parent'} className="accent-[var(--color-primary)]" />
            <span>{v === 'parent' ? 'Visible to parents' : 'Staff only'}</span>
          </label>
        ))}
      </div>
      <SubmitButton submitting={submitting} />
    </form>
  )
}
