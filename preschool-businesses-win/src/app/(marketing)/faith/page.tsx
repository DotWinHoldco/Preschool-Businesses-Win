// @anchor: marketing.faith
// Faith & mission page per COPY.md.

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Heart, BookOpen, Music, Users, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Faith — Crandall Christian Academy',
  description:
    'CCA is built on a Christian foundation. Chapel time, Bible stories, worship, and character development woven into every day — gently, joyfully, and with respect.',
}

export default function FaithPage() {
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
              Our faith
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
              Built on a foundation that lasts.
            </h1>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              At CCA, faith is woven into everything we do &mdash; gently,
              joyfully, and with deep respect for every family&rsquo;s journey.
            </p>
          </div>
        </div>
      </section>

      {/* How faith shows up */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              How faith shows up
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[32px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Woven in, never forced.
            </h2>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Faith at CCA is not a separate class or a checkbox. It&rsquo;s how
              we teach kindness, how we start our mornings, how we handle conflict,
              and how we celebrate each child. All age-appropriate. Never forced.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { icon: BookOpen, title: 'Bible stories', desc: 'Age-appropriate stories that teach character, compassion, and curiosity about the world God made.' },
              { icon: Music, title: 'Worship songs', desc: 'Joyful music time that builds confidence, rhythm, and a heart of gratitude.' },
              { icon: Heart, title: 'Character lessons', desc: 'Kindness, patience, forgiveness, gratitude \u2014 the values that shape who children become.' },
              { icon: Users, title: 'Chapel time', desc: 'A weekly gathering where children learn community, celebration, and reverence.' },
              { icon: Sparkles, title: 'Prayer before meals', desc: 'Simple moments of thankfulness that ground the day in purpose.' },
              { icon: Heart, title: 'Unconditional love', desc: 'Every child learns they are deeply valued \u2014 not for what they do, but for who they are.' },
            ].map((item) => (
              <div
                key={item.title}
                className={cn(
                  'flex flex-col gap-3 rounded-[var(--radius,0.75rem)] border p-6',
                  'bg-[var(--color-card)]',
                )}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-primary) 12%, transparent)`,
                  }}
                >
                  <item.icon size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3
                  className="text-base font-bold"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-foreground)',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-pretty"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcoming all families */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Welcoming all families
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[32px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              A place for every family.
            </h2>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty mx-auto max-w-2xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              We serve families from many backgrounds and faith traditions. Our
              goal is not to convert &mdash; it&rsquo;s to introduce children to
              the values of love, service, and character that transcend any single
              tradition.
            </p>
          </div>
        </div>
      </section>

      {/* Statement of faith */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Our belief
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[32px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Statement of faith
            </h2>
            <div
              className={cn(
                'mt-8 rounded-[var(--radius,0.75rem)] border p-8 md:p-10 text-left',
                'bg-[var(--color-card)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p
                className="text-base leading-relaxed text-pretty"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Crandall Christian Academy is guided by Christian values of love,
                grace, service, and the belief that every child is a gift from God.
                We teach children to love one another, to be kind, to forgive, and
                to be grateful. Our curriculum and daily practices reflect these
                values while welcoming families of all faith backgrounds who share
                our commitment to raising children of strong character.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <h2
            className={cn(
              'text-[26px] font-bold leading-tight md:text-[32px]',
              'text-balance',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            See faith in action. Schedule a visit.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'transition-all hover:opacity-90 active:scale-[0.97]',
              )}
              style={{
                backgroundColor: 'var(--color-primary-foreground)',
                color: 'var(--color-primary)',
              }}
            >
              Schedule a tour
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/enroll"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'border transition-all hover:opacity-90 active:scale-[0.97]',
              )}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              Start enrollment
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
