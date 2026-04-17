'use client'

// @anchor: platform.form-builder.document-renderer

import { useState, useCallback } from 'react'
import { FormField } from '@/components/forms/fields'
import { evaluateLogicRules, type LogicRule } from '@/lib/forms/logic-engine'
import { submitFormResponse } from '@/lib/actions/form-responses'
import { LAYOUT_FIELD_TYPES } from '@/lib/schemas/form'
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
  section_id: string | null
}

interface FormSectionDef {
  id: string
  title: string | null
  description: string | null
  sort_order: number
  logic_rules: Record<string, unknown>[]
}

interface Props {
  formId: string
  fields: FormFieldDef[]
  sections: FormSectionDef[]
  thankYouTitle?: string
  thankYouMessage?: string
  thankYouRedirectUrl?: string
}

export function DocumentForm({
  formId, fields, sections, thankYouTitle, thankYouMessage, thankYouRedirectUrl,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((fieldKey: string, value: unknown) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }))
    setErrors(prev => { const next = { ...prev }; delete next[fieldKey]; return next })
  }, [])

  const handleSubmit = useCallback(async () => {
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.is_required && !values[field.field_key] && !LAYOUT_FIELD_TYPES.includes(field.field_type)) {
        newErrors[field.field_key] = 'This field is required'
      }
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(undefined)
    const result = await submitFormResponse({ form_id: formId, values })
    setIsSubmitting(false)

    if (result.ok) {
      setSubmitted(true)
      if (thankYouRedirectUrl) window.location.href = thankYouRedirectUrl
    } else {
      setSubmitError(result.error || 'Submission failed')
    }
  }, [formId, values, fields, thankYouRedirectUrl])

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">{thankYouTitle || 'Thank you!'}</h2>
        <p style={{ color: 'var(--color-muted-foreground)' }}>{thankYouMessage || 'Your response has been submitted.'}</p>
      </div>
    )
  }

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)
  const unsectionedFields = fields.filter(f => !f.section_id).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      {sortedSections.map(section => {
        if (section.logic_rules?.length) {
          const { visible } = evaluateLogicRules(section.logic_rules as unknown as LogicRule[], values)
          if (!visible) return null
        }

        const sectionFields = fields
          .filter(f => f.section_id === section.id)
          .sort((a, b) => a.sort_order - b.sort_order)

        return (
          <div key={section.id} className="space-y-6">
            {section.title && (
              <div className="border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{section.title}</h3>
                {section.description && <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{section.description}</p>}
              </div>
            )}
            {sectionFields.map(field => {
              if (field.logic_rules?.length) {
                const { visible } = evaluateLogicRules(field.logic_rules as unknown as LogicRule[], values)
                if (!visible) return null
              }

              return (
                <div key={field.id} className="space-y-1.5">
                  {field.label && !LAYOUT_FIELD_TYPES.includes(field.field_type) && (
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.is_required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
                    </label>
                  )}
                  {field.description && !LAYOUT_FIELD_TYPES.includes(field.field_type) && (
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{field.description}</p>
                  )}
                  <FormField
                    field={field}
                    value={values[field.field_key]}
                    onChange={v => handleChange(field.field_key, v)}
                  />
                  {errors[field.field_key] && (
                    <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{errors[field.field_key]}</p>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {unsectionedFields.length > 0 && (
        <div className="space-y-6">
          {unsectionedFields.map(field => {
            if (field.logic_rules?.length) {
              const { visible } = evaluateLogicRules(field.logic_rules as unknown as LogicRule[], values)
              if (!visible) return null
            }
            return (
              <div key={field.id} className="space-y-1.5">
                {field.label && !LAYOUT_FIELD_TYPES.includes(field.field_type) && (
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.is_required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
                  </label>
                )}
                <FormField field={field} value={values[field.field_key]} onChange={v => handleChange(field.field_key, v)} />
                {errors[field.field_key] && <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{errors[field.field_key]}</p>}
              </div>
            )
          })}
        </div>
      )}

      {submitError && <p className="text-sm text-center" style={{ color: 'var(--color-destructive)' }}>{submitError}</p>}

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t md:static md:border-0 md:p-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
