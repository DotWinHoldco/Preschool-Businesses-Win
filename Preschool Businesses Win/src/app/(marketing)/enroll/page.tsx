// @anchor: marketing.enroll
// Enrollment page — PASTOR funnel + enrollment wizard per CCA_MARKETING_BRIEF.md §4.
// P (Problem) → A (Amplify) → S (Solution) → T (Testimonials) → O (Offer) → R (Risk Reversal) → Wizard

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { EnrollmentWizard } from '@/components/enrollment/enrollment-wizard'
import {
  Shield,
  Eye,
  Heart,
  Users,
  Lock,
  Phone,
  Star,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enroll — Crandall Christian Academy',
  description:
    'Enroll your child at Crandall Christian Academy. Simple 4-step application. Faith-based preschool in Crandall, TX with small class sizes and certified staff.',
}

export default function EnrollPage() {
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
              Enrollment
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
              The preschool search ends here.
            </h1>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Enrolling at CCA starts with a simple application. Four steps, about
              five minutes. We&rsquo;ll be in touch within two business days.
            </p>
            <Link
              href="#apply"
              className={cn(
                'mt-8 inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-full',
                'transition-all hover:brightness-110 active:scale-[0.97]',
                'shadow-[0_8px_24px_-8px_rgba(92,185,97,.35)]',
              )}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              Start your application
              <span aria-hidden="true">&darr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* P — Problem */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              The problem
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Finding a preschool you trust shouldn&rsquo;t be this hard.
            </h2>
            <div
              className="mt-6 space-y-4 text-base leading-relaxed md:text-lg text-pretty"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <p>
                You&rsquo;ve read the reviews. You&rsquo;ve driven past the buildings.
                You&rsquo;ve toured places that smelled like bleach and places that
                smelled like chaos. Some had beautiful websites and empty playgrounds.
                Others had great teachers but no communication &mdash; you dropped your
                child off and heard nothing until pickup.
              </p>
              <p>
                You don&rsquo;t need a preschool with a fancy lobby. You need one where
                the teachers know your child&rsquo;s name, your child&rsquo;s allergies,
                and your child&rsquo;s favorite book. You need to know what happened
                today &mdash; not in a two-word answer at pickup, but in a real report
                with photos and details. You need to trust the people in the room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A — Amplify */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Why it matters
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              These years don&rsquo;t come back.
            </h2>
            <div
              className="mt-6 space-y-4 text-base leading-relaxed md:text-lg text-pretty"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <p>
                The research is clear: the preschool years shape everything that
                follows &mdash; language, social skills, emotional regulation,
                curiosity, confidence. The wrong environment doesn&rsquo;t just waste
                tuition. It shapes your child&rsquo;s relationship with learning, with
                authority, with other kids, with themselves.
              </p>
              <p>
                And it shapes your peace of mind. Every parent deserves to go to work
                knowing &mdash; not hoping, <em>knowing</em> &mdash; that their child
                is safe, happy, and growing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S — Solution */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              The CCA difference
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              A preschool built on what actually matters.
            </h2>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Crandall Christian Academy was founded on a simple idea: children
              thrive when they&rsquo;re known, loved, and guided with intention.
              Here&rsquo;s what that looks like in practice:
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, text: 'Small ratios. 8:1 in every classroom. Your child is never lost in a crowd.' },
                { icon: Shield, text: 'Trained, certified staff. Every teacher is CPR/First Aid certified, background-checked, and trained in early childhood development.' },
                { icon: Eye, text: "Daily transparency. You'll receive a detailed daily report \u2014 meals, naps, activities, mood, milestones, photos \u2014 pushed to your phone." },
                { icon: Heart, text: 'Faith-integrated curriculum. Bible stories, chapel time, and character lessons woven naturally into every day.' },
                { icon: Lock, text: 'Real security. Controlled access doors. Authorized pickup enforcement. Health screening at every check-in.' },
                { icon: Phone, text: "A director who answers the phone. Not a call center. A real person who knows your family." },
              ].map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-4 rounded-[var(--radius,0.75rem)] border p-5',
                    'bg-[var(--color-card)]',
                  )}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="shrink-0">
                    <item.icon
                      size={20}
                      style={{ color: 'var(--color-primary)' }}
                    />
                  </div>
                  <p
                    className="text-sm leading-relaxed text-pretty"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* T — Testimonials */}
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
              What parents say
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              This is what it feels like.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { quote: 'We looked at five preschools. CCA was the only one where the director knew our daughter\u2019s name by the second visit.', name: 'Parent', loc: 'Crandall' },
              { quote: 'My son asks to go to school on the weekends. That tells me everything I need to know.', name: 'Parent', loc: 'Crandall' },
              { quote: 'The daily reports are incredible. I feel like I\u2019m there with him even when I\u2019m at work.', name: 'Parent', loc: 'Crandall' },
            ].map((t, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col gap-4 rounded-[var(--radius,0.75rem)] border p-6',
                  'bg-[var(--color-card)]',
                )}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex gap-0.5" aria-label="5 stars">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="var(--color-primary)" stroke="var(--color-primary)" />
                  ))}
                </div>
                <blockquote
                  className="flex-1 text-sm leading-relaxed text-pretty"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  &mdash; {t.name}, {t.loc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O — Offer */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              The offer
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Start with a five-minute application. We&rsquo;ll take it from
              there.
            </h2>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Fill out the enrollment form below. We&rsquo;ll review your
              application within two business days, reach out to schedule a tour,
              and walk you through everything &mdash; classroom placement,
              schedules, what to pack, what to expect on day one. No enrollment
              fee until you&rsquo;ve seen the school and confirmed the spot.
            </p>
          </div>
        </div>
      </section>

      {/* R — Risk Reversal */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)' }}
            >
              No pressure
            </span>
            <h2
              className={cn(
                'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                'text-balance',
              )}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              Tour first. Decide after.
            </h2>
            <p
              className="mt-6 text-base leading-relaxed md:text-lg text-pretty mx-auto max-w-2xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              We don&rsquo;t ask for a deposit before you&rsquo;ve walked through
              the building. Come see the classrooms, meet the teachers, watch the
              kids play. If CCA is right for your family, you&rsquo;ll know. If
              it&rsquo;s not, we&rsquo;ll wish you well and mean it.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {[
                'No deposit to apply',
                'Tour before committing',
                'Two-day response time',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  <CheckCircle2
                    size={18}
                    style={{ color: 'var(--color-primary)' }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Wizard */}
      <section id="apply" className="py-16 md:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <span
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--color-primary)' }}
              >
                Apply
              </span>
              <h2
                className={cn(
                  'mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px]',
                  'text-balance',
                )}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-foreground)',
                }}
              >
                Five minutes. Four steps. A great first day is closer than you
                think.
              </h2>
            </div>

            <EnrollmentWizard />
          </div>
        </div>
      </section>
    </>
  )
}
