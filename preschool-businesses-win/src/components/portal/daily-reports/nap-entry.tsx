// @anchor: cca.daily-report.nap-entry
// Nap entry display — start/end time and quality.

import { cn } from '@/lib/cn'

const QUALITY_MAP: Record<string, { label: string; color: string }> = {
  restful: { label: 'Restful', color: 'text-[var(--color-success)]' },
  restless: { label: 'Restless', color: 'text-[var(--color-warning)]' },
  refused: { label: 'Refused', color: 'text-[var(--color-destructive)]' },
}

interface NapEntryProps {
  startedAt: string
  endedAt: string
  quality: string
  className?: string
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return iso
  }
}

function computeDuration(start: string, end: string): string {
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const mins = Math.round(ms / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    const rem = mins % 60
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
  } catch {
    return ''
  }
}

export function NapEntry({ startedAt, endedAt, quality, className }: NapEntryProps) {
  const q = QUALITY_MAP[quality]
  const duration = computeDuration(startedAt, endedAt)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {formatTime(startedAt)} - {formatTime(endedAt)}
        </span>
        {duration && (
          <span className="text-xs text-[var(--color-muted-foreground)]">({duration})</span>
        )}
      </div>
      {q && (
        <span className={cn('text-sm font-medium', q.color)}>{q.label}</span>
      )}
    </div>
  )
}
