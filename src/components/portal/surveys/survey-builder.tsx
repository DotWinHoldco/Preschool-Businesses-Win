'use client'

// @anchor: cca.survey.builder
// Drag-and-drop survey builder
// See CCA_BUILD_BRIEF.md §29

import { useState, useCallback } from 'react'
import { Plus, GripVertical, Trash2, Save } from 'lucide-react'
import type { SurveyQuestionType, SurveyTargetAudience } from '@/lib/schemas/survey'

interface QuestionDraft {
  id: string
  question_text: string
  question_type: SurveyQuestionType
  options: string[]
  required: boolean
  sort_order: number
}

interface SurveyBuilderProps {
  onSave: (data: {
    title: string
    description: string
    target_audience: SurveyTargetAudience
    anonymous: boolean
    questions: QuestionDraft[]
  }) => void
  saving?: boolean
}

const QUESTION_TYPES: Array<{ value: SurveyQuestionType; label: string }> = [
  { value: 'rating_1_5', label: '1-5 Star Rating' },
  { value: 'rating_1_10', label: '1-10 Scale' },
  { value: 'nps', label: 'NPS (0-10)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Free Text' },
  { value: 'yes_no', label: 'Yes / No' },
]

export function SurveyBuilder({ onSave, saving = false }: SurveyBuilderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState<SurveyTargetAudience>('all_parents')
  const [anonymous, setAnonymous] = useState(false)
  const [questions, setQuestions] = useState<QuestionDraft[]>([])

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question_text: '',
        question_type: 'rating_1_5',
        options: [],
        required: true,
        sort_order: prev.length,
      },
    ])
  }, [])

  const updateQuestion = useCallback((id: string, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }, [])

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, sort_order: i })))
  }, [])

  const addOption = useCallback((questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, ''] } : q)),
    )
  }, [])

  const updateOption = useCallback((questionId: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const newOptions = [...q.options]
        newOptions[index] = value
        return { ...q, options: newOptions }
      }),
    )
  }, [])

  const handleSave = () => {
    if (!title.trim() || questions.length === 0) return
    onSave({ title, description, target_audience: targetAudience, anonymous, questions })
  }

  return (
    <div className="space-y-6">
      {/* Survey details */}
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Survey Details</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="survey-title" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Title</label>
            <input id="survey-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q1 Parent Satisfaction Survey" className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
          </div>
          <div>
            <label htmlFor="survey-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Description</label>
            <textarea id="survey-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="survey-audience" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Target Audience</label>
              <select id="survey-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as SurveyTargetAudience)} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                <option value="all_parents">All Parents</option>
                <option value="classroom">Specific Classroom</option>
                <option value="staff">All Staff</option>
                <option value="custom">Custom List</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm pb-2" style={{ color: 'var(--color-foreground)' }}>
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                Anonymous
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Questions ({questions.length})</h3>
          <button type="button" onClick={addQuestion} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={16} /> Add Question
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-md border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="mt-2 cursor-grab" style={{ color: 'var(--color-muted-foreground)' }} />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <input type="text" value={q.question_text} onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })} placeholder={`Question ${idx + 1}`} className="flex-1 rounded-md border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} aria-label={`Question ${idx + 1} text`} />
                    <select value={q.question_type} onChange={(e) => updateQuestion(q.id, { question_type: e.target.value as SurveyQuestionType })} className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} aria-label={`Question ${idx + 1} type`}>
                      {QUESTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                  {q.question_type === 'multiple_choice' && (
                    <div className="space-y-2 pl-4">
                      {q.options.map((opt, oi) => (
                        <input key={oi} type="text" value={opt} onChange={(e) => updateOption(q.id, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="w-full rounded-md border px-3 py-1 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} aria-label={`Question ${idx + 1} option ${oi + 1}`} />
                      ))}
                      <button type="button" onClick={() => addOption(q.id)} className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>+ Add option</button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => removeQuestion(q.id)} className="mt-1 rounded p-1" style={{ color: 'var(--color-destructive)' }} aria-label={`Remove question ${idx + 1}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted-foreground)' }}>No questions yet. Add your first question above.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={!title.trim() || questions.length === 0 || saving} className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Survey'}
        </button>
      </div>
    </div>
  )
}
