'use client'

// @anchor: marketing.home.cta
// Final CTA band — enrollment prompt with action button.

import Link from 'next/link'
import { Reveal } from '@/components/ui/reveal'
import { cn } from '@/lib/cn'

export function FinalCtaBand() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
        <Reveal>
          <h2
            className={cn(
              'text-[28px] font-bold leading-tight md:text-[36px] lg:text-[44px]',
              'text-balance',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            Your child&rsquo;s best years start here.
          </h2>
        </Reveal>
        <Reveal>
          <p
            className="mt-3 text-base leading-relaxed md:text-lg max-w-md mx-auto opacity-90"
            style={{ color: 'var(--color-primary-foreground)' }}
          >
            Enrollment is open. Spots are limited.
          </p>
        </Reveal>
        <Reveal>
          <Link
            href="/enroll"
            className={cn(
              'mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full',
              'transition-all hover:opacity-90 active:scale-[0.97]',
              'shadow-lg',
            )}
            style={{
              backgroundColor: 'var(--color-primary-foreground)',
              color: 'var(--color-primary)',
            }}
          >
            Start your application
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
