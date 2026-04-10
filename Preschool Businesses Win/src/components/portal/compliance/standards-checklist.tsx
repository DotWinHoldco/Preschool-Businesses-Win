'use client'

// @anchor: cca.compliance.standards-checklist
// Texas Chapter 746 minimum standards checklist
// See CCA_BUILD_BRIEF.md §39

import { useState } from 'react'
import { ShieldCheck, AlertTriangle, XCircle, Minus } from 'lucide-react'

interface Standard { id: string; standard_number: string; category: string; title: string; is_critical: boolean; current_status: 'compliant' | 'non_compliant' | 'needs_attention' | 'not_applicable' | null }
interface StandardsChecklistProps { standards: Standard[]; onCheck: (standardId: string, status: string, notes?: string) => void }

const STATUS_CONFIG = {
  compliant: { icon: ShieldCheck, color: 'var(--color-success, #10B981)', label: 'Compliant' },
  non_compliant: { icon: XCircle, color: 'var(--color-destructive)', label: 'Non-Compliant' },
  needs_attention: { icon: AlertTriangle, color: 'var(--color-warning)', label: 'Needs Attention' },
  not_applicable: { icon: Minus, color: 'var(--color-muted-foreground)', label: 'N/A' },
}

export function StandardsChecklist({ standards, onCheck }: StandardsChecklistProps) {
  const [filter, setFilter] = useState<string>('all')
  const categories = [...new Set(standards.map((s) => s.category))]

  const filtered = filter === 'all' ? standards : standards.filter((s) => s.category === filter)
  const grouped = new Map<string, Standard[]>()
  for (const s of filtered) {
    if (!grouped.has(s.category)) grouped.set(s.category, [])
    grouped.get(s.category)!.push(s)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className="rounded-full px-3 py-1 text-xs font-medium border" style={{ backgroundColor: filter === 'all' ? 'var(--color-primary)' : 'transparent', color: filter === 'all' ? 'white' : 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className="rounded-full px-3 py-1 text-xs font-medium border" style={{ backgroundColor: filter === cat ? 'var(--color-primary)' : 'transparent', color: filter === cat ? 'white' : 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>{cat}</button>
        ))}
      </div>
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted-foreground)' }}>{category}</h3>
          <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {items.map((standard) => {
                const statusCfg = standard.current_status ? STATUS_CONFIG[standard.current_status] : null
                return (
                  <li key={standard.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>{standard.standard_number}</span>
                        {standard.is_critical && <span className="text-[10px] font-medium rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-destructive)', color: 'white' }}>CRITICAL</span>}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{standard.title}</p>
                    </div>
                    <select value={standard.current_status ?? ''} onChange={(e) => onCheck(standard.id, e.target.value)} className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: 'var(--color-border)', color: statusCfg?.color ?? 'var(--color-foreground)' }} aria-label={`Status for ${standard.standard_number}`}>
                      <option value="">Not Checked</option>
                      <option value="compliant">Compliant</option>
                      <option value="needs_attention">Needs Attention</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="not_applicable">N/A</option>
                    </select>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
