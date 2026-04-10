// @anchor: marketing.contact
// Contact page with form + info per COPY.md.

import type { Metadata } from 'next'
import { cn } from '@/lib/cn'
import { ContactForm } from '@/components/home/contact-form'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact — Crandall Christian Academy',
  description:
    'Contact Crandall Christian Academy. Schedule a tour, ask questions, or get directions. We\u2019d love to hear from you.',
}

const CONTACT_INFO = [
  {
    icon: Phone,
    label: 'Phone',
    value: '(972) 555-0123',
    href: 'tel:+19725550123',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@crandallchristianacademy.com',
    href: 'mailto:info@crandallchristianacademy.com',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Crandall, TX 75114',
    href: null,
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: 'Monday \u2013 Friday, 6:30 AM \u2013 6:30 PM',
    href: null,
  },
] as const

export default function ContactPage() {
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
              Get in touch
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
              We&rsquo;d love to hear from you.
            </h1>
            <p
              className="mt-6 text-lg leading-relaxed text-pretty mx-auto max-w-xl"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Have questions? Want to schedule a tour? Fill out the form, give us
              a call, or stop by. The door is always open.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24" id="tour">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact info */}
            <div className="lg:col-span-2">
              <h2
                className={cn(
                  'text-xl font-bold leading-tight md:text-2xl',
                  'text-balance',
                )}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-foreground)',
                }}
              >
                Contact information
              </h2>
              <div className="mt-6 space-y-5">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div
                      className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--color-primary) 12%, transparent)`,
                      }}
                    >
                      <item.icon size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.08em]"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-0.5 text-base font-medium transition-colors hover:opacity-80"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p
                          className="mt-0.5 text-base font-medium"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map placeholder */}
              <div
                className={cn(
                  'mt-8 aspect-video rounded-[var(--radius,0.75rem)] overflow-hidden border',
                  'flex items-center justify-center',
                )}
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-muted)',
                }}
              >
                <div className="text-center p-4">
                  <MapPin
                    size={32}
                    className="mx-auto opacity-30"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  />
                  <p
                    className="mt-2 text-sm"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Map coming soon
                  </p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
