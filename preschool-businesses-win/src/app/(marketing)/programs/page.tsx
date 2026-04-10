// @anchor: marketing.programs
// Programs detail page — all program offerings per COPY.md.

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Baby, BookOpen, GraduationCap, Clock, Sun } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Programs — Crandall Christian Academy',
  description:
    'Explore CCA programs: Infants, Toddlers, Preschool, Pre-K, Before & After Care, and Summer Camp. Age-appropriate, faith-integrated, small ratios.',
}

const PROGRAMS = [
  {
    id: 'infants',
    icon: Baby,
    name: 'Infants',
    ages: '6 weeks \u2013 11 months',
    ratio: '4:1',
    schedule: '6:30 AM \u2013 6:30 PM',
    body: 'Gentle routines, tummy time, sensory exploration, and one-on-one bonding with dedicated caregivers. We follow your baby\u2019s schedule, not ours.',
    color: 'var(--color-primary)',
  },
  {
    id: 'toddlers',
    icon: BookOpen,
    name: 'Toddlers',
    ages: '12 \u2013 23 months',
    ratio: '5:1',
    schedule: '6:30 AM \u2013 6:30 PM',
    body: 'The world is opening up. Toddlers at CCA explore through structured play, early language, music, movement, and outdoor time \u2014 with teachers who redirect with patience and celebrate every milestone.',
    color: 'var(--color-secondary)',
  },
  {
    id: 'preschool',
    icon: GraduationCap,
    name: 'Preschool / Pre-K',
    ages: '2 \u2013 5 years',
    ratio: '9:1',
    schedule: '6:30 AM \u2013 6:30 PM',
    body: 'Kindergarten readiness through play-based learning, early literacy, math concepts, science exploration, art, and faith-integrated character development. Your child will leave CCA confident, curious, and kind.',
    color: 'var(--color-accent)',
  },
  {
    id: 'before-after',
    icon: Clock,
    name: 'Before & After Care',
    ages: 'All enrolled ages',
    ratio: 'Varies by age group',
    schedule: '6:30 \u2013 8:00 AM / 3:30 \u2013 6:30 PM',
    body: 'Extended hours for working families. Same environment, same teachers, same trust. Homework help for older students. Structured free play and snack time.',
    color: 'var(--color-primary)',
  },
  {
    id: 'summer',
    icon: Sun,
    name: 'Summer Camp',
    ages: '2 \u2013 5 years',
    ratio: 'Program-specific',
    schedule: 'Seasonal \u2013 weekly themes',
    body: 'Themed weekly adventures. Water play, nature walks, arts & crafts, VBS-style Bible lessons, and field trips. Registration opens in spring.',
    color: 'var(--color-secondary)',
  },
] as const

export default function ProgramsPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="py-16 md:py-24 lg:py-32"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Our programs
            </span>
            <h1
              className={cn(
                'mt-4 text-[32px] font-extrabold leading-[0.95] tracking-tight md:text-[48px] lg:text-[56px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Every age. Every stage. One trusted place.
            </h1>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              From infants to pre-K, before care to summer camp &mdash; CCA offers
              age-appropriate programs designed to nurture the whole child: body,
              mind, and spirit.
            </p>
          </div>
        </div>
      </section>

      {/* Program sections */}
      {PROGRAMS.map((program, i) => (
        <section
          key={program.id}
          id={program.id}
          className="py-16 md:py-24 border-t"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: i % 2 === 1 ? 'var(--color-muted)' : 'var(--color-background)',
          }}
        >
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              {/* Content */}
              <div className={cn(i % 2 === 1 && 'md:order-2')}>
                <div
                  className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${program.color} 12%, transparent)`,
                  }}
                >
                  <program.icon size={28} style={{ color: program.color }} />
                </div>

                <h2
                  className={cn(
                    'text-[26px] font-bold leading-tight tracking-tight md:text-[32px]',
                    'text-balance',
                  )}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-foreground)',
                  }}
                >
                  {program.name}
                </h2>

                <p
                  className="mt-4 text-base leading-relaxed md:text-lg text-pretty"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {program.body}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      Ages
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {program.ages}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      Ratio
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {program.ratio}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      Hours
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {program.schedule}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual placeholder */}
              <div
                className={cn(
                  'aspect-[4/3] rounded-[var(--radius,0.75rem)] overflow-hidden',
                  i % 2 === 1 && 'md:order-1',
                )}
                style={{
                  backgroundColor: `color-mix(in srgb, ${program.color} 8%, var(--color-muted))`,
                }}
              >
                <div className="flex h-full items-center justify-center">
                  <program.icon
                    size={80}
                    className="opacity-20"
                    style={{ color: program.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <h2
            className={cn(
              'text-[26px] font-bold leading-tight md:text-[32px] lg:text-[40px]',
              'text-balance',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            Find the right program for your family.
          </h2>
          <Link
            href="/enroll"
            className={cn(
              'mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full',
              'transition-all hover:opacity-90 active:scale-[0.97]',
            )}
            style={{
              backgroundColor: 'var(--color-primary-foreground)',
              color: 'var(--color-primary)',
            }}
          >
            Start enrollment
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>
    </>
  )
}
