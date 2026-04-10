'use client'

// @anchor: cca.checklist.template-builder
// Checklist template builder — create/edit templates with items
// See CCA_BUILD_BRIEF.md §34

import { useState, useCallback } from 'react'
import { Plus, GripVertical, Trash2, Save } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ChecklistItemType, ChecklistTargetType } from '@/lib/schemas/checklist'

interface TemplateItem {
  id: string
  title: string
  description: string
  item_type: ChecklistItemType
  required: boolean
  sort_order: number
  deadline_days_from_assignment: number | null
}

interface TemplateBuilderProps {
  initialName?: string
  initialTargetType?: ChecklistTargetType
  initialDescription?: string
  initialItems?: TemplateItem[]
  onSave: (data: {
    name: string
    target_type: ChecklistTargetType
    description: string
    items: TemplateItem[]
  }) => void
  saving?: boolean
}

const ITEM_TYPE_LABELS: Record<ChecklistItemType, string> = {
  document_upload: 'Document Upload',
  signature: 'E-Signature',
  acknowledgment: 'Acknowledgment',
  form_field: 'Form Field',
  custom: 'Custom',
}

const TARGET_TYPE_LABELS: Record<ChecklistTargetType, string> = {
  parent: 'Parent / Family',
  staff: 'Staff',
  student: 'Student',
}

export function TemplateBuilder({
  initialName = '',
  initialTargetType = 'parent',
  initialDescription = '',
  initialItems = [],
  onSave,
  saving = false,
}: TemplateBuilderProps) {
  const [name, setName] = useState(initialName)
  const [targetType, setTargetType] = useState<ChecklistTargetType>(initialTargetType)
  const [description, setDescription] = useState(initialDescription)
  const [items, setItems] = useState<TemplateItem[]>(initialItems)

  const addItem = useCallback(() => {
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      item_type: 'acknowledgment',
      required: true,
      sort_order: items.length,
      deadline_days_from_assignment: null,
    }
    setItems((prev) => [...prev, newItem])
  }, [items.length])

  const updateItem = useCallback((id: string, updates: Partial<TemplateItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id).map((item, i) => ({ ...item, sort_order: i })))
  }, [])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, target_type: targetType, description, items })
  }

  return (
    <div className="space-y-6">
      {/* Template details */}
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
          Template Details
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="tmpl-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Template Name
            </label>
            <input
              id="tmpl-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Parent Onboarding"
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            />
          </div>
          <div>
            <label htmlFor="tmpl-target" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Target Audience
            </label>
            <select
              id="tmpl-target"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as ChecklistTargetType)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            >
              {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tmpl-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Description
            </label>
            <textarea
              id="tmpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Checklist Items ({items.length})
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            No items yet. Click &quot;Add Item&quot; to start building your checklist.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-md border p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-2 cursor-grab" style={{ color: 'var(--color-muted-foreground)' }}>
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="Item title"
                        className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                        aria-label={`Item ${index + 1} title`}
                      />
                      <select
                        value={item.item_type}
                        onChange={(e) => updateItem(item.id, { item_type: e.target.value as ChecklistItemType })}
                        className="rounded-md border px-2 py-1.5 text-sm"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                        aria-label={`Item ${index + 1} type`}
                      >
                        {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-foreground)' }}>
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                        />
                        Required
                      </label>
                      <div className="flex items-center gap-1.5">
                        <label className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          Due in
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={item.deadline_days_from_assignment ?? ''}
                          onChange={(e) =>
                            updateItem(item.id, {
                              deadline_days_from_assignment: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          className="w-16 rounded-md border px-2 py-1 text-sm"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                          placeholder="--"
                          aria-label={`Item ${index + 1} deadline days`}
                        />
                        <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>days</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={cn('mt-1 rounded p-1 hover:bg-red-50')}
                    style={{ color: 'var(--color-destructive)' }}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  )
}
