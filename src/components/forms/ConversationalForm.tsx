'use client'

// @anchor: platform.form-builder.conversational-renderer

import { useState, useCallback, useEffect } from 'react'
import { FormField } from '@/components/forms/fields'
import { evaluateLogicRules, type LogicRule } from '@/lib/forms/logic-engine'
import { submitFormResponse } from '@/lib/actions/form-responses'
import { saveDraft } from '@/lib/actions/form-responses'
import { LAYOUT_FIELD_TYPES, AUTO_ADVANCE_TYPES } from '@/lib/schemas/form'
import type { FormFieldType } from '@/lib/schemas/form'
import { Button } from '@/components/ui/button'

interface FormFieldDef {
  id: string
  field_key: string
  field_type: FormFieldType
  label: string | null
  description: string | null
  placeholder: string | null
  config: Record<string, unknown>
  validation_rules: Record<string, unknown>
  logic_rules: Record<string, unknown>[]
  is_required: boolean
  sort_order: number
}

interface Props {
  formId: string
  fields: FormFieldDef[]
  thankYouTitle?: string
  thankYouMessage?: string
  thankYouRedirectUrl?: string
  initialValues?: Record<string, unknown>
  initialStep?: number
  resumeToken?: string
  tenantSlug?: string
}

export function ConversationalForm({
  formId, fields, thankYouTitle, thankYouMessage, thankYouRedirectUrl,
  initialValues, initialStep, resumeToken,
}: Props) {
  const inputFields = fields.filter(f => !LAYOUT_FIELD_TYPES.includes(f.field_type))
  const [currentIndex, setCurrentIndex] = useState(initialStep || 0)
  const [values, setValues] = useState<Record<string, unknown>>(initialValues || {})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftToken, setDraftToken] = useState(resumeToken)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const visibleFields = inputFields.filter(f => {
    if (!f.logic_rules?.length) return true
    const { visible } = evaluateLogicRules(f.logic_rules as unknown as LogicRule[], values)
    return visible
  })

  const currentField = visibleFields[currentIndex]
  const isLastField = currentIndex >= visibleFields.length - 1
  const progress = visibleFields.length > 0 ? ((currentIndex + 1) / visibleFields.length) * 100 : 0

  const handleChange = useCallback((value: unknown) => {
    if (!currentField) return
    const newValues = { ...values, [currentField.field_key]: value }
    setValues(newValues)

    if (AUTO_ADVANCE_TYPES.includes(currentField.field_type) && value !== null && value !== undefined) {
      setTimeout(() => {
        if (!isLastField) {
          setDirection('forward')
          setCurrentIndex(prev => prev + 1)
        }
      }, 400)
    }
  }, [currentField, values, isLastField])

  useEffect(() => {
    if (Object.keys(values).length > 0 && currentField) {
      saveDraft(formId, values, currentIndex, draftToken).then(res => {
        if (res.ok && res.token) setDraftToken(res.token)
      })
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentField?.is_required && !values[currentField.field_key]) {
      setError('This field is required')
      return
    }
    setError(undefined)
    if (isLastField) {
      handleSubmit()
    } else {
      setDirection('forward')
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentField, values, isLastField])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setError(undefined)
      setDirection('back')
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setError(undefined)
    const result = await submitFormResponse({
      form_id: formId,
      values,
      draft_token: draftToken,
    })
    setIsSubmitting(false)
    if (result.ok) {
      setSubmitted(true)
      if (thankYouRedirectUrl) {
        window.location.href = thankYouRedirectUrl
      }
    } else {
      setError(result.error || 'Submission failed')
    }
  }, [formId, values, draftToken, thankYouRedirectUrl])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey && currentField && !AUTO_ADVANCE_TYPES.includes(currentField.field_type)) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, currentField])

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
          {thankYouTitle || 'Thank you!'}
        </h2>
        <p className="text-base" style={{ color: 'var(--color-muted-foreground)' }}>
          {thankYouMessage || 'Your response has been submitted.'}
        </p>
      </div>
    )
  }

  if (!currentField) {
    return <div className="p-8 text-center">No fields configured.</div>
  }

  return (
    <div className="flex flex-col min-h-[80vh]">
      <div className="h-1 w-full" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          key={currentField.id}
          className="w-full max-w-lg space-y-6"
          style={{
            animation: `${direction === 'forward' ? 'slideUp' : 'slideDown'} 0.4s ease-out`,
          }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted-foreground)' }}>
              {currentIndex + 1} of {visibleFields.length}
            </p>
            {currentField.label && (
              <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>
                {currentField.label}
                {currentField.is_required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
              </h2>
            )}
            {currentField.description && (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{currentField.description}</p>
            )}
          </div>

          <FormField
            field={currentField}
            value={values[currentField.field_key]}
            onChange={handleChange}
            autoFocus
          />

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>{error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button type="button" onClick={handleBack} disabled={currentIndex === 0} className="text-sm font-medium disabled:opacity-30" style={{ color: 'var(--color-muted-foreground)' }}>
          ← Back
        </button>
        <Button onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : isLastField ? 'Submit' : 'Next →'}
        </Button>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideUp { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideDown { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </div>
  )
}
