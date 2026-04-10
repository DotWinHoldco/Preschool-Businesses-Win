// @anchor: cca.food-program.meal-recorder
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Check, AlertTriangle, Save } from 'lucide-react'

interface StudentMealRecord {
  student_id: string
  student_name: string
  has_allergy: boolean
  allergens: string[]
  served: boolean
  amount_eaten: 'all' | 'most' | 'some' | 'none' | ''
  notes: string
}

interface MealRecorderProps {
  classroomName: string
  mealType: string
  date: string
  students: Array<{
    id: string
    name: string
    has_allergy: boolean
    allergens: string[]
  }>
  onSave: (records: StudentMealRecord[]) => void
}

const AMOUNTS = [
  { value: 'all', label: 'All', color: 'var(--color-primary)' },
  { value: 'most', label: 'Most', color: 'var(--color-secondary)' },
  { value: 'some', label: 'Some', color: 'var(--color-warning)' },
  { value: 'none', label: 'None', color: 'var(--color-muted-foreground)' },
] as const

export function MealRecorder({ classroomName, mealType, date, students, onSave }: MealRecorderProps) {
  const [records, setRecords] = useState<StudentMealRecord[]>(
    students.map((s) => ({
      student_id: s.id,
      student_name: s.name,
      has_allergy: s.has_allergy,
      allergens: s.allergens,
      served: true,
      amount_eaten: '',
      notes: '',
    }))
  )
  const [saving, setSaving] = useState(false)

  const markAllServed = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, served: true, amount_eaten: 'all' as const })))
  }

  const updateRecord = (studentId: string, field: keyof StudentMealRecord, value: unknown) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, [field]: value } : r))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      onSave(records)
    } finally {
      setSaving(false)
    }
  }

  const servedCount = records.filter((r) => r.served).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Record {mealType.replace('_', ' ')}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {classroomName} - {date} - {servedCount}/{records.length} served
          </p>
        </div>
        <button
          onClick={markAllServed}
          className="rounded-[var(--radius)] border border-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
        >
          All served (ate all)
        </button>
      </div>

      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record.student_id}
            className={cn(
              'rounded-[var(--radius)] border p-3 transition-colors',
              record.has_allergy
                ? 'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-card)]'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Served toggle */}
              <button
                onClick={() => updateRecord(record.student_id, 'served', !record.served)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded border transition-colors flex-shrink-0',
                  record.served
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                )}
              >
                {record.served && <Check className="h-4 w-4 text-[var(--color-primary-foreground)]" />}
              </button>

              {/* Name + allergy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {record.student_name}
                  </span>
                  {record.has_allergy && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-[var(--color-destructive)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-destructive)]">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {record.allergens.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount eaten */}
              {record.served && (
                <div className="flex gap-1">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => updateRecord(record.student_id, 'amount_eaten', a.value)}
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-medium border transition-colors',
                        record.amount_eaten === a.value
                          ? 'border-transparent text-white'
                          : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                      )}
                      style={
                        record.amount_eaten === a.value
                          ? { backgroundColor: a.color }
                          : undefined
                      }
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Meal Records'}
        </button>
      </div>
    </div>
  )
}
