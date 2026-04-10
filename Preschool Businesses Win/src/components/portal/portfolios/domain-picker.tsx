// @anchor: cca.portfolio.domain-picker
'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { Search, Check, ChevronDown } from 'lucide-react'

interface LearningDomain {
  id: string
  framework: string
  domain_name: string
  subdomain_name: string | null
  description?: string
  age_group?: string
}

interface DomainPickerProps {
  domains: LearningDomain[]
  selected: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export function DomainPicker({ domains, selected, onChange, label = 'Learning Domains' }: DomainPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search) return domains
    const q = search.toLowerCase()
    return domains.filter(
      (d) =>
        d.domain_name.toLowerCase().includes(q) ||
        (d.subdomain_name?.toLowerCase().includes(q) ?? false) ||
        d.framework.toLowerCase().includes(q)
    )
  }, [domains, search])

  const groupedByFramework = useMemo(() => {
    const groups: Record<string, Record<string, LearningDomain[]>> = {}
    for (const d of filtered) {
      if (!groups[d.framework]) groups[d.framework] = {}
      const domKey = d.domain_name
      if (!groups[d.framework][domKey]) groups[d.framework][domKey] = []
      groups[d.framework][domKey].push(d)
    }
    return groups
  }, [filtered])

  const toggleFramework = (fw: string) => {
    setExpandedFrameworks((prev) => {
      const next = new Set(prev)
      if (next.has(fw)) next.delete(fw)
      else next.add(fw)
      return next
    })
  }

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const frameworkLabels: Record<string, string> = {
    texas_prek_guidelines: 'Texas Pre-K Guidelines',
    naeyc: 'NAEYC Standards',
    head_start_elof: 'Head Start ELOF',
    cca_faith: 'Faith-Based Domains',
    custom: 'Custom Domains',
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--color-muted-foreground)]">{label}</label>

      {selected.length > 0 && (
        <p className="text-xs text-[var(--color-primary)]">{selected.length} domain(s) selected</p>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] transition-colors"
      >
        <span>{selected.length > 0 ? `${selected.length} selected` : 'Select learning domains...'}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg max-h-72 overflow-y-auto">
          <div className="sticky top-0 bg-[var(--color-card)] p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domains..."
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                autoFocus
              />
            </div>
          </div>

          <div className="p-1">
            {Object.entries(groupedByFramework).map(([framework, domainGroups]) => (
              <div key={framework} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleFramework(framework)}
                  className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform',
                      !expandedFrameworks.has(framework) && '-rotate-90'
                    )}
                  />
                  {frameworkLabels[framework] ?? framework}
                </button>

                {expandedFrameworks.has(framework) &&
                  Object.entries(domainGroups).map(([domainName, items]) => (
                    <div key={domainName} className="ml-3">
                      <div className="px-2 py-1 text-[10px] font-medium text-[var(--color-foreground)]">
                        {domainName}
                      </div>
                      {items.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggle(d.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-left transition-colors ml-2',
                            selected.includes(d.id)
                              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                              : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-3.5 w-3.5 items-center justify-center rounded border',
                              selected.includes(d.id)
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                : 'border-[var(--color-border)]'
                            )}
                          >
                            {selected.includes(d.id) && (
                              <Check className="h-2.5 w-2.5 text-[var(--color-primary-foreground)]" />
                            )}
                          </div>
                          <span className="truncate">{d.subdomain_name ?? d.domain_name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
