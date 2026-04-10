// @anchor: cca.daily-report.photo-entry
// Photo upload display with caption for daily reports.

import { cn } from '@/lib/cn'

interface PhotoEntryProps {
  path: string
  caption?: string
  className?: string
}

export function PhotoEntry({ path, caption, className }: PhotoEntryProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt={caption ?? 'Daily report photo'}
          className="h-full w-full object-cover"
        />
      </div>
      {caption && (
        <p className="text-sm text-[var(--color-muted-foreground)]">{caption}</p>
      )}
    </div>
  )
}
