// @anchor: cca.curriculum.standards-picker
'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { Search, Check, X } from 'lucide-react'

interface Standard {
  id: string
  name: string
  category: string
  age_group: string
  source: string
}

interface StandardsPickerProps {
  standards: Standard[]
  selected: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export function StandardsPicker({ standards, selected, onChange, label = 'Learning Standards' }: StandardsPickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return standards
    const q = search.toLowerCase()
    return standards.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q)
    )
  }, [standards, search])

  const grouped = useMemo(() => {
    const groups: Record<string, Standard[]> = {}
    for (const s of filtered) {
      const key = `${s.source} - ${s.category}`
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    return groups
  }, [filtered])

  const selectedStandards = useMemo(
    () => standards.filter((s) => selected.includes(s.id)),
    [standards, selected]
  )

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--color-muted-foreground)]">{label}</label>

      {/* Selected badges */}
      {selectedStandards.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedStandards.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]"
            >
              {s.name}
              <button onClick={() => toggle(s.id)} className="hover:text-[var(--color-destructive)]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Picker trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-left text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] transition-colors"
      >
        {selected.length > 0 ? `${selected.length} selected` : 'Select standards...'}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg max-h-64 overflow-y-auto">
          <div className="sticky top-0 bg-[var(--color-card)] p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search standards..."
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                autoFocus
              />
            </div>
          </div>
          <div className="p-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {group}
                </div>
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors',
                      selected.includes(s.id)
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                    )}
                  >
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      selected.includes(s.id)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                        : 'border-[var(--color-border)]'
                    )}>
                      {selected.includes(s.id) && <Check className="h-3 w-3 text-[var(--color-primary-foreground)]" />}
                    </div>
                    <span className="flex-1 truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-[var(--color-muted-foreground)]">
                No standards found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
