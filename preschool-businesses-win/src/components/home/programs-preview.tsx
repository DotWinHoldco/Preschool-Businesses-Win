'use client'

// @anchor: marketing.home.programs
// Program preview cards — 4 cards with eyebrow age range, title, description.
// Animated on scroll via Reveal.

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { fadeUp, stagger } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { Baby, BookOpen, Clock, Sun } from 'lucide-react'

const PROGRAMS = [
  {
    icon: Baby,
    eyebrow: 'Ages 6 weeks \u2013 23 months',
    title: 'A safe, nurturing start.',
    body: 'Gentle routines, sensory play, and first friendships \u2014 in a room where every caregiver knows your baby by name.',
    color: 'var(--color-primary)',
  },
  {
    icon: BookOpen,
    eyebrow: 'Ages 2 \u2013 5',
    title: 'Ready for kindergarten. Ready for life.',
    body: 'Structured learning through play, early literacy, math foundations, and character development rooted in faith.',
    color: 'var(--color-secondary)',
  },
  {
    icon: Clock,
    eyebrow: 'Extended hours',
    title: 'Your schedule, covered.',
    body: 'Drop off early, pick up late. Your child stays in the same trusted environment with the same trusted faces.',
    color: 'var(--color-accent)',
  },
  {
    icon: Sun,
    eyebrow: 'Summer',
    title: "Summer shouldn\u2019t mean screen time.",
    body: 'Themed weeks, outdoor adventures, water play, and VBS-style faith activities. All summer long.',
    color: 'var(--color-primary)',
  },
] as const

export function ProgramsPreview() {
  const prefersReduced = useReducedMotion()
  const Container = prefersReduced ? 'div' : motion.div
  const Item = prefersReduced ? 'div' : motion.div

  return (
    <section className="py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-primary)' }}
          >
            Our programs
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
            Every age. Every stage. One trusted place.
          </h2>
          <p
            className="mt-4 text-base leading-relaxed md:text-lg text-pretty mx-auto max-w-2xl"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            From infants to pre-K, before care to summer camp &mdash; CCA offers
            age-appropriate programs designed to nurture the whole child: body,
            mind, and spirit.
          </p>
        </div>

        {/* Cards grid */}
        <Container
          {...(!prefersReduced && {
            initial: 'hidden',
            whileInView: 'show',
            viewport: { once: true, margin: '-10% 0px' },
            variants: stagger,
          })}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PROGRAMS.map((program) => (
            <Item
              key={program.title}
              {...(!prefersReduced && { variants: fadeUp })}
              className={cn(
                'group relative flex flex-col rounded-[var(--radius,0.75rem)] border p-6 lg:p-8',
                'bg-[var(--color-card)] transition-shadow',
                'shadow-[0_1px_2px_rgba(28,28,40,.04),0_8px_24px_-8px_rgba(28,28,40,.08)]',
                'hover:shadow-[0_2px_4px_rgba(28,28,40,.06),0_24px_48px_-12px_rgba(37,99,235,.12)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Icon */}
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${program.color} 12%, transparent)`,
                }}
              >
                <program.icon
                  size={24}
                  style={{ color: program.color }}
                />
              </div>

              {/* Eyebrow */}
              <span
                className="text-xs font-semibold uppercase tracking-[0.1em]"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {program.eyebrow}
              </span>

              {/* Title */}
              <h3
                className="mt-2 text-lg font-bold leading-snug text-balance"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-foreground)',
                }}
              >
                {program.title}
              </h3>

              {/* Body */}
              <p
                className="mt-2 text-sm leading-relaxed text-pretty flex-1"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {program.body}
              </p>
            </Item>
          ))}
        </Container>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/programs"
            className={cn(
              'inline-flex items-center gap-2 text-base font-semibold transition-colors hover:opacity-80',
            )}
            style={{ color: 'var(--color-primary)' }}
          >
            See all programs
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
