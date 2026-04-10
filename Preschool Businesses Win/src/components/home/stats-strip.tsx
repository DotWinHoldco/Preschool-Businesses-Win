'use client'

// @anchor: marketing.home.stats
// Count-up stats strip — years, ratio, satisfaction, enrolled.
// Uses existing Stat component for animated count-up.

import { Stat } from '@/components/ui/stat'
import { Reveal } from '@/components/ui/reveal'

const STATS = [
  { value: 5, suffix: '+', label: 'Years serving Crandall families' },
  { value: 8, suffix: ':1', label: 'Student-teacher ratio' },
  { value: 98, suffix: '%', label: 'Parent satisfaction' },
  { value: 65, suffix: '+', label: 'Children enrolled this year' },
] as const

export function StatsStrip() {
  return (
    <section
      className="py-16 md:py-20"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {STATS.map((stat) => (
              <Stat
                key={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
