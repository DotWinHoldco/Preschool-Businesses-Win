'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
];

const ENROLL_URL = '/enroll';
const HIRING_URL = 'https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h';
const EMAIL = 'admin@crandallchristianacademy.com';
const PHONE = '(945) 226-6584';
const PHONE_TEL = 'tel:+19452266584';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Utility bar — CCA BLUE bg */}
      <div className="bg-cca-gold text-white text-xs font-questrial py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={PHONE_TEL} className="hover:underline flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Tel. {PHONE}
            </a>
            <a href={`mailto:${EMAIL}`} className="hover:underline hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
          </div>
          <span className="hidden md:flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Premier Pre-School in Crandall, Texas
          </span>
        </div>
      </div>

      {/* Logo + nav row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/marketing/shared/cca-logo-full.png"
            alt="Crandall Christian Academy"
            width={338}
            height={118}
            className="h-16 md:h-20 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-questrial text-sm text-cca-ink hover:text-cca-blue transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={HIRING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-questrial text-sm text-cca-ink hover:text-cca-blue transition-colors"
          >
            NOW HIRING
          </a>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block font-questrial text-cca-ink py-2"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={HIRING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-questrial text-cca-ink py-2"
          >
            NOW HIRING
          </a>
          <Link
            href={ENROLL_URL}
            className="block font-kollektif text-center bg-cca-blue text-white px-4 py-3 rounded-full"
            onClick={() => setMobileOpen(false)}
          >
            APPLY NOW
          </Link>
        </nav>
      )}
    </header>
  );
}
