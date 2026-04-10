// @anchor: marketing.footer
// Marketing site footer — 4-column layout with tenant branding.
// "Powered by .win" badge at bottom (removable on premium plan).
// All colors via CSS variables for multi-tenant theming.
// See COPY.md "Global elements" for column structure.

import Link from 'next/link'
import Image from 'next/image'
import {
  PLATFORM_SHORT_NAME,
  PLATFORM_LOGO_ICON,
} from '@/lib/constants'

interface SiteFooterProps {
  /** Tenant logo URL. Falls back to text if null. */
  logoUrl?: string | null
  /** School name used as heading and alt text. */
  schoolName?: string
  /** Tagline displayed under the logo. */
  tagline?: string | null
  /** Whether to show the "Powered by .win" badge. Hidden on premium plans. */
  showPoweredBy?: boolean
}

const PROGRAM_LINKS = [
  { href: '/programs#infants', label: 'Infants' },
  { href: '/programs#toddlers', label: 'Toddlers' },
  { href: '/programs#prek', label: 'Pre-K' },
  { href: '/programs#before-after', label: 'Before & After Care' },
  { href: '/programs#summer', label: 'Summer Camp' },
] as const

const FAMILY_LINKS = [
  { href: '/enroll', label: 'Enroll' },
  { href: '/portal', label: 'Parent login' },
  { href: '/contact', label: 'Contact' },
  { href: '/contact#tour', label: 'Schedule a tour' },
] as const

const ABOUT_LINKS = [
  { href: '/about', label: 'Our story' },
  { href: '/faith', label: 'Our faith' },
  { href: '/about#team', label: 'Our team' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const

export function SiteFooter({
  logoUrl,
  schoolName = 'Preschool',
  tagline,
  showPoweredBy = true,
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: 'var(--color-foreground)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={schoolName}
                width={140}
                height={42}
                className="h-10 w-auto object-contain mb-3 brightness-0 invert"
              />
            ) : (
              <p
                className="text-lg font-bold mb-3"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-background)',
                }}
              >
                {schoolName}
              </p>
            )}
            {tagline && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {tagline}
              </p>
            )}
            <p
              className="text-xs mt-4"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              &copy; {currentYear} {schoolName}. All rights reserved.
            </p>
          </div>

          {/* Column 2 — Programs */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-background)' }}
            >
              Programs
            </h3>
            <ul className="space-y-2.5">
              {PROGRAM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Families */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-background)' }}
            >
              Families
            </h3>
            <ul className="space-y-2.5">
              {FAMILY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — About */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-background)' }}
            >
              About
            </h3>
            <ul className="space-y-2.5">
              {ABOUT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Powered-by badge — shown on standard plan, hidden on premium */}
      {showPoweredBy && (
        <div
          className="border-t"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="mx-auto max-w-7xl px-6 md:px-10 py-4 flex items-center justify-center gap-2">
            <Image
              src={PLATFORM_LOGO_ICON}
              alt={PLATFORM_SHORT_NAME}
              width={20}
              height={20}
              className="h-5 w-5 opacity-50"
            />
            <span
              className="text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Powered by {PLATFORM_SHORT_NAME}
            </span>
          </div>
        </div>
      )}
    </footer>
  )
}
