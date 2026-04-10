'use client'

// @anchor: marketing.home.testimonials
// 3 testimonial cards with placeholder parent quotes from COPY.md.

import { motion, useReducedMotion } from 'motion/react'
import { fadeUp, stagger } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      'We looked at five preschools. CCA was the only one where the director knew our daughter\u2019s name by the second visit.',
    name: 'Parent',
    location: 'Crandall',
  },
  {
    quote:
      'My son asks to go to school on the weekends. That tells me everything I need to know.',
    name: 'Parent',
    location: 'Crandall',
  },
  {
    quote:
      'The daily reports are incredible. I feel like I\u2019m there with him even when I\u2019m at work.',
    name: 'Parent',
    location: 'Crandall',
  },
] as const

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          fill="var(--color-primary)"
          stroke="var(--color-primary)"
        />
      ))}
    </div>
  )
}

export function Testimonials() {
  const prefersReduced = useReducedMotion()
  const Container = prefersReduced ? 'div' : motion.div
  const Item = prefersReduced ? 'div' : motion.div

  return (
    <section
      className="py-20 md:py-28 lg:py-36"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-primary)' }}
          >
            What parents say
          </span>
          <h2
            className={cn(
              'mt-4 text-[28px] font-bold leading-tight tracking-tight md:text-[36px] lg:text-[44px]',
              'text-balance mx-auto max-w-3xl',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-foreground)',
            }}
          >
            This is what it feels like.
          </h2>
        </div>

        {/* Cards */}
        <Container
          {...(!prefersReduced && {
            initial: 'hidden',
            whileInView: 'show',
            viewport: { once: true, margin: '-10% 0px' },
            variants: stagger,
          })}
          className="grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <Item
              key={i}
              {...(!prefersReduced && { variants: fadeUp })}
              className={cn(
                'flex flex-col gap-4 rounded-[var(--radius,0.75rem)] border p-6 md:p-8',
                'bg-[var(--color-card)]',
                'shadow-[0_1px_2px_rgba(28,28,40,.04),0_8px_24px_-8px_rgba(28,28,40,.08)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Stars />
              <blockquote
                className="flex-1 text-base leading-relaxed text-pretty"
                style={{ color: 'var(--color-foreground)' }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <div
                  className="h-10 w-10 shrink-0 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-secondary) 15%, transparent)`,
                  }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {t.location}
                  </p>
                </div>
              </div>
            </Item>
          ))}
        </Container>
      </div>
    </section>
  )
}
