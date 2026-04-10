'use client'

// @anchor: cca.survey.response-form
// Survey response form for parents/staff to fill out

import { useState } from 'react'
import { Star } from 'lucide-react'
import type { SurveyQuestionType } from '@/lib/schemas/survey'

interface SurveyQuestion {
  id: string
  question_text: string
  question_type: SurveyQuestionType
  options: string[] | null
  required: boolean
  sort_order: number
}

interface SurveyResponseFormProps {
  surveyTitle: string
  surveyDescription: string | null
  questions: SurveyQuestion[]
  onSubmit: (answers: Array<{ question_id: string; answer_value?: string; answer_text?: string }>) => void
  submitting?: boolean
}

export function SurveyResponseForm({ surveyTitle, surveyDescription, questions, onSubmit, submitting = false }: SurveyResponseFormProps) {
  const [answers, setAnswers] = useState<Record<string, { value?: string; text?: string }>>({})

  const setAnswer = (questionId: string, value?: string, text?: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value, text } }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = questions.map((q) => ({
      question_id: q.id,
      answer_value: answers[q.id]?.value,
      answer_text: answers[q.id]?.text,
    }))
    onSubmit(result)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{surveyTitle}</h2>
        {surveyDescription && <p className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>{surveyDescription}</p>}
      </div>

      {questions.sort((a, b) => a.sort_order - b.sort_order).map((q) => (
        <div key={q.id} className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-foreground)' }}>
            {q.question_text}{q.required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
          </p>

          {(q.question_type === 'rating_1_5') && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setAnswer(q.id, String(n))} className="p-1" aria-label={`Rate ${n} out of 5`}>
                  <Star size={28} fill={Number(answers[q.id]?.value) >= n ? 'var(--color-warning)' : 'none'} style={{ color: 'var(--color-warning)' }} />
                </button>
              ))}
            </div>
          )}

          {(q.question_type === 'rating_1_10' || q.question_type === 'nps') && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: q.question_type === 'nps' ? 11 : 10 }, (_, i) => q.question_type === 'nps' ? i : i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setAnswer(q.id, String(n))} className="w-10 h-10 rounded-md border text-sm font-medium transition-colors" style={{ backgroundColor: answers[q.id]?.value === String(n) ? 'var(--color-primary)' : 'transparent', color: answers[q.id]?.value === String(n) ? 'white' : 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                  {n}
                </button>
              ))}
            </div>
          )}

          {q.question_type === 'multiple_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id]?.value === opt} onChange={() => setAnswer(q.id, opt)} />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'yes_no' && (
            <div className="flex gap-3">
              {['Yes', 'No'].map((opt) => (
                <button key={opt} type="button" onClick={() => setAnswer(q.id, opt)} className="flex-1 rounded-md border py-2 text-sm font-medium" style={{ backgroundColor: answers[q.id]?.value === opt ? 'var(--color-primary)' : 'transparent', color: answers[q.id]?.value === opt ? 'white' : 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.question_type === 'text' && (
            <textarea value={answers[q.id]?.text ?? ''} onChange={(e) => setAnswer(q.id, undefined, e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} aria-label={q.question_text} />
          )}
        </div>
      ))}

      <button type="submit" disabled={submitting} className="w-full rounded-md py-3 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
        {submitting ? 'Submitting...' : 'Submit Response'}
      </button>
    </form>
  )
}
