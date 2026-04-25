'use client'

// @anchor: platform.custom-fields.manager-component

import { useState } from 'react'
import {
  createCustomField,
  deleteCustomField,
  updateCustomField,
} from '@/lib/actions/custom-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CustomFieldType } from '@/lib/schemas/custom-field'

interface EntityType {
  id: string
  entity_type: string
  label: string
  icon: string | null
}

interface Field {
  id: string
  entity_type: string
  field_key: string
  label: string
  description: string | null
  field_type: string
  is_required: boolean
  is_searchable: boolean
  is_filterable: boolean
  is_visible_to_parents: boolean
  is_parent_editable: boolean
  is_merge_tag?: boolean
  section_label: string | null
  sort_order: number
  custom_field_options?: { label: string; value: string; color?: string }[]
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  textarea: 'Text Area',
  number: 'Number',
  currency: 'Currency',
  date: 'Date',
  datetime: 'Date & Time',
  boolean: 'Toggle',
  select: 'Dropdown',
  multi_select: 'Multi-Select',
  email: 'Email',
  phone: 'Phone',
  url: 'URL',
  file: 'File Upload',
  image: 'Image Upload',
  rating: 'Rating',
  color: 'Color',
  json: 'JSON',
}

export function CustomFieldsManager({
  entityTypes,
  initialFields,
}: {
  entityTypes: EntityType[]
  initialFields: Field[]
}) {
  const [activeTab, setActiveTab] = useState(entityTypes[0]?.entity_type || 'student')
  const [fields, setFields] = useState(initialFields)
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<CustomFieldType>('text')
  const [isCreating, setIsCreating] = useState(false)

  const filtered = fields.filter((f) => f.entity_type === activeTab)

  async function handleCreate() {
    if (!newLabel.trim()) return
    setIsCreating(true)
    const result = await createCustomField({
      entity_type: activeTab,
      label: newLabel,
      field_type: newType,
    })
    setIsCreating(false)
    if (result.ok && result.id) {
      setFields((prev) => [
        ...prev,
        {
          id: result.id!,
          entity_type: activeTab,
          field_key: newLabel.toLowerCase().replace(/\s+/g, '_'),
          label: newLabel,
          description: null,
          field_type: newType,
          is_required: false,
          is_searchable: false,
          is_filterable: false,
          is_visible_to_parents: false,
          is_parent_editable: false,
          section_label: null,
          sort_order: prev.length,
        },
      ])
      setNewLabel('')
      setShowCreate(false)
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCustomField(id)
    if (result.ok) setFields((prev) => prev.filter((f) => f.id !== id))
  }

  async function toggleMergeTag(id: string, next: boolean) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, is_merge_tag: next } : f)))
    const result = await updateCustomField({ id, is_merge_tag: next })
    if (!result.ok) {
      setFields((prev) => prev.map((f) => (f.id === id ? { ...f, is_merge_tag: !next } : f)))
    }
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {entityTypes.map((et) => (
          <button
            key={et.entity_type}
            onClick={() => setActiveTab(et.entity_type)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor:
                activeTab === et.entity_type ? 'var(--color-primary)' : 'var(--color-muted)',
              color:
                activeTab === et.entity_type
                  ? 'var(--color-primary-foreground)'
                  : 'var(--color-foreground)',
            }}
          >
            {et.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p
            className="text-sm py-8 text-center"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            No custom fields for this entity type yet.
          </p>
        )}

        {filtered.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">{field.label}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {FIELD_TYPE_LABELS[field.field_type] || field.field_type} · {field.field_key}
                </p>
              </div>
              <div className="flex gap-1">
                {field.is_required && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
                {field.is_searchable && (
                  <Badge variant="outline" className="text-xs">
                    Searchable
                  </Badge>
                )}
                {field.is_visible_to_parents && (
                  <Badge variant="outline" className="text-xs">
                    Parent-visible
                  </Badge>
                )}
                {field.is_merge_tag && (
                  <Badge variant="outline" className="text-xs">
                    Merge tag
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {field.entity_type === 'contact' && (
                <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!field.is_merge_tag}
                    onChange={(e) => toggleMergeTag(field.id, e.target.checked)}
                  />
                  Merge tag
                </label>
              )}
              <button
                onClick={() => handleDelete(field.id)}
                className="text-xs px-2 py-1 rounded hover:bg-red-50"
                style={{ color: 'var(--color-destructive)' }}
              >
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate ? (
        <div
          className="mt-4 p-4 rounded-lg border space-y-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Input
            placeholder="Field label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            autoFocus
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as CustomFieldType)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isCreating || !newLabel.trim()}>
              {isCreating ? 'Creating...' : 'Create Field'}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button className="mt-4" onClick={() => setShowCreate(true)}>
          + Add Custom Field
        </Button>
      )}
    </div>
  )
}
