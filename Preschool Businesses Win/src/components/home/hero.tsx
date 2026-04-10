'use client'

// @anchor: marketing.home.hero
// Full hero section — headline, sub, CTAs, trust strip.
// Animated entrance with fadeUp from motion.ts.

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { fadeUp, stagger, easeOutExpo } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { Shield, Award, Heart, Clock } from 'lucide-react'

const TRUST_ITEMS = [
  { icon: Heart, label: '8:1 student-teacher ratio' },
  { icon: Shield, label: 'DFPS licensed' },
  { icon: Award, label: 'CPR & First Aid certified staff' },
  { icon: Clock, label: 'Open 6:30 AM \u2013 6:30 PM' },
] as const

export function Hero() {
  const prefersReduced = useReducedMotion()

  const Container = prefersReduced ? 'div' : motion.div
  const Item = prefersReduced ? 'div' : motion.div

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Decorative shapes */}
      <div
        className="pointer-events-none absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-[0.07]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full opacity-[0.05]"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10 pt-16 pb-12 md:pt-24 md:pb-16 lg:pt-32 lg:pb-20">
        <Container
          {...(!prefersReduced && {
            initial: 'hidden',
            animate: 'show',
            variants: stagger,
          })}
          className="max-w-2xl"
        >
          {/* Eyebrow */}
          <Item
            {...(!prefersReduced && { variants: fadeUp })}
          >
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
              Faith-based
              <span className="opacity-40">&middot;</span>
              Crandall, TX
            </span>
          </Item>

          {/* Headline */}
          <Item
            {...(!prefersReduced && { variants: fadeUp })}
          >
            <h1
              className={cn(
                'mt-6 text-[40px] font-extrabold leading-[0.95] tracking-tight md:text-[56px] lg:text-[72px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Where faith, learning, and play come together.
            </h1>
          </Item>

          {/* Subheadline */}
          <Item
            {...(!prefersReduced && { variants: fadeUp })}
          >
            <p
              className={cn(
                'mt-6 text-lg leading-relaxed md:text-xl lg:text-[22px] lg:leading-relaxed',
                'text-pretty max-w-xl',
              )}
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Crandall Christian Academy is a preschool built on the belief that
              every child deserves to be known, loved, and prepared &mdash;
              spiritually, socially, and academically.
            </p>
          </Item>

          {/* CTAs */}
          <Item
            {...(!prefersReduced && { variants: fadeUp })}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href="/enroll"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'transition-all hover:brightness-110 active:scale-[0.97]',
                'shadow-[0_8px_24px_-8px_rgba(92,185,97,.35)]',
              )}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              Enroll your child
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/programs"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'border transition-all hover:bg-[var(--color-muted)] active:scale-[0.97]',
              )}
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              Explore our programs
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </Item>
        </Container>
      </div>

      {/* Trust strip */}
      <div
        className="border-t"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-start">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                <item.icon
                  size={16}
                  className="shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
