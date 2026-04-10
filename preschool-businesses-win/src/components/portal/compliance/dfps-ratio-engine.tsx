// @anchor: cca.dfps.ratio-engine
// Texas DFPS Chapter 746 ratio checker
// See CCA_BUILD_BRIEF.md §39

import { ShieldCheck, AlertTriangle } from 'lucide-react'

interface ClassroomRatio { classroom_id: string; classroom_name: string; students_present: number; staff_present: number; ratio_actual: number; ratio_required: number; compliant: boolean }
interface DFPSRatioEngineProps { classrooms: ClassroomRatio[] }

export function DFPSRatioEngine({ classrooms }: DFPSRatioEngineProps) {
  const allCompliant = classrooms.every((c) => c.compliant)
  const violations = classrooms.filter((c) => !c.compliant)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border p-4 flex items-center gap-3" style={{ borderColor: allCompliant ? 'var(--color-success, #10B981)' : 'var(--color-destructive)', backgroundColor: 'var(--color-card)' }}>
        {allCompliant ? <ShieldCheck size={24} style={{ color: 'var(--color-success, #10B981)' }} /> : <AlertTriangle size={24} style={{ color: 'var(--color-destructive)' }} />}
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {allCompliant ? 'All Classrooms Compliant' : `${violations.length} Classroom${violations.length !== 1 ? 's' : ''} Out of Ratio`}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Texas DFPS Chapter 746 Minimum Standards</p>
        </div>
      </div>

      {/* Classroom grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {classrooms.map((c) => (
          <div key={c.classroom_id} className="rounded-lg border p-4" style={{ borderColor: c.compliant ? 'var(--color-border)' : 'var(--color-destructive)', backgroundColor: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>{c.classroom_name}</h4>
              {c.compliant ? <ShieldCheck size={16} style={{ color: 'var(--color-success, #10B981)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--color-destructive)' }} />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{c.students_present}</p><p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Students</p></div>
              <div><p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{c.staff_present}</p><p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Staff</p></div>
              <div><p className="text-lg font-bold" style={{ color: c.compliant ? 'var(--color-success, #10B981)' : 'var(--color-destructive)' }}>{c.ratio_actual}:1</p><p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Req: {c.ratio_required}:1</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
