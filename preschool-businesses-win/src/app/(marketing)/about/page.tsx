// @anchor: marketing.about
// About page — school story, mission, team, facility per COPY.md.

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Heart, Users, Building2, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us — Crandall Christian Academy',
  description:
    'Learn about Crandall Christian Academy — our story, mission, team, and facility. A faith-based preschool where every child is known by name.',
}

export default function AboutPage() {
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
              About CCA
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
              Small school. Big mission.
            </h1>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Crandall Christian Academy has been serving families in Crandall,
              Texas since its founding. We&rsquo;re small on purpose &mdash;
              because every child deserves to be known.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--color-primary)' }}
              >
                Our story
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
                Born from a belief that Crandall deserves better.
              </h2>
              <div
                className="mt-6 space-y-4 text-base leading-relaxed text-pretty"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                <p>
                  Crandall Christian Academy was founded with a simple vision: every
                  child in this community should have access to a preschool where
                  they&rsquo;re known by name, loved without condition, and prepared
                  for the next chapter of their lives.
                </p>
                <p>
                  What started as a small classroom with a handful of families has
                  grown into a trusted home for dozens of children &mdash; but
                  we&rsquo;ve stayed small on purpose. Because when you limit the
                  size, you multiply the impact.
                </p>
              </div>
            </div>
            <div
              className="aspect-[4/3] rounded-[var(--radius,0.75rem)] overflow-hidden"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-primary) 8%, var(--color-muted))`,
              }}
            >
              <div className="flex h-full items-center justify-center">
                <Heart size={80} className="opacity-20" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
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
              Our mission
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
              Nurturing the whole child.
            </h2>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-2xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              To provide a nurturing, faith-based learning environment where every
              child is known by name, loved without condition, and prepared for the
              next step in their journey.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: 'Faith-centered', desc: 'Character and values woven into every day.' },
              { icon: Users, title: 'Small ratios', desc: '8:1 or better in every classroom.' },
              { icon: Shield, title: 'Safe & secure', desc: 'Controlled access, certified staff, allergy protocols.' },
              { icon: Building2, title: 'Community-rooted', desc: 'Serving Crandall families with purpose.' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center gap-3 p-6"
              >
                <div
                  className="h-12 w-12 inline-flex items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-primary) 12%, transparent)`,
                  }}
                >
                  <item.icon size={24} style={{ color: 'var(--color-primary)' }} />
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
                  className="text-sm text-pretty"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 md:py-24" id="team">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center mb-12">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Our team
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
              The people who make it possible.
            </h2>
            <p
              className="mt-4 text-base leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Every member of our team is background-checked, CPR/First Aid
              certified, and trained in early childhood development. Not
              babysitters &mdash; educators.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              { name: 'Director', role: 'School Director', bio: 'Leading CCA with faith, vision, and a heart for every family.' },
              { name: 'Lead Teacher', role: 'Infant/Toddler Lead', bio: 'Creating gentle, nurturing environments for our youngest learners.' },
              { name: 'Lead Teacher', role: 'Pre-K Lead', bio: 'Preparing confident, curious children for their next big step.' },
            ].map((member, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center text-center gap-4 rounded-[var(--radius,0.75rem)] border p-6',
                  'bg-[var(--color-card)]',
                )}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="h-20 w-20 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-secondary) 12%, transparent)`,
                  }}
                />
                <div>
                  <p
                    className="text-base font-bold"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    {member.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {member.role}
                  </p>
                  <p
                    className="mt-2 text-sm text-pretty"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTAs */}
      <section
        className="py-16 md:py-20 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'border transition-all hover:bg-[var(--color-muted)] active:scale-[0.97]',
              )}
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              Tour the school
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/enroll"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'transition-all hover:brightness-110 active:scale-[0.97]',
              )}
              style={{
                backgroundColor: 'var(--color-primary)',
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
