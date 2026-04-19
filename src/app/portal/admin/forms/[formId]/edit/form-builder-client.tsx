'use client'

// @anchor: platform.form-builder.builder-ui

import { useState, useCallback, useTransition, useRef } from 'react'
import { createFormField, updateFormField, deleteFormField, updateForm, createFormInstance, revertSystemForm, createFormSection, updateFormSection, deleteFormSection } from '@/lib/actions/forms'
import type { CreateFormFieldInput } from '@/lib/schemas/form'
import { WizardFormRenderer, type WizardField, type WizardSection } from '@/components/forms/wizard/wizard-form-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { FormFieldType } from '@/lib/schemas/form'
import { Settings, Sparkles, Copy, RotateCcw, Code2, Layers, Trash2, Plus, Repeat, Save } from 'lucide-react'

interface FormDef {
  id: string; title: string; slug: string; status: string; mode: string
  description: string | null; access_control: string; theme_overrides: Record<string, unknown>
  thank_you_title: string | null; thank_you_message: string | null
  is_system_form?: boolean; system_form_key?: string | null
  parent_form_id?: string | null; instance_label?: string | null
  fee_enabled?: boolean; fee_amount_cents?: number | null; fee_description?: string | null
  hide_fee_notice?: boolean
}

interface FieldDef {
  id: string; field_key: string; field_type: FormFieldType; label: string | null
  description: string | null; placeholder: string | null; config: Record<string, unknown>
  validation_rules: Record<string, unknown>; logic_rules: unknown[]; sort_order: number
  is_required: boolean; section_id: string | null; page_number: number
  is_locked?: boolean; is_system_field?: boolean
}

interface SectionDef {
  id: string
  title: string | null
  description: string | null
  sort_order: number
  page_number?: number
  iterate_over_field_key?: string | null
}
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

  const [sections, setSections] = useState<SectionDef[]>(initialSections ?? [])
  const [showRevert, setShowRevert] = useState(false)
  const [revertText, setRevertText] = useState('')
  const [showEmbed, setShowEmbed] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  const wizardSections: WizardSection[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    sort_order: s.sort_order,
    page_number: s.page_number ?? 1,
    iterate_over_field_key: s.iterate_over_field_key ?? null,
  }))

  const [settings, setSettings] = useState({
    title: form.title,
    description: form.description ?? '',
    fee_enabled: form.fee_enabled ?? false,
    fee_amount_cents: form.fee_amount_cents ?? 10000,
    fee_description: form.fee_description ?? 'Application Fee',
    hide_fee_notice: (form as FormDef & { hide_fee_notice?: boolean }).hide_fee_notice ?? false,
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
        hide_fee_notice: settings.hide_fee_notice,
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

  const [dirtyFieldIds, setDirtyFieldIds] = useState<Set<string>>(new Set())

  const updateFieldLocal = useCallback((fieldId: string, updates: Partial<FieldDef>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
    setDirtyFieldIds(prev => new Set(prev).add(fieldId))
  }, [])

  const saveAllFields = useCallback(async () => {
    if (dirtyFieldIds.size === 0) return
    setIsSaving(true)
    const promises = Array.from(dirtyFieldIds).map(id => {
      const field = fields.find(f => f.id === id)
      if (!field) return Promise.resolve()
      return updateFormField(id, {
        label: field.label,
        description: field.description,
        placeholder: field.placeholder,
        is_required: field.is_required,
        config: field.config,
        validation_rules: field.validation_rules,
        logic_rules: field.logic_rules,
        sort_order: field.sort_order,
        page_number: field.page_number,
      } as Partial<CreateFormFieldInput>)
    })
    await Promise.all(promises)
    setDirtyFieldIds(new Set())
    setIsSaving(false)
  }, [dirtyFieldIds, fields])

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
              <Button variant="secondary" onClick={() => setShowSteps(true)} className="inline-flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Steps
              </Button>
              <Button variant="secondary" onClick={() => setShowEmbed(true)} className="inline-flex items-center gap-1">
                <Code2 className="h-4 w-4" />
                Embed
              </Button>
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
              {form.is_system_form && !form.parent_form_id && (
                <Button variant="secondary" onClick={() => setShowRevert(true)} className="inline-flex items-center gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Revert
                </Button>
              )}
              <Button onClick={saveAllFields} disabled={isSaving || dirtyFieldIds.size === 0} className="inline-flex items-center gap-1">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : dirtyFieldIds.size > 0 ? `Save (${dirtyFieldIds.size})` : 'Saved'}
              </Button>
              {formStatus === 'draft' ? (
                <Button onClick={publishForm} disabled={isSaving || fields.length === 0}>
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              ) : (
                <Button variant="secondary" onClick={unpublishForm} disabled={isSaving}>Unpublish</Button>
              )}
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-20 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Click a field type from the left panel to add your first field.
              </p>
            </div>
          ) : (
            <WizardFormRenderer
              formId={form.id}
              title={settings.title}
              mode={(form.mode as 'conversational' | 'document') ?? 'conversational'}
              feeEnabled={settings.fee_enabled}
              feeAmountCents={settings.fee_amount_cents}
              feeDescription={settings.fee_description}
              hideFeeNotice={settings.hide_fee_notice}
              thankYouTitle={settings.thank_you_title}
              thankYouMessage={settings.thank_you_message}
              sections={wizardSections}
              fields={fields as unknown as WizardField[]}
              preview
              onFieldSelect={setSelectedFieldId}
              selectedFieldId={selectedFieldId}
            />
          )}
        </div>
      </div>

      {/* Right: Field Settings */}
      <div className="w-72 border-l overflow-y-auto p-4 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        {selectedField ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>Field Settings</p>
              {selectedField.is_system_field && (
                <Badge variant="success" className="text-[10px]">System</Badge>
              )}
            </div>
            {selectedField.is_system_field && (
              <p className="text-[11px] text-[var(--color-muted-foreground)] rounded-md bg-[var(--color-muted)]/40 p-2">
                This is a locked system field. You can edit its visible label, description, and placeholder, but its type, key, and behavior are managed by the platform to keep downstream pipelines (applications, notifications, billing) working correctly.
              </p>
            )}
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
            <label className={`flex items-center gap-2 ${selectedField.is_system_field ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="checkbox" checked={selectedField.is_required}
                disabled={selectedField.is_system_field}
                onChange={e => updateFieldLocal(selectedField.id, { is_required: e.target.checked })}
                className="rounded accent-[var(--color-primary)]" />
              <span className="text-xs font-medium">Required</span>
            </label>
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Key: {selectedField.field_key}<br />
                Type: {selectedField.field_type}
              </p>
              {!selectedField.is_locked && (
                <button
                  onClick={() => {
                    if (confirm(`Delete "${selectedField.label || selectedField.field_key}"? This cannot be undone.`)) {
                      removeField(selectedField.id)
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-destructive)] px-3 py-1.5 text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete field
                </button>
              )}
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
                <p className="text-xs text-[var(--color-muted-foreground)] mb-3 pl-6">
                  {settings.fee_enabled
                    ? 'An application fee will be charged at submission.'
                    : 'The fee section is completely hidden from applicants.'}
                </p>
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

                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={settings.hide_fee_notice}
                    onChange={(e) => setSettings({ ...settings, hide_fee_notice: e.target.checked })}
                    className="rounded accent-[var(--color-primary)]"
                  />
                  <span className="text-sm font-medium">Hide fee notice entirely</span>
                </label>
                <p className="text-xs text-[var(--color-muted-foreground)] pl-6 mt-1">
                  Removes the fee banner completely — no &ldquo;fee waived&rdquo; promotion, no fee amount. Applicants see no mention of fees.
                </p>
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

      {showRevert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowRevert(false); setRevertText('') }}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2 inline-flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[var(--color-destructive)]" />
              Revert to original
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              This will delete every custom field, section, and submission action you&apos;ve added to this form
              and restore the platform template. Labels and fee settings will reset. <strong>This cannot be
              undone.</strong>
            </p>
            <label className="block mb-4">
              <span className="text-xs font-medium block mb-1">Type <code className="font-mono bg-[var(--color-muted)] px-1 rounded">REVERT</code> to confirm</span>
              <Input value={revertText} onChange={(e) => setRevertText(e.target.value)} placeholder="REVERT" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowRevert(false); setRevertText('') }}>Cancel</Button>
              <Button
                variant="danger"
                disabled={revertText.trim().toUpperCase() !== 'REVERT' || isSaving}
                onClick={() => {
                  setIsSaving(true)
                  startTransition(async () => {
                    const r = await revertSystemForm(form.id, revertText)
                    setIsSaving(false)
                    if (r.ok) {
                      window.location.reload()
                    } else {
                      alert(r.error ?? 'Revert failed')
                    }
                  })
                }}
              >
                {isSaving ? 'Reverting...' : 'Revert now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEmbed && (
        <EmbedModal form={form} onClose={() => setShowEmbed(false)} />
      )}

      {showSteps && (
        <StepsModal
          formId={form.id}
          sections={sections}
          fields={fields}
          onClose={() => setShowSteps(false)}
          onChange={setSections}
        />
      )}
    </div>
  )
}

function StepsModal({
  formId,
  sections,
  fields,
  onClose,
  onChange,
}: {
  formId: string
  sections: SectionDef[]
  fields: FieldDef[]
  onClose: () => void
  onChange: (sections: SectionDef[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const repeaterFields = fields.filter((f) => f.field_type === 'repeater_group')

  const sorted = [...sections].sort(
    (a, b) =>
      (a.page_number ?? a.sort_order) - (b.page_number ?? b.sort_order) || a.sort_order - b.sort_order,
  )

  const update = (id: string, patch: Partial<SectionDef>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    startTransition(async () => {
      await updateFormSection(id, patch)
    })
  }

  const add = () => {
    const nextPage = Math.max(0, ...sections.map((s) => s.page_number ?? 0)) + 1
    setBusy(true)
    startTransition(async () => {
      const result = await createFormSection({
        form_id: formId,
        title: `Step ${nextPage}`,
        page_number: nextPage,
      })
      setBusy(false)
      if (result.ok && result.id) {
        onChange([
          ...sections,
          {
            id: result.id,
            title: `Step ${nextPage}`,
            description: null,
            sort_order: sections.length,
            page_number: nextPage,
            iterate_over_field_key: null,
          },
        ])
      }
    })
  }

  const remove = (id: string) => {
    if (!confirm('Delete this step? Fields inside will stay but become unassigned.')) return
    setBusy(true)
    startTransition(async () => {
      await deleteFormSection(id)
      setBusy(false)
      onChange(sections.filter((s) => s.id !== id))
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1 inline-flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Wizard steps
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Each step becomes one page in the wizard. Set <em>Iterate over</em> to repeat the step&apos;s
          fields for each item in a repeater — useful for per-child program selection, per-student
          medical info, or any &ldquo;for each&rdquo; pattern.
        </p>

        <ol className="space-y-3">
          {sorted.map((s, i) => (
            <li
              key={s.id}
              className="rounded-[var(--radius)] border border-[var(--color-border)] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                <button
                  type="button"
                  disabled={busy || sections.length <= 1}
                  onClick={() => remove(s.id)}
                  className="text-xs text-[var(--color-destructive)] hover:underline disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Title</label>
                <Input
                  value={s.title ?? ''}
                  onChange={(e) => update(s.id, { title: e.target.value })}
                  placeholder={`Step ${i + 1}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Description (optional)</label>
                <Input
                  value={s.description ?? ''}
                  onChange={(e) => update(s.id, { description: e.target.value })}
                  placeholder="Shown under the step title"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1 inline-flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" />
                  Iterate over
                </label>
                <select
                  value={s.iterate_over_field_key ?? ''}
                  onChange={(e) =>
                    update(s.id, { iterate_over_field_key: e.target.value || null })
                  }
                  className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">— No iteration (render fields once) —</option>
                  {repeaterFields.map((f) => (
                    <option key={f.id} value={f.field_key}>
                      {f.label ?? f.field_key} (repeater)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                  When set, every field in this step renders once per item — grouped under each item&apos;s
                  name or index. Downstream submissions merge each iteration&apos;s values back into the
                  repeater&apos;s array.
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex justify-between items-center">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={add}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add step
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}

function EmbedModal({ form, onClose }: { form: FormDef; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/forms/${form.slug}`.replace('/portal/admin/forms/', '/forms/').replace('/portal/admin/', '/')
    : `/forms/${form.slug}`

  // Assume (forms) route: /{tenantSlug}/{formSlug}. On tenant domains, use the slug path directly.
  const directUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/forms/${form.slug}`
    : `/forms/${form.slug}`

  const iframeSnippet = `<iframe src="${directUrl}/embed" width="100%" height="720" frameborder="0" style="border:0;border-radius:14px" title="${form.title}"></iframe>`
  const linkSnippet = directUrl
  const scriptSnippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-form-slug="${form.slug}"></script>
<div id="form-${form.slug}"></div>`

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1 inline-flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Embed this form
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Use any of these snippets to drop this form into another website, email, or funnel. Submissions flow
          back into this form&apos;s response pipeline automatically.
        </p>

        <div className="space-y-5">
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Direct link
              </h4>
              <button
                onClick={() => copy(linkSnippet, 'link')}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                {copied === 'link' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="rounded-md bg-[var(--color-muted)] p-3 text-xs overflow-x-auto">{linkSnippet}</pre>
            <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
              Best for email links, social posts, and QR codes.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Iframe (any website)
              </h4>
              <button
                onClick={() => copy(iframeSnippet, 'iframe')}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                {copied === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="rounded-md bg-[var(--color-muted)] p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">{iframeSnippet}</pre>
            <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
              Best for Squarespace, Wix, WordPress, and existing marketing sites. Auto-resizes to content.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Script tag (coming soon)
              </h4>
              <button
                onClick={() => copy(scriptSnippet, 'script')}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                {copied === 'script' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="rounded-md bg-[var(--color-muted)] p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">{scriptSnippet}</pre>
            <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
              Best for custom funnels that need client-side control — requires /embed.js (not yet shipped).
            </p>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
