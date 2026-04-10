// @anchor: cca.curriculum.lesson-plan-editor
'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { Plus, Save, Trash2, GripVertical } from 'lucide-react'

interface Activity {
  id: string
  day_of_week: number
  time_slot: string
  activity_name: string
  description: string
  materials_needed: string
  duration_minutes: number
  standards_addressed: string[]
  completed: boolean
}

interface LessonPlan {
  id?: string
  classroom_id: string
  week_start_date: string
  title: string
  theme: string
  objectives: string
  materials: string
  faith_component: string
  status: 'draft' | 'published'
  activities: Activity[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
]

interface LessonPlanEditorProps {
  classroomId: string
  initialPlan?: LessonPlan
  onSave?: (plan: LessonPlan) => void
}

export function LessonPlanEditor({ classroomId, initialPlan, onSave }: LessonPlanEditorProps) {
  const [plan, setPlan] = useState<LessonPlan>(
    initialPlan ?? {
      classroom_id: classroomId,
      week_start_date: '',
      title: '',
      theme: '',
      objectives: '',
      materials: '',
      faith_component: '',
      status: 'draft',
      activities: [],
    }
  )

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [saving, setSaving] = useState(false)

  const updateField = useCallback(<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) => {
    setPlan((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addActivity = useCallback((dayIndex: number) => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      day_of_week: dayIndex,
      time_slot: TIME_SLOTS[0],
      activity_name: '',
      description: '',
      materials_needed: '',
      duration_minutes: 30,
      standards_addressed: [],
      completed: false,
    }
    setEditingActivity(newActivity)
  }, [])

  const saveActivity = useCallback((activity: Activity) => {
    setPlan((prev) => {
      const existing = prev.activities.findIndex((a) => a.id === activity.id)
      const activities = [...prev.activities]
      if (existing >= 0) {
        activities[existing] = activity
      } else {
        activities.push(activity)
      }
      return { ...prev, activities }
    })
    setEditingActivity(null)
  }, [])

  const removeActivity = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id),
    }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      onSave?.(plan)
    } finally {
      setSaving(false)
    }
  }, [plan, onSave])

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">Lesson Plan Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Title</label>
            <input
              type="text"
              value={plan.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Exploring Nature Week"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Week Starting</label>
            <input
              type="date"
              value={plan.week_start_date}
              onChange={(e) => updateField('week_start_date', e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Theme</label>
            <input
              type="text"
              value={plan.theme}
              onChange={(e) => updateField('theme', e.target.value)}
              placeholder="e.g., The Seasons"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Faith Component</label>
            <input
              type="text"
              value={plan.faith_component}
              onChange={(e) => updateField('faith_component', e.target.value)}
              placeholder="e.g., God's Creation - Genesis 1"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Objectives</label>
            <textarea
              value={plan.objectives}
              onChange={(e) => updateField('objectives', e.target.value)}
              rows={2}
              placeholder="What will students learn this week?"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Materials Needed</label>
            <textarea
              value={plan.materials}
              onChange={(e) => updateField('materials', e.target.value)}
              rows={2}
              placeholder="List all materials needed for the week"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="grid grid-cols-5 border-b border-[var(--color-border)]">
          {DAYS.map((day, i) => (
            <div key={day} className="p-3 text-center border-r last:border-r-0 border-[var(--color-border)]">
              <span className="text-sm font-semibold text-[var(--color-foreground)]">{day}</span>
              <button
                onClick={() => addActivity(i)}
                className="mt-2 flex items-center justify-center w-full gap-1 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 min-h-[300px]">
          {DAYS.map((_, dayIndex) => (
            <div key={dayIndex} className="border-r last:border-r-0 border-[var(--color-border)] p-2 space-y-2">
              {plan.activities
                .filter((a) => a.day_of_week === dayIndex)
                .map((activity) => (
                  <div
                    key={activity.id}
                    className={cn(
                      'rounded-[var(--radius)] p-2 text-xs cursor-pointer group',
                      activity.completed
                        ? 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] line-through'
                        : 'bg-[var(--color-primary)]/10 text-[var(--color-foreground)]'
                    )}
                    onClick={() => setEditingActivity(activity)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3 text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="font-medium">{activity.activity_name || 'Untitled'}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeActivity(activity.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-destructive)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-[var(--color-muted-foreground)]">{activity.time_slot} - {activity.duration_minutes}min</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Activity editor modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
              {plan.activities.find((a) => a.id === editingActivity.id) ? 'Edit' : 'Add'} Activity
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editingActivity.activity_name}
                onChange={(e) => setEditingActivity({ ...editingActivity, activity_name: e.target.value })}
                placeholder="Activity name"
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editingActivity.time_slot}
                  onChange={(e) => setEditingActivity({ ...editingActivity, time_slot: e.target.value })}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {TIME_SLOTS.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={editingActivity.duration_minutes}
                  onChange={(e) => setEditingActivity({ ...editingActivity, duration_minutes: parseInt(e.target.value) || 30 })}
                  placeholder="Duration (min)"
                  className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <textarea
                value={editingActivity.description}
                onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                rows={3}
                placeholder="Description"
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
              <input
                type="text"
                value={editingActivity.materials_needed}
                onChange={(e) => setEditingActivity({ ...editingActivity, materials_needed: e.target.value })}
                placeholder="Materials needed"
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingActivity(null)}
                className="rounded-[var(--radius)] px-4 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveActivity(editingActivity)}
                className="rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
              >
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Lesson Plan'}
        </button>
      </div>
    </div>
  )
}
