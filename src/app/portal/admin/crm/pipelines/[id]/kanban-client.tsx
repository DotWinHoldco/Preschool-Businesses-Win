'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { moveKanbanCard } from '@/lib/actions/crm/audiences'
import type { LifecycleStage } from '@/lib/schemas/crm'

interface Card {
  contact_id: string
  column: string
  full_name: string | null
  email: string | null
  lifecycle_stage: LifecycleStage
}

interface Props {
  audienceId: string
  columns: string[]
  cards: Card[]
  accentColor: string
  lifecycleLabels: Record<LifecycleStage, string>
  lifecycleColors: Record<LifecycleStage, string>
}

export function KanbanClient({
  audienceId,
  columns,
  cards,
  accentColor,
  lifecycleLabels,
  lifecycleColors,
}: Props) {
  const router = useRouter()
  const [board, setBoard] = useState(cards)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const byColumn = new Map<string, Card[]>()
  for (const col of columns) byColumn.set(col, [])
  // Catch-all bucket for cards whose column was deleted.
  const orphans: Card[] = []
  for (const c of board) {
    if (byColumn.has(c.column)) byColumn.get(c.column)!.push(c)
    else orphans.push(c)
  }

  function onDragStart(contactId: string) {
    setDraggingId(contactId)
  }
  function onDragOver(e: React.DragEvent, col: string) {
    e.preventDefault()
    setOverColumn(col)
  }
  function onDrop(e: React.DragEvent, col: string) {
    e.preventDefault()
    setOverColumn(null)
    const id = draggingId
    setDraggingId(null)
    if (!id) return
    const card = board.find((c) => c.contact_id === id)
    if (!card || card.column === col) return

    // Optimistic move
    setBoard((prev) => prev.map((c) => (c.contact_id === id ? { ...c, column: col } : c)))
    startTransition(async () => {
      const r = await moveKanbanCard(audienceId, id, col)
      if (!r.ok) {
        // rollback
        setBoard((prev) =>
          prev.map((c) => (c.contact_id === id ? { ...c, column: card.column } : c)),
        )
        toast({ variant: 'error', title: 'Move failed', description: r.error })
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => {
        const items = byColumn.get(col) ?? []
        const isOver = overColumn === col
        return (
          <div
            key={col}
            onDragOver={(e) => onDragOver(e, col)}
            onDragLeave={() => setOverColumn((c) => (c === col ? null : c))}
            onDrop={(e) => onDrop(e, col)}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-2 transition-all ${isOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] bg-[var(--color-muted)]/20'}`}
          >
            <div
              className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between"
              style={{ borderTopColor: accentColor, borderTopWidth: 3 }}
            >
              <h3 className="font-semibold text-sm">{col}</h3>
              <span className="text-xs text-[var(--color-muted-foreground)] font-medium">
                {items.length}
              </span>
            </div>
            <div className="flex-1 min-h-[60vh] overflow-y-auto p-2 space-y-2">
              {items.map((c) => (
                <div
                  key={c.contact_id}
                  draggable
                  onDragStart={() => onDragStart(c.contact_id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`bg-white rounded-lg border border-[var(--color-border)] p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${draggingId === c.contact_id ? 'opacity-40' : ''}`}
                >
                  <Link href={`/portal/admin/crm/contacts/${c.contact_id}`} className="block">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: lifecycleColors[c.lifecycle_stage] }}
                        title={lifecycleLabels[c.lifecycle_stage]}
                      />
                      <p className="text-sm font-medium truncate">
                        {c.full_name || c.email || 'Unnamed'}
                      </p>
                    </div>
                    {c.email && (
                      <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 inline-flex items-center gap-1">
                        <Mail size={10} />
                        {c.email}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-[var(--color-muted-foreground)] text-center py-6">
                  Drop cards here
                </p>
              )}
            </div>
          </div>
        )
      })}
      {orphans.length > 0 && (
        <div className="flex-shrink-0 w-72 flex flex-col rounded-xl border-2 border-dashed border-[var(--color-border)]">
          <div className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[var(--color-muted-foreground)]">Unsorted</h3>
            <span className="text-xs">{orphans.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {orphans.map((c) => (
              <div
                key={c.contact_id}
                className="bg-white rounded-lg border border-[var(--color-border)] p-3 text-sm"
              >
                {c.full_name || c.email || 'Unnamed'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
