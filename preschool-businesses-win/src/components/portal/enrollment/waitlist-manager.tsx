// @anchor: cca.enrollment.waitlist
import { cn } from '@/lib/cn'
import { GripVertical, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react'

interface WaitlistEntry {
  id: string
  student_first_name: string
  student_last_name: string
  parent_name: string
  program_type: string
  triage_score: number | null
  created_at: string
  position: number
}

interface WaitlistManagerProps {
  entries: WaitlistEntry[]
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onApprove?: (id: string) => void
  onRemove?: (id: string) => void
}

export function WaitlistManager({ entries, onMoveUp, onMoveDown, onApprove, onRemove }: WaitlistManagerProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Waitlist</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {entries.length} {entries.length === 1 ? 'family' : 'families'} waiting
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Waitlist is empty
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-3 p-4">
              {/* Position */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => onMoveUp?.(entry.id)}
                  disabled={index === 0}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-bold text-[var(--color-foreground)]">
                  {entry.position}
                </span>
                <button
                  onClick={() => onMoveDown?.(entry.id)}
                  disabled={index === entries.length - 1}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <GripVertical className="h-4 w-4 flex-shrink-0 text-[var(--color-muted-foreground)]" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {entry.student_first_name} {entry.student_last_name}
                </span>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Parent: {entry.parent_name} | {entry.program_type}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Applied: {new Date(entry.created_at).toLocaleDateString()}
                  {entry.triage_score !== null && ` | Score: ${entry.triage_score}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                {onApprove && (
                  <button
                    onClick={() => onApprove(entry.id)}
                    className="rounded-[var(--radius)] bg-[var(--color-primary)] p-1.5 text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
                    title="Approve"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="rounded-[var(--radius)] border border-[var(--color-destructive)] p-1.5 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                    title="Remove"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
