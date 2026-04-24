// @anchor: cca.portfolio.timeline
import { Camera, Video, FileText, BookOpen, Star, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface PortfolioEntry {
  id: string
  entry_type: 'observation' | 'work_sample' | 'photo' | 'video' | 'learning_story' | 'milestone'
  title: string
  narrative: string
  visibility: 'parent' | 'staff_only'
  created_at: string
  created_by_name?: string
  learning_domains?: string[]
  media?: Array<{ file_path: string; media_type: string; caption?: string }>
}

interface PortfolioTimelineProps {
  entries: PortfolioEntry[]
  studentName: string
}

const entryTypeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  observation: { icon: Eye, label: 'Observation', color: 'var(--color-primary)' },
  work_sample: { icon: FileText, label: 'Work Sample', color: 'var(--color-secondary)' },
  photo: { icon: Camera, label: 'Photo', color: 'var(--color-accent)' },
  video: { icon: Video, label: 'Video', color: 'var(--color-accent)' },
  learning_story: { icon: BookOpen, label: 'Learning Story', color: 'var(--color-secondary)' },
  milestone: { icon: Star, label: 'Milestone', color: 'var(--color-warning)' },
}

export function PortfolioTimeline({ entries, studentName }: PortfolioTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-8 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)] mb-2" />
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No portfolio entries yet for {studentName}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          Start by adding an observation or work sample
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--color-border)]" />

        {entries.map((entry) => {
          const config = entryTypeConfig[entry.entry_type] ?? entryTypeConfig.observation
          const Icon = config.icon

          return (
            <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div
                className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-card)]"
                style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
              >
                {/* @ts-expect-error lucide icons accept style prop at runtime */}
                <Icon className="h-4 w-4" style={{ color: config.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
                        color: config.color,
                      }}
                    >
                      {config.label}
                    </span>
                    <h4 className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                      {entry.title}
                    </h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </div>
                    {entry.created_by_name && (
                      <div className="text-[10px] text-[var(--color-muted-foreground)]">
                        by {entry.created_by_name}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line line-clamp-4">
                  {entry.narrative}
                </p>

                {/* Learning domains */}
                {entry.learning_domains && entry.learning_domains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.learning_domains.map((d) => (
                      <span
                        key={d}
                        className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted-foreground)]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media thumbnails */}
                {entry.media && entry.media.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {entry.media.map((m, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 h-16 w-16 rounded-[var(--radius)] bg-[var(--color-muted)] flex items-center justify-center"
                      >
                        {m.media_type === 'photo' ? (
                          <Camera className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                        ) : m.media_type === 'video' ? (
                          <Video className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                        ) : (
                          <FileText className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {entry.visibility === 'staff_only' && (
                  <div className="mt-2 text-[10px] text-[var(--color-warning)] font-medium">
                    Staff only
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
