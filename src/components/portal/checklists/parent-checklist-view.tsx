// @anchor: cca.checklist.parent-view
// Parent-facing view of their outstanding checklist items

import { CheckSquare, Upload, Pen, FileCheck, AlertCircle } from 'lucide-react'
import { ChecklistProgress } from './checklist-progress'
import type { ChecklistItemType } from '@/lib/schemas/checklist'

interface ChecklistItemDisplay {
  id: string
  title: string
  description: string | null
  item_type: ChecklistItemType
  required: boolean
  status: 'pending' | 'completed'
  due_date: string | null
}

interface AssignmentDisplay {
  id: string
  template_name: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  due_date: string | null
  items: ChecklistItemDisplay[]
}

interface ParentChecklistViewProps {
  assignments: AssignmentDisplay[]
}

const ITEM_TYPE_ICONS: Record<ChecklistItemType, typeof CheckSquare> = {
  document_upload: Upload,
  signature: Pen,
  acknowledgment: FileCheck,
  form_field: CheckSquare,
  custom: CheckSquare,
  check: CheckSquare,
  numeric: CheckSquare,
  text: CheckSquare,
  photo: Upload,
}

export function ParentChecklistView({ assignments }: ParentChecklistViewProps) {
  if (assignments.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <CheckSquare
          size={40}
          className="mx-auto mb-3"
          style={{ color: 'var(--color-success, #10B981)' }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          All caught up! No outstanding checklist items.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const completed = assignment.items.filter((i) => i.status === 'completed').length
        const total = assignment.items.length
        const isOverdue = assignment.status === 'overdue'

        return (
          <div
            key={assignment.id}
            className="rounded-lg border overflow-hidden"
            style={{
              borderColor: isOverdue ? 'var(--color-destructive)' : 'var(--color-border)',
              backgroundColor: 'var(--color-card)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {assignment.template_name}
                </h3>
                {isOverdue && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                    style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}
                  >
                    <AlertCircle size={12} />
                    Overdue
                  </span>
                )}
              </div>
              {assignment.due_date && (
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              )}
              <div className="mt-3">
                <ChecklistProgress completed={completed} total={total} size="sm" />
              </div>
            </div>

            {/* Items */}
            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {assignment.items.map((item) => {
                const Icon = ITEM_TYPE_ICONS[item.item_type]
                const isDone = item.status === 'completed'

                return (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDone
                          ? 'var(--color-success, #10B981)'
                          : 'var(--color-muted)',
                      }}
                    >
                      <Icon
                        size={14}
                        style={{ color: isDone ? 'white' : 'var(--color-muted-foreground)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: isDone
                            ? 'var(--color-muted-foreground)'
                            : 'var(--color-foreground)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {item.title}
                        {item.required && !isDone && (
                          <span style={{ color: 'var(--color-destructive)' }}> *</span>
                        )}
                      </p>
                      {item.description && (
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                    {!isDone && (
                      <span
                        className="text-xs font-medium rounded px-2 py-1"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        Complete
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
