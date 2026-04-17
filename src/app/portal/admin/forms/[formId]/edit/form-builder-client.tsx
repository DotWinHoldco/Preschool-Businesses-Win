'use client'

// @anchor: platform.form-builder.builder-ui

import { useState, useCallback } from 'react'
import { createFormField, updateFormField, deleteFormField, updateForm, reorderFormFields } from '@/lib/actions/forms'
import type { CreateFormFieldInput } from '@/lib/schemas/form'
import { FormField } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { FormFieldType } from '@/lib/schemas/form'

interface FormDef {
  id: string; title: string; slug: string; status: string; mode: string
  description: string | null; access_control: string; theme_overrides: Record<string, unknown>
  thank_you_title: string | null; thank_you_message: string | null
}

interface FieldDef {
  id: string; field_key: string; field_type: FormFieldType; label: string | null
  description: string | null; placeholder: string | null; config: Record<string, unknown>
  validation_rules: Record<string, unknown>; logic_rules: unknown[]; sort_order: number
  is_required: boolean; section_id: string | null; page_number: number
}

interface SectionDef { id: string; title: string | null; description: string | null; sort_order: number }
interface ActionDef { id: string; action_type: string; config: Record<string, unknown>; sort_order: number }

const FIELD_PALETTE: { category: string; types: { type: FormFieldType; label: string }[] }[] = [
  { category: 'Text', types: [
    { type: 'short_text', label: 'Short Text' }, { type: 'long_text', label: 'Long Text' },
    { type: 'email', label: 'Email' }, { type: 'phone', label: 'Phone' },
    { type: 'url', label: 'URL' }, { type: 'number', label: 'Number' }, { type: 'currency', label: 'Currency' },
  ]},
  { category: 'Choice', types: [
    { type: 'single_select_dropdown', label: 'Dropdown' }, { type: 'single_select_radio', label: 'Radio' },
    { type: 'multi_select_checkbox', label: 'Checkboxes' }, { type: 'image_choice', label: 'Image Choice' },
    { type: 'button_group', label: 'Button Group' }, { type: 'rating', label: 'Rating' },
    { type: 'opinion_scale', label: 'Scale' }, { type: 'nps', label: 'NPS' },
    { type: 'yes_no', label: 'Yes / No' }, { type: 'legal_acceptance', label: 'Legal' },
  ]},
  { category: 'Date/Time', types: [
    { type: 'date', label: 'Date' }, { type: 'time', label: 'Time' }, { type: 'datetime', label: 'Date & Time' },
  ]},
  { category: 'Media', types: [
    { type: 'file_upload', label: 'File Upload' }, { type: 'image_upload', label: 'Image Upload' },
    { type: 'signature_pad', label: 'Signature' },
  ]},
  { category: 'Layout', types: [
    { type: 'section_header', label: 'Section Header' }, { type: 'description_block', label: 'Description' },
    { type: 'divider', label: 'Divider' }, { type: 'spacer', label: 'Spacer' },
  ]},
  { category: 'Advanced', types: [
    { type: 'slider', label: 'Slider' }, { type: 'hidden_field', label: 'Hidden Field' },
    { type: 'calculator', label: 'Calculator' },
  ]},
]

export function FormBuilderClient({ form, initialFields, initialSections, initialActions }: {
  form: FormDef; initialFields: FieldDef[]; initialSections: SectionDef[]; initialActions: ActionDef[]
}) {
  const [fields, setFields] = useState(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formStatus, setFormStatus] = useState(form.status)

  const selectedField = fields.find(f => f.id === selectedFieldId)

  const addField = useCallback(async (fieldType: FormFieldType) => {
    const fieldKey = `field_${Date.now().toString(36)}`
    const result = await createFormField({
      form_id: form.id,
      field_key: fieldKey,
      field_type: fieldType,
      label: fieldType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      sort_order: fields.length,
      config: {},
      validation_rules: {},
      logic_rules: [],
      page_number: 1,
      is_required: false,
    })
    if (result.ok && result.id) {
      const newField: FieldDef = {
        id: result.id, field_key: fieldKey, field_type: fieldType,
        label: fieldType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: null, placeholder: null, config: {}, validation_rules: {},
        logic_rules: [], sort_order: fields.length, is_required: false,
        section_id: null, page_number: 1,
      }
      setFields(prev => [...prev, newField])
      setSelectedFieldId(result.id)
    }
  }, [form.id, fields.length])

  const removeField = useCallback(async (fieldId: string) => {
    await deleteFormField(fieldId)
    setFields(prev => prev.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }, [selectedFieldId])

  const updateFieldLocal = useCallback(async (fieldId: string, updates: Partial<FieldDef>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
    await updateFormField(fieldId, updates as Partial<CreateFormFieldInput>)
  }, [])

  const publishForm = useCallback(async () => {
    setIsSaving(true)
    await updateForm({ id: form.id, status: 'published' })
    setFormStatus('published')
    setIsSaving(false)
  }, [form.id])

  const unpublishForm = useCallback(async () => {
    setIsSaving(true)
    await updateForm({ id: form.id, status: 'draft' })
    setFormStatus('draft')
    setIsSaving(false)
  }, [form.id])

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -mx-6 -mt-6">
      {/* Left: Field Palette */}
      <div className="w-56 border-r overflow-y-auto p-4 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted-foreground)' }}>Add Field</p>
        {FIELD_PALETTE.map(cat => (
          <div key={cat.category} className="mb-4">
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted-foreground)' }}>{cat.category}</p>
            <div className="space-y-1">
              {cat.types.map(t => (
                <button key={t.type} onClick={() => addField(t.type)}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--color-muted)]"
                  style={{ color: 'var(--color-foreground)' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="max-w-xl mx-auto space-y-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">{form.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={formStatus === 'published' ? 'success' : 'warning'}>{formStatus}</Badge>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{form.mode} · /{form.slug}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {formStatus === 'draft' ? (
                <Button onClick={publishForm} disabled={isSaving || fields.length === 0}>
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              ) : (
                <Button variant="secondary" onClick={unpublishForm} disabled={isSaving}>Unpublish</Button>
              )}
            </div>
          </div>

          {fields.length === 0 && (
            <div className="text-center py-20 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Click a field type from the left panel to add your first field.
              </p>
            </div>
          )}

          {fields.map((field, idx) => (
            <div key={field.id}
              onClick={() => setSelectedFieldId(field.id)}
              className="p-4 rounded-lg border-2 cursor-pointer transition-all"
              style={{
                borderColor: selectedFieldId === field.id ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: 'var(--color-card)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                  {idx + 1}. {field.field_type.replace(/_/g, ' ')}
                </span>
                <button onClick={e => { e.stopPropagation(); removeField(field.id) }}
                  className="text-xs px-1.5 py-0.5 rounded hover:bg-red-50" style={{ color: 'var(--color-destructive)' }}>✕</button>
              </div>
              <FormField
                field={{ ...field, label: field.label, description: field.description, placeholder: field.placeholder }}
                value={undefined}
                onChange={() => {}}
                disabled
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Field Settings */}
      <div className="w-72 border-l overflow-y-auto p-4 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        {selectedField ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>Field Settings</p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Label</label>
              <Input value={selectedField.label || ''} onChange={e => updateFieldLocal(selectedField.id, { label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Input value={selectedField.description || ''} onChange={e => updateFieldLocal(selectedField.id, { description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Placeholder</label>
              <Input value={selectedField.placeholder || ''} onChange={e => updateFieldLocal(selectedField.id, { placeholder: e.target.value })} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={selectedField.is_required}
                onChange={e => updateFieldLocal(selectedField.id, { is_required: e.target.checked })}
                className="rounded accent-[var(--color-primary)]" />
              <span className="text-xs font-medium">Required</span>
            </label>
            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Key: {selectedField.field_key}<br />
                Type: {selectedField.field_type}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-center" style={{ color: 'var(--color-muted-foreground)' }}>
              Select a field to edit its settings
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
