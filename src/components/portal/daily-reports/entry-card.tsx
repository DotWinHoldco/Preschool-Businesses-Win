// @anchor: cca.daily-report.entry-card
// Renders a single entry in the daily report timeline.

import { cn } from '@/lib/cn'
import { MealEntry } from './meal-entry'
import { NapEntry } from './nap-entry'
import { ActivityEntry } from './activity-entry'
import { PhotoEntry } from './photo-entry'
import {
  UtensilsCrossed,
  Moon,
  Baby,
  Palette,
  Smile,
  Star,
  StickyNote,
  Camera,
} from 'lucide-react'

const ENTRY_ICONS: Record<string, { icon: typeof UtensilsCrossed; color: string; label: string }> = {
  meal: { icon: UtensilsCrossed, color: 'text-orange-500', label: 'Meal' },
  nap: { icon: Moon, color: 'text-indigo-500', label: 'Nap' },
  diaper: { icon: Baby, color: 'text-sky-500', label: 'Diaper' },
  activity: { icon: Palette, color: 'text-emerald-500', label: 'Activity' },
  mood: { icon: Smile, color: 'text-amber-500', label: 'Mood' },
  milestone: { icon: Star, color: 'text-yellow-500', label: 'Milestone' },
  note: { icon: StickyNote, color: 'text-gray-500', label: 'Note' },
  photo: { icon: Camera, color: 'text-pink-500', label: 'Photo' },
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '\u{1F60A}',
  calm: '\u{1F60C}',
  fussy: '\u{1F615}',
  upset: '\u{1F622}',
  tired: '\u{1F634}',
}

interface EntryCardProps {
  entryType: string
  timestamp: string
  data: Record<string, unknown>
  enteredBy?: string
  className?: string
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return iso
  }
}

export function EntryCard({ entryType, timestamp, data, enteredBy, className }: EntryCardProps) {
  const meta = ENTRY_ICONS[entryType] ?? ENTRY_ICONS.note
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'flex gap-3 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4',
        className,
      )}
    >
      {/* Icon column */}
      <div className={cn('mt-0.5 shrink-0', meta.color)}>
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {meta.label}
          </span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Entry-specific rendering */}
        {entryType === 'meal' && (
          <MealEntry
            mealType={data.meal_type as string}
            items={(data.items_offered as string[]) ?? []}
            amountEaten={data.amount_eaten as string}
            notes={data.notes as string | undefined}
          />
        )}

        {entryType === 'nap' && (
          <NapEntry
            startedAt={data.started_at as string}
            endedAt={data.ended_at as string}
            quality={data.quality as string}
          />
        )}

        {entryType === 'diaper' && (
          <div className="text-sm text-[var(--color-foreground)]">
            <span className="font-medium capitalize">{data.type as string}</span>
            {data.notes != null ? (
              <span className="text-[var(--color-muted-foreground)]"> - {String(data.notes)}</span>
            ) : null}
          </div>
        )}

        {entryType === 'activity' && (
          <ActivityEntry
            activityName={data.activity_name as string}
            description={data.description as string | undefined}
            engagementLevel={data.engagement_level as string}
            photoPaths={(data.photo_paths as string[]) ?? []}
          />
        )}

        {entryType === 'mood' && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{MOOD_EMOJI[data.overall as string] ?? ''}</span>
            <span className="text-sm font-medium capitalize text-[var(--color-foreground)]">
              {data.overall as string}
            </span>
            {data.notes != null ? (
              <span className="text-sm text-[var(--color-muted-foreground)]">
                - {String(data.notes)}
              </span>
            ) : null}
          </div>
        )}

        {entryType === 'milestone' && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {data.milestone as string}
            </span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {data.category as string}
            </span>
            {data.notes != null ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">{String(data.notes)}</p>
            ) : null}
          </div>
        )}

        {entryType === 'note' && (
          <p className="text-sm text-[var(--color-foreground)]">{data.text as string}</p>
        )}

        {entryType === 'photo' && (
          <PhotoEntry path={data.path as string} caption={data.caption as string | undefined} />
        )}

        {/* Attribution */}
        {enteredBy && (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            by {enteredBy}
          </p>
        )}
      </div>
    </div>
  )
}
