'use client'

// @anchor: marketing.header
// Marketing site header — sticky with glass background on scroll.
// All colors via CSS variables for multi-tenant theming.
// See CCA_MARKETING_BRIEF.md §4 and COPY.md "Global elements" for nav links.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SiteHeaderProps {
  /** Tenant logo URL from branding. Falls back to text if null. */
  logoUrl?: string | null
  /** School name for text fallback and alt text. */
  schoolName?: string
  /** Portal URL for the "Parent login" link. */
  portalUrl?: string
}

const NAV_LINKS = [
  { href: '/programs', label: 'Programs' },
  { href: '/about', label: 'About' },
  { href: '/faith', label: 'Faith' },
  { href: '/contact', label: 'Contact' },
] as const

export function SiteHeader({
  logoUrl,
  schoolName = 'Preschool',
  portalUrl = '/portal',
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[var(--color-background)]/80 backdrop-blur-lg shadow-sm border-b border-[var(--color-border)]'
          : 'bg-transparent'
      )}
    >
      <nav
        className="mx-auto max-w-7xl flex items-center justify-between px-6 md:px-10 h-16 md:h-20"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          aria-label={`${schoolName} — home`}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={schoolName}
              width={160}
              height={48}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          ) : (
            <span
              className="text-lg md:text-xl font-bold"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-foreground)',
              }}
            >
              {schoolName}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-foreground)' }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={portalUrl}
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Parent login
          </Link>
          <Link
            href="/enroll"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            Enroll now
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-foreground)' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t"
          style={{
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-3 text-base font-medium rounded-lg transition-colors"
                style={{ color: 'var(--color-foreground)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={portalUrl}
              className="block px-3 py-3 text-base font-medium rounded-lg transition-colors"
              style={{ color: 'var(--color-muted-foreground)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Parent login
            </Link>
            <div className="pt-2">
              <Link
                href="/enroll"
                className="block w-full text-center px-5 py-3 text-base font-semibold rounded-full transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Enroll now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
