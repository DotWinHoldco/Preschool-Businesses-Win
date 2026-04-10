'use client'

// @anchor: cca.daily-report.mood-selector
// Emoji-style mood picker for daily report entries.

import { useState } from 'react'
import { cn } from '@/lib/cn'

const MOODS = [
  { value: 'happy', emoji: '\u{1F60A}', label: 'Happy' },
  { value: 'calm', emoji: '\u{1F60C}', label: 'Calm' },
  { value: 'fussy', emoji: '\u{1F615}', label: 'Fussy' },
  { value: 'upset', emoji: '\u{1F622}', label: 'Upset' },
  { value: 'tired', emoji: '\u{1F634}', label: 'Tired' },
] as const

interface MoodSelectorProps {
  value?: string
  onChange?: (mood: string) => void
  className?: string
}

export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
  const [selected, setSelected] = useState(value ?? '')

  function handleSelect(mood: string) {
    setSelected(mood)
    onChange?.(mood)
  }

  return (
    <div className={cn('flex gap-3 flex-wrap', className)} role="radiogroup" aria-label="Mood">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          role="radio"
          aria-checked={selected === mood.value}
          aria-label={mood.label}
          onClick={() => handleSelect(mood.value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-[var(--radius,0.75rem)] p-3 min-w-[64px] min-h-[64px]',
            'border-2 transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
            selected === mood.value
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110'
              : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-muted-foreground)]',
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            {mood.emoji}
          </span>
          <span className="text-xs font-medium text-[var(--color-foreground)]">
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  )
}
