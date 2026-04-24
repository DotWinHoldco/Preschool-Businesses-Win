// @anchor: cca.leads.pipeline
'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { User, Phone, Mail } from 'lucide-react'

interface Lead {
  id: string
  parent_first_name: string
  parent_last_name: string
  parent_email: string | null
  parent_phone: string | null
  child_name: string | null
  program_interest: string | null
  status: string
  priority: string
  source: string
  created_at: string
}

const COLUMNS = [
  { key: 'new', label: 'New', color: 'var(--color-primary)' },
  { key: 'contacted', label: 'Contacted', color: 'var(--color-secondary)' },
  { key: 'tour_scheduled', label: 'Tour Scheduled', color: 'var(--color-warning)' },
  { key: 'tour_completed', label: 'Tour Done', color: 'var(--color-accent)' },
  { key: 'application_sent', label: 'App Sent', color: 'var(--color-secondary)' },
  { key: 'application_received', label: 'App Received', color: 'var(--color-primary)' },
  { key: 'enrolled', label: 'Enrolled', color: 'var(--color-primary)' },
]

interface LeadPipelineProps {
  leads: Lead[]
  onLeadClick?: (id: string) => void
  onStatusChange?: (id: string, newStatus: string) => void
}

const priorityColors: Record<string, string> = {
  hot: 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  warm: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  cold: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
}

export function LeadPipeline({ leads, onLeadClick, onStatusChange }: LeadPipelineProps) {
  const [draggedLead, setDraggedLead] = useState<string | null>(null)

  const handleDragStart = useCallback((leadId: string) => {
    setDraggedLead(leadId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (status: string) => {
      if (draggedLead) {
        onStatusChange?.(draggedLead, status)
        setDraggedLead(null)
      }
    },
    [draggedLead, onStatusChange],
  )

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.key)

        return (
          <div
            key={col.key}
            className="flex-shrink-0 w-64 md:w-72"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.key)}
          >
            {/* Column header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {col.label}
                </span>
                <span className="rounded-full bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px] rounded-[var(--radius)] bg-[var(--color-muted)]/30 p-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => onLeadClick?.(lead.id)}
                  className={cn(
                    'cursor-pointer rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm hover:shadow-md transition-shadow',
                    draggedLead === lead.id && 'opacity-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {lead.parent_first_name} {lead.parent_last_name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        priorityColors[lead.priority],
                      )}
                    >
                      {lead.priority}
                    </span>
                  </div>

                  {lead.child_name && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
                      Child: {lead.child_name}
                    </p>
                  )}
                  {lead.program_interest && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
                      Interest: {lead.program_interest}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {lead.parent_email && (
                      <Mail className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                    )}
                    {lead.parent_phone && (
                      <Phone className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                    )}
                    <span className="ml-auto text-[10px] text-[var(--color-muted-foreground)]">
                      {lead.source}
                    </span>
                  </div>
                </div>
              ))}

              {columnLeads.length === 0 && (
                <div className="flex h-24 items-center justify-center text-xs text-[var(--color-muted-foreground)]">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
