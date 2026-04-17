'use client'

// @anchor: platform.form-builder.builder-ui

import { useState, useCallback, useTransition } from 'react'
import { createFormField, updateFormField, deleteFormField, updateForm, createFormInstance } from '@/lib/actions/forms'
import type { CreateFormFieldInput } from '@/lib/schemas/form'
import { FormField } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { FormFieldType } from '@/lib/schemas/form'
import { Settings, Sparkles, Lock, Copy } from 'lucide-react'

interface FormDef {
  id: string; title: string; slug: string; status: string; mode: string
  description: string | null; access_control: string; theme_overrides: Record<string, unknown>
  thank_you_title: string | null; thank_you_message: string | null
  is_system_form?: boolean; system_form_key?: string | null
  parent_form_id?: string | null; instance_label?: string | null
  fee_enabled?: boolean; fee_amount_cents?: number | null; fee_description?: string | null
}

interface FieldDef {
  id: string; field_key: string; field_type: FormFieldType; label: string | null
  description: string | null; placeholder: string | null; config: Record<string, unknown>
  validation_rules: Record<string, unknown>; logic_rules: unknown[]; sort_order: number
  is_required: boolean; section_id: string | null; page_number: number
  is_locked?: boolean; is_system_field?: boolean
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
  const [showSettings, setShowSettings] = useState(false)
  const [showSpawn, setShowSpawn] = useState(false)
  const [, startTransition] = useTransition()

  const [settings, setSettings] = useState({
    title: form.title,
    description: form.description ?? '',
    fee_enabled: form.fee_enabled ?? false,
    fee_amount_cents: form.fee_amount_cents ?? 10000,
    fee_description: form.fee_description ?? 'Application Fee',
    access_control: form.access_control,
    thank_you_title: form.thank_you_title ?? '',
    thank_you_message: form.thank_you_message ?? '',
    instance_label: form.instance_label ?? '',
  })

  const [spawnDraft, setSpawnDraft] = useState({
    instance_label: '',
    fee_enabled: false,
    fee_amount_cents: 10000,
    fee_description: 'Application Fee',
  })

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
    const field = fields.find(f => f.id === fieldId)
    if (field?.is_locked) {
      alert('This is a locked system field and cannot be deleted. You can edit its label but not remove it.')
      return
    }
    await deleteFormField(fieldId)
    setFields(prev => prev.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }, [selectedFieldId, fields])

  const saveSettings = useCallback(() => {
    setIsSaving(true)
    startTransition(async () => {
      await updateForm({
        id: form.id,
        title: settings.title,
        description: settings.description || undefined,
        fee_enabled: settings.fee_enabled,
        fee_amount_cents: settings.fee_enabled ? settings.fee_amount_cents : null,
        fee_description: settings.fee_description,
        thank_you_title: settings.thank_you_title,
        thank_you_message: settings.thank_you_message,
        instance_label: settings.instance_label || undefined,
      })
      setIsSaving(false)
      setShowSettings(false)
    })
  }, [form.id, settings])

  const doSpawn = useCallback(() => {
    if (!spawnDraft.instance_label.trim()) return
    startTransition(async () => {
      const result = await createFormInstance({
        source_form_id: form.id,
        instance_label: spawnDraft.instance_label,
        fee_enabled: spawnDraft.fee_enabled,
        fee_amount_cents: spawnDraft.fee_enabled ? spawnDraft.fee_amount_cents : null,
        fee_description: spawnDraft.fee_description,
      })
      if (result.ok && result.id) {
        window.location.href = `/portal/admin/forms/${result.id}/edit`
      } else {
        alert(result.error ?? 'Failed to spawn instance')
      }
    })
  }, [form.id, spawnDraft])

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
              <h2 className="text-lg font-bold">{settings.title}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={formStatus === 'published' ? 'success' : 'warning'}>{formStatus}</Badge>
                <Badge variant="outline" className="text-xs">{form.mode}</Badge>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>/{form.slug}</span>
                {form.is_system_form && (
                  <Badge variant="success" className="text-xs inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    System form
                  </Badge>
                )}
                {form.parent_form_id && form.instance_label && (
                  <Badge variant="outline" className="text-xs">Instance: {form.instance_label}</Badge>
                )}
                {settings.fee_enabled && (
                  <Badge variant="success" className="text-xs">
                    Fee: ${((settings.fee_amount_cents ?? 0) / 100).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              {form.is_system_form && (
                <Button variant="secondary" onClick={() => setShowSpawn(true)} className="inline-flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  Create instance
                </Button>
              )}
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
                <span className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--color-muted-foreground)' }}>
                  {idx + 1}. {field.field_type.replace(/_/g, ' ')}
                  {field.is_locked && (
                    <span title="System field — locked, cannot be deleted" className="inline-flex items-center">
                      <Lock className="h-3 w-3" />
                    </span>
                  )}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeField(field.id) }}
                  disabled={field.is_locked}
                  className="text-xs px-1.5 py-0.5 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--color-destructive)' }}
                  title={field.is_locked ? 'Locked system field' : 'Delete field'}
                >
                  ✕
                </button>
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

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 inline-flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Form Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Title</label>
                <Input value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Description</label>
                <Input value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
              </div>

              {form.parent_form_id && (
                <div>
                  <label className="text-xs font-medium block mb-1">Instance label</label>
                  <Input value={settings.instance_label} onChange={(e) => setSettings({ ...settings, instance_label: e.target.value })} placeholder="Spring Open House — No Fee" />
                </div>
              )}

              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={settings.fee_enabled}
                    onChange={(e) => setSettings({ ...settings, fee_enabled: e.target.checked })}
                    className="rounded accent-[var(--color-primary)]"
                  />
                  <span className="text-sm font-medium">Collect an application fee</span>
                </label>
                {settings.fee_enabled && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-xs font-medium block mb-1">Amount</label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-[var(--color-muted-foreground)]">$</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={(settings.fee_amount_cents / 100).toFixed(2)}
                          onChange={(e) =>
                            setSettings({ ...settings, fee_amount_cents: Math.round(parseFloat(e.target.value || '0') * 100) })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Fee description</label>
                      <Input
                        value={settings.fee_description}
                        onChange={(e) => setSettings({ ...settings, fee_description: e.target.value })}
                        placeholder="Application Fee"
                      />
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Fees are collected via the tenant&apos;s Stripe Connect account on submission.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <label className="text-xs font-medium block mb-1">Thank you title</label>
                <Input value={settings.thank_you_title} onChange={(e) => setSettings({ ...settings, thank_you_title: e.target.value })} />
                <label className="text-xs font-medium block mt-3 mb-1">Thank you message</label>
                <Input value={settings.thank_you_message} onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSpawn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSpawn(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2 inline-flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Create form instance
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Make a deep copy of this form with its own slug, fee settings, and independent editability. Useful
              for variants like &quot;Open House — No Fee&quot;.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Instance label</label>
                <Input
                  value={spawnDraft.instance_label}
                  onChange={(e) => setSpawnDraft({ ...spawnDraft, instance_label: e.target.value })}
                  placeholder="Spring Open House — No Fee"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={spawnDraft.fee_enabled}
                  onChange={(e) => setSpawnDraft({ ...spawnDraft, fee_enabled: e.target.checked })}
                  className="rounded accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium">Collect fee on this instance</span>
              </label>
              {spawnDraft.fee_enabled && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="text-xs font-medium block mb-1">Amount</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={(spawnDraft.fee_amount_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        setSpawnDraft({ ...spawnDraft, fee_amount_cents: Math.round(parseFloat(e.target.value || '0') * 100) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Description</label>
                    <Input
                      value={spawnDraft.fee_description}
                      onChange={(e) => setSpawnDraft({ ...spawnDraft, fee_description: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSpawn(false)}>Cancel</Button>
              <Button onClick={doSpawn} disabled={!spawnDraft.instance_label.trim()}>
                Create instance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
