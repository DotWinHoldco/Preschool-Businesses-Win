// @anchor: cca.compliance.inspection-history
// Inspection records display

import { ClipboardList, FileText, Calendar } from 'lucide-react'

interface InspectionRecord { id: string; inspection_date: string; inspector_name: string; inspection_type: string; overall_result: string; document_path: string | null }
interface InspectionHistoryProps { records: InspectionRecord[] }

export function InspectionHistory({ records }: InspectionHistoryProps) {
  const resultConfig: Record<string, { color: string; label: string }> = {
    compliant: { color: 'var(--color-success, #10B981)', label: 'Compliant' },
    non_compliant: { color: 'var(--color-destructive)', label: 'Non-Compliant' },
    corrective_action_required: { color: 'var(--color-warning)', label: 'Corrective Action Required' },
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <ClipboardList size={40} className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No inspection records yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {records.map((r) => {
          const cfg = resultConfig[r.overall_result] ?? { color: 'var(--color-muted-foreground)', label: r.overall_result }
          return (
            <li key={r.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-muted)' }}>
                <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{r.inspection_type.replace(/_/g, ' ')} Inspection</p>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <span className="flex items-center gap-1"><Calendar size={10} />{new Date(r.inspection_date).toLocaleDateString()}</span>
                  <span>{r.inspector_name}</span>
                </div>
              </div>
              <span className="text-xs font-medium rounded-full px-2.5 py-0.5" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
              {r.document_path && <button className="rounded p-1.5 hover:bg-gray-100" style={{ color: 'var(--color-foreground)' }} aria-label="View report"><FileText size={14} /></button>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
