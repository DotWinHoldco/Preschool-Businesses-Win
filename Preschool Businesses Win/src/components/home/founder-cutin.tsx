'use client'

// @anchor: marketing.home.founder
// Director quote section — personal, trustworthy.

import { Reveal } from '@/components/ui/reveal'
import { cn } from '@/lib/cn'
import { Quote } from 'lucide-react'

export function FounderCutin() {
  return (
    <section className="py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              From the director
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
              Every child here is known by name.
            </h2>
          </Reveal>

          <Reveal>
            <div
              className={cn(
                'mt-8 relative rounded-[var(--radius,0.75rem)] border p-8 md:p-10',
              )}
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-card)',
              }}
            >
              {/* Decorative quote mark */}
              <div
                className="absolute -top-4 left-8 inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Quote
                  size={16}
                  className="rotate-180"
                  style={{ color: 'var(--color-primary-foreground)' }}
                />
              </div>

              <blockquote
                className="text-lg leading-relaxed md:text-xl md:leading-relaxed text-pretty"
                style={{ color: 'var(--color-foreground)' }}
              >
                &ldquo;I started CCA because I believed Crandall deserved a preschool
                where every child is treated like my own. When you walk through our
                doors, you&rsquo;ll see teachers on the floor with your kids, not
                behind a desk. That&rsquo;s not an accident &mdash; it&rsquo;s who
                we are.&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-4">
                {/* Avatar placeholder */}
                <div
                  className="h-12 w-12 shrink-0 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-primary) 15%, transparent)`,
                  }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Director
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Crandall Christian Academy
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
