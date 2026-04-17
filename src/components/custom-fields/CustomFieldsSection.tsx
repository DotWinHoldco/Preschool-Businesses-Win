'use client'

// @anchor: platform.custom-fields.section-component

import { useEffect, useState, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { setCustomFieldValue } from '@/lib/actions/custom-fields'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface CustomField {
  id: string
  field_key: string
  label: string
  description: string | null
  field_type: string
  is_required: boolean
  section_label: string | null
  validation_rules: Record<string, unknown>
  options?: { label: string; value: string; color?: string }[]
}

interface FieldValue {
  custom_field_id: string
  value_text: string | null
  value_numeric: number | null
  value_boolean: boolean | null
  value_date: string | null
  value_json: unknown
  value_file_path: string | null
}

interface Props {
  entityType: string
  entityId: string
  tenantId: string
  readOnly?: boolean
}

export function CustomFieldsSection({ entityType, entityId, tenantId, readOnly }: Props) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Map<string, unknown>>(new Map())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    async function load() {
      const { data: fieldDefs } = await supabase
        .from('custom_fields')
        .select('*, custom_field_options(*)')
        .eq('entity_type', entityType)
        .is('deleted_at', null)
        .order('sort_order')

      if (fieldDefs) {
        setFields(fieldDefs.map((f: Record<string, unknown>) => ({
          ...f,
          options: (f.custom_field_options as { label: string; value: string; color?: string }[]) || [],
        })) as CustomField[])
      }

      const { data: vals } = await supabase
        .from('custom_field_values')
        .select('custom_field_id, value_text, value_numeric, value_boolean, value_date, value_json, value_file_path')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (vals) {
        const map = new Map<string, unknown>()
        for (const v of vals as FieldValue[]) {
          const val = v.value_text ?? v.value_numeric ?? v.value_boolean ?? v.value_date ?? v.value_json ?? v.value_file_path
          map.set(v.custom_field_id, val)
        }
        setValues(map)
      }
    }

    load()
  }, [entityType, entityId, tenantId])

  if (!fields.length) return null

  const sections = new Map<string, CustomField[]>()
  for (const f of fields) {
    const key = f.section_label || 'Additional Information'
    const arr = sections.get(key) || []
    arr.push(f)
    sections.set(key, arr)
  }

  function handleChange(fieldId: string, value: unknown) {
    setValues(prev => new Map(prev).set(fieldId, value))
    startTransition(async () => {
      await setCustomFieldValue({
        custom_field_id: fieldId,
        entity_type: entityType,
        entity_id: entityId,
        value,
      })
    })
  }

  return (
    <div className="space-y-6 mt-8">
      {Array.from(sections.entries()).map(([sectionLabel, sectionFields]) => (
        <div key={sectionLabel}>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
            {sectionLabel}
          </h3>
          <div className="space-y-4">
            {sectionFields.map(field => (
              <div key={field.id} className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  {field.label}
                  {field.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
                </label>
                {field.description && (
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{field.description}</p>
                )}
                <FieldInput
                  field={field}
                  value={values.get(field.id)}
                  onChange={v => handleChange(field.id, v)}
                  disabled={readOnly || isPending}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FieldInput({
  field, value, onChange, disabled,
}: {
  field: CustomField; value: unknown; onChange: (v: unknown) => void; disabled?: boolean
}) {
  switch (field.field_type) {
    case 'text': case 'email': case 'phone': case 'url': case 'color':
      return (
        <Input
          type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.label}
        />
      )
    case 'textarea':
      return (
        <Textarea
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
        />
      )
    case 'number': case 'currency': case 'rating':
      return (
        <Input
          type="number"
          value={value != null ? String(value) : ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
        />
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="rounded"
          />
          <span className="text-sm">{field.label}</span>
        </label>
      )
    case 'date': case 'datetime':
      return (
        <Input
          type={field.field_type === 'datetime' ? 'datetime-local' : 'date'}
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        />
      )
    case 'select':
      return (
        <select
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    case 'multi_select': {
      const selected = Array.isArray(value) ? value as string[] : []
      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...selected, opt.value]
                    : selected.filter(v => v !== opt.value)
                  onChange(next)
                }}
                disabled={disabled}
                className="rounded"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )
    }
    default:
      return (
        <Input
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        />
      )
  }
}
