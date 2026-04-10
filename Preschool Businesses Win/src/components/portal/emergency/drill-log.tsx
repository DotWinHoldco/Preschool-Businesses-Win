// @anchor: cca.emergency.drill-log
// Drill history list for compliance

import { ShieldCheck, Calendar } from 'lucide-react'

interface DrillRecord { id: string; event_type: string; title: string; initiated_at: string; resolved_at: string | null; initiated_by_name: string; notes: string | null }
interface DrillLogProps { drills: DrillRecord[] }

export function DrillLog({ drills }: DrillLogProps) {
  if (drills.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <ShieldCheck size={40} className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No drills recorded yet. Texas DFPS requires monthly fire drills and periodic lockdown drills.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {drills.map((drill) => (
          <li key={drill.id} className="flex items-center gap-4 px-5 py-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-muted)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{drill.title}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                <span className="flex items-center gap-1"><Calendar size={10} />{new Date(drill.initiated_at).toLocaleDateString()}</span>
                <span>{drill.event_type.replace(/_/g, ' ')}</span>
                <span>By: {drill.initiated_by_name}</span>
              </div>
              {drill.notes && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)' }}>{drill.notes}</p>}
            </div>
            {drill.resolved_at && (
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {Math.round((new Date(drill.resolved_at).getTime() - new Date(drill.initiated_at).getTime()) / 60000)} min
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
