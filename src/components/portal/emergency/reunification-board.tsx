// @anchor: cca.emergency.reunification-board
// Student release tracking during emergency reunification

import { UserCheck, Clock, AlertCircle } from 'lucide-react'

interface StudentStatus { id: string; student_name: string; classroom: string; released: boolean; released_to?: string; released_at?: string; verified_method?: string }
interface ReunificationBoardProps { students: StudentStatus[]; eventId: string }

export function ReunificationBoard({ students }: ReunificationBoardProps) {
  const released = students.filter((s) => s.released)
  const waiting = students.filter((s) => !s.released)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-success, #10B981)' }}>{released.length}</p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Released</p>
        </div>
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="text-3xl font-bold" style={{ color: waiting.length > 0 ? 'var(--color-warning)' : 'var(--color-success, #10B981)' }}>{waiting.length}</p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Awaiting</p>
        </div>
      </div>
      {waiting.length > 0 && (
        <div className="rounded-lg border" style={{ borderColor: 'var(--color-warning)', backgroundColor: 'var(--color-card)' }}>
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
            <AlertCircle size={14} style={{ color: 'var(--color-warning)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Awaiting Release ({waiting.length})</span>
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {waiting.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2">
                <Clock size={14} style={{ color: 'var(--color-warning)' }} />
                <div><p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{s.student_name}</p><p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{s.classroom}</p></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {released.length > 0 && (
        <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Released ({released.length})</span>
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {released.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2">
                <UserCheck size={14} style={{ color: 'var(--color-success, #10B981)' }} />
                <div className="flex-1"><p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{s.student_name}</p><p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Released to {s.released_to} at {s.released_at ? new Date(s.released_at).toLocaleTimeString() : ''} ({s.verified_method})</p></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
