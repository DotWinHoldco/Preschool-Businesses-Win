'use client'

// @anchor: marketing.home.faith
// Faith statement section — eyebrow, heading, body about faith integration.

import { Reveal } from '@/components/ui/reveal'
import { cn } from '@/lib/cn'
import { Heart } from 'lucide-react'

export function FaithStatement() {
  return (
    <section
      className="py-20 md:py-28 lg:py-36"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mb-6 flex justify-center">
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-primary) 12%, transparent)`,
                }}
              >
                <Heart
                  size={28}
                  style={{ color: 'var(--color-primary)' }}
                />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Our foundation
            </span>
          </Reveal>

          <Reveal>
            <h2
              className={cn(
                'mt-4 text-[28px] font-bold leading-tight tracking-tight md:text-[36px] lg:text-[44px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Rooted in faith. Growing in love.
            </h2>
          </Reveal>

          <Reveal>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty mx-auto max-w-2xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              At CCA, faith isn&rsquo;t a subject &mdash; it&rsquo;s the soil everything grows in.
              Your child will hear Bible stories, sing worship songs, practice kindness,
              and learn that they are deeply, unconditionally loved. We welcome families
              of all backgrounds who share our commitment to raising children with strong
              character and a gentle heart.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
