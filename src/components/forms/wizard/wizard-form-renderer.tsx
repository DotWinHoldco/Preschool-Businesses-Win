'use client'

// @anchor: platform.form-wizard.renderer
// Generic wizard-style form renderer. Reads form_sections + form_fields and
// renders each section as a step with the polished /enroll look. Used on:
//   - /enroll (the system enrollment form)
//   - /{tenantSlug}/{formSlug} (any published form, conversational mode)
//   - admin form builder canvas (preview + click-to-select mode)

import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { WizardStepIndicator } from './step-indicator'
import { WizardFeeNotice } from './fee-notice'
import { evaluateLogicRules, type LogicRule } from '@/lib/forms/logic-engine'
import { submitFormResponse } from '@/lib/actions/form-responses'

export interface WizardField {
  id: string
  field_key: string
  field_type: string
  label: string | null
  description: string | null
  placeholder: string | null
  config: Record<string, unknown>
  validation_rules: Record<string, unknown>
  logic_rules: Record<string, unknown>[]
  is_required: boolean
  is_locked?: boolean
  is_system_field?: boolean
  sort_order: number
  page_number: number
  section_id: string | null
}

export interface WizardSection {
  id: string
  title: string | null
  description: string | null
  sort_order: number
  page_number: number
}

export interface WizardFormProps {
  formId: string
  title: string
  mode?: 'conversational' | 'document'
  feeEnabled?: boolean
  feeAmountCents?: number | null
  feeDescription?: string
  thankYouTitle?: string
  thankYouMessage?: string
  sections: WizardSection[]
  fields: WizardField[]
  tenantName?: string
  /** Preview mode — disables inputs, notifies onFieldSelect on click, skips submit. */
  preview?: boolean
  onFieldSelect?: (fieldId: string) => void
  selectedFieldId?: string | null
}

const LAYOUT_TYPES = new Set([
  'section_header',
  'description_block',
  'divider',
  'image_banner',
  'video_banner',
  'spacer',
])

export function WizardFormRenderer({
  formId,
  title,
  feeEnabled = false,
  feeAmountCents,
  feeDescription,
  thankYouTitle = 'Thank you!',
  thankYouMessage = 'Your response has been submitted.',
  sections,
  fields,
  tenantName,
  preview = false,
  onFieldSelect,
  selectedFieldId,
}: WizardFormProps) {
  // Build steps from sections — fall back to page_numbers if no sections.
  const steps = useMemo(() => {
    if (sections.length > 0) {
      return sections
        .slice()
        .sort((a, b) => a.page_number - b.page_number || a.sort_order - b.sort_order)
        .map((s, i) => ({
          id: s.id,
          label: s.title ?? `Step ${i + 1}`,
          title: s.title,
          description: s.description,
          page_number: s.page_number,
        }))
    }
    const pages = Array.from(new Set(fields.map((f) => f.page_number))).sort((a, b) => a - b)
    return pages.map((p, i) => ({
      id: `page-${p}`,
      label: `Step ${i + 1}`,
      title: `Step ${i + 1}`,
      description: null,
      page_number: p,
    }))
  }, [sections, fields])

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const currentStep = steps[step]
  const isLast = step === steps.length - 1

  const currentFields = useMemo(() => {
    if (!currentStep) return []
    return fields
      .filter((f) => f.page_number === currentStep.page_number)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [fields, currentStep])

  const isFieldVisible = (field: WizardField): boolean => {
    if (!field.logic_rules || field.logic_rules.length === 0) return true
    const { visible } = evaluateLogicRules(field.logic_rules as unknown as LogicRule[], values)
    return visible
  }

  const canAdvance = (): boolean => {
    if (preview) return true
    return currentFields
      .filter(isFieldVisible)
      .filter((f) => f.is_required && !LAYOUT_TYPES.has(f.field_type))
      .every((f) => {
        const v = values[f.field_key]
        if (f.field_type === 'yes_no') return typeof v === 'boolean'
        if (f.field_type === 'legal_acceptance') return v === true
        if (f.field_type === 'repeater_group') return Array.isArray(v) && v.length > 0
        return v !== undefined && v !== null && v !== ''
      })
  }

  const handleSubmit = () => {
    if (preview) return
    setError(null)
    startTransition(async () => {
      const result = await submitFormResponse({ form_id: formId, values })
      if (!result.ok) {
        setError(result.error ?? 'Submission failed.')
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">{thankYouTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{thankYouMessage}</p>
      </div>
    )
  }

  if (!currentStep) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-[var(--color-muted-foreground)]">
        This form has no steps yet. Add a section to get started.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <WizardFeeNotice
        feeEnabled={feeEnabled}
        feeAmountCents={feeAmountCents}
        feeDescription={feeDescription}
      />

      <WizardStepIndicator current={step} steps={steps.map((s) => ({ id: s.id, label: s.label }))} />

      <div className="mt-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8">
        <div>
          <h2
            className="text-2xl font-bold text-[var(--color-foreground)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {currentStep.title ?? title}
          </h2>
          {currentStep.description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{currentStep.description}</p>
          )}
        </div>

        <div className="mt-6 space-y-5">
          {currentFields.filter(isFieldVisible).map((field) => (
            <WizardFieldBlock
              key={field.id}
              field={field}
              value={values[field.field_key]}
              onChange={(v) => setValues({ ...values, [field.field_key]: v })}
              preview={preview}
              selected={selectedFieldId === field.id}
              onSelect={onFieldSelect ? () => onFieldSelect(field.id) : undefined}
              tenantName={tenantName}
            />
          ))}

          {/* Honeypot */}
          {!preview && (
            <input
              type="text"
              tabIndex={-1}
              aria-hidden
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px' }}
            />
          )}

          {error && (
            <div className="rounded-[var(--radius)] bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0 || pending}
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {!isLast ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance() || pending}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Submitting...' : preview ? 'Submit (preview)' : 'Submit'}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function WizardFieldBlock({
  field,
  value,
  onChange,
  preview,
  selected,
  onSelect,
  tenantName,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
  preview?: boolean
  selected?: boolean
  onSelect?: () => void
  tenantName?: string
}) {
  // Layout fields
  if (field.field_type === 'section_header') {
    return (
      <SelectableWrapper selected={selected} onSelect={onSelect} locked={field.is_locked}>
        <h3
          className="text-lg font-bold text-[var(--color-foreground)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {field.label}
        </h3>
        {field.description && (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{field.description}</p>
        )}
      </SelectableWrapper>
    )
  }
  if (field.field_type === 'description_block') {
    return (
      <SelectableWrapper selected={selected} onSelect={onSelect} locked={field.is_locked}>
        <div className="rounded-[var(--radius)] bg-[var(--color-muted)]/30 p-4">
          {field.label && (
            <div className="mb-1 text-sm font-semibold text-[var(--color-foreground)]">
              {field.label}
            </div>
          )}
          {field.description && (
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              {field.description}
            </p>
          )}
        </div>
      </SelectableWrapper>
    )
  }
  if (field.field_type === 'divider') {
    return <div className="h-px bg-[var(--color-border)]" />
  }
  if (field.field_type === 'spacer') {
    return <div className="h-4" />
  }

  // Repeater group (children)
  if (field.field_type === 'repeater_group') {
    return (
      <SelectableWrapper selected={selected} onSelect={onSelect} locked={field.is_locked}>
        <RepeaterGroup field={field} value={value} onChange={onChange} preview={preview} />
      </SelectableWrapper>
    )
  }

  // Input fields
  return (
    <SelectableWrapper selected={selected} onSelect={onSelect} locked={field.is_locked}>
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-medium text-[var(--color-foreground)]">
          {field.label}
          {field.is_required && <span className="text-[var(--color-destructive)]">*</span>}
          {field.is_locked && <Lock className="h-3 w-3 text-[var(--color-muted-foreground)]" aria-label="System field" />}
        </span>
        {field.description && (
          <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
            {field.description}
          </span>
        )}
        <WizardInput field={field} value={value} onChange={onChange} preview={preview} tenantName={tenantName} />
      </label>
    </SelectableWrapper>
  )
}

function SelectableWrapper({
  selected,
  onSelect,
  locked,
  children,
}: {
  selected?: boolean
  onSelect?: () => void
  locked?: boolean
  children: React.ReactNode
}) {
  if (!onSelect) return <>{children}</>
  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-[var(--radius)] border-2 p-2 cursor-pointer transition-all',
        selected ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">{children}</div>
        {locked && (
          <span title="System field — locked" className="mt-1 text-[var(--color-muted-foreground)]">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}

function WizardInput({
  field,
  value,
  onChange,
  preview,
  tenantName,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
  preview?: boolean
  tenantName?: string
}) {
  const disabled = preview
  const common =
    'w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60'

  switch (field.field_type) {
    case 'short_text':
    case 'email':
    case 'phone':
    case 'url':
    case 'number':
    case 'currency':
    case 'date':
    case 'time':
    case 'datetime':
      return (
        <input
          type={
            field.field_type === 'email'
              ? 'email'
              : field.field_type === 'phone'
                ? 'tel'
                : field.field_type === 'url'
                  ? 'url'
                  : field.field_type === 'number' || field.field_type === 'currency'
                    ? 'number'
                    : field.field_type === 'date'
                      ? 'date'
                      : field.field_type === 'time'
                        ? 'time'
                        : field.field_type === 'datetime'
                          ? 'datetime-local'
                          : 'text'
          }
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={common}
        />
      )
    case 'long_text':
      return (
        <textarea
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          rows={3}
          className={common}
        />
      )
    case 'single_select_dropdown': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      return (
        <select
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        >
          <option value="" disabled>
            Select...
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    case 'single_select_radio':
    case 'button_group': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      return (
        <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)] flex-wrap">
          {options.map((o, i) => {
            const active = value === o.value
            return (
              <button
                key={o.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(o.value)}
                className={cn(
                  'px-4 py-1.5 text-sm transition-colors',
                  i > 0 && 'border-l border-[var(--color-border)]',
                  active
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }
    case 'yes_no':
      return (
        <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(true)}
            className={cn(
              'px-4 py-1.5 text-sm transition-colors',
              value === true
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
            )}
          >
            Yes
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(false)}
            className={cn(
              'border-l border-[var(--color-border)] px-4 py-1.5 text-sm transition-colors',
              value === false
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
            )}
          >
            No
          </button>
        </div>
      )
    case 'multi_select_checkbox': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      const arr = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={disabled}
                checked={arr.includes(o.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))
                }
                className="rounded accent-[var(--color-primary)]"
              />
              {o.label}
            </label>
          ))}
        </div>
      )
    }
    case 'legal_acceptance':
      return (
        <label className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--color-border)] p-3 cursor-pointer hover:bg-[var(--color-muted)]/30">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-foreground)]">
            {field.label?.replace('{tenantName}', tenantName ?? 'our school')}
          </span>
        </label>
      )
    case 'address_autocomplete':
      return (
        <input
          type="text"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing your address..."
          className={common}
        />
      )
    case 'image_upload':
    case 'file_upload':
      return (
        <input
          type="file"
          disabled={disabled}
          accept={field.field_type === 'image_upload' ? 'image/*' : undefined}
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
          className={common}
        />
      )
    case 'payment_stripe':
      return (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4 text-xs text-[var(--color-muted-foreground)]">
          Secure Stripe payment — rendered here on submission when fee is enabled.
        </div>
      )
    default:
      return (
        <input
          type="text"
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`[${field.field_type}]`}
          className={common}
        />
      )
  }
}

function RepeaterGroup({
  field,
  value,
  onChange,
  preview,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
  preview?: boolean
}) {
  const config = field.config as {
    min_items?: number
    max_items?: number
    item_label?: string
    add_button_label?: string
    remove_button_label?: string
    fields?: Array<{
      field_key: string
      field_type: string
      label?: string
      is_required?: boolean
      config?: Record<string, unknown>
    }>
  }
  const maxItems = config.max_items ?? 5
  const minItems = config.min_items ?? 1
  const itemLabel = config.item_label ?? 'Item'
  const subFields = config.fields ?? []

  const arr = (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>
  const items = arr.length === 0 ? [emptyItem(subFields)] : arr

  const updateItem = (idx: number, patch: Record<string, unknown>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onChange(next)
  }
  const addItem = () => {
    if (items.length >= maxItems) return
    onChange([...items, emptyItem(subFields)])
  }
  const removeItem = (idx: number) => {
    if (items.length <= minItems) return
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">
              {itemLabel} {idx + 1}
            </h4>
            {items.length > minItems && !preview && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-destructive)] hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {config.remove_button_label ?? 'Remove'}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {subFields.map((sub) => (
              <label key={sub.field_key} className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-foreground)]">
                  {sub.label}
                  {sub.is_required && <span className="text-[var(--color-destructive)]"> *</span>}
                </span>
                <SubFieldInput
                  fieldKey={sub.field_key}
                  fieldType={sub.field_type}
                  config={sub.config ?? {}}
                  value={item[sub.field_key]}
                  onChange={(v) => updateItem(idx, { [sub.field_key]: v })}
                  preview={preview}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {items.length < maxItems && !preview && (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          <Plus className="h-4 w-4" />
          {config.add_button_label ?? `Add another ${itemLabel.toLowerCase()}`}
        </button>
      )}
    </div>
  )
}

function emptyItem(subFields: Array<{ field_key: string }>): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const f of subFields) item[f.field_key] = ''
  return item
}

function SubFieldInput({
  fieldKey: _fieldKey,
  fieldType,
  config,
  value,
  onChange,
  preview,
}: {
  fieldKey: string
  fieldType: string
  config: Record<string, unknown>
  value: unknown
  onChange: (v: unknown) => void
  preview?: boolean
}) {
  const disabled = preview
  const common =
    'w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60'
  if (fieldType === 'date') {
    return (
      <input
        type="date"
        disabled={disabled}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={common}
      />
    )
  }
  if (fieldType === 'single_select_radio') {
    const options = (config.options as Array<{ value: string; label: string }>) ?? []
    return (
      <select
        disabled={disabled}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={common}
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  if (fieldType === 'image_upload' || fieldType === 'file_upload') {
    return (
      <input
        type="file"
        disabled={disabled}
        accept={fieldType === 'image_upload' ? 'image/*' : undefined}
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
        className={common}
      />
    )
  }
  return (
    <input
      type="text"
      disabled={disabled}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className={common}
    />
  )
}
