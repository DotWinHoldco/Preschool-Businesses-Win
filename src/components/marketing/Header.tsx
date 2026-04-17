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
      <div className="bg-cca-blue text-white text-xs font-questrial py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>Premier Pre-School in Crandall, Texas</span>
          <a href={PHONE_TEL} className="hover:underline hidden sm:inline">
            Tel. {PHONE}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/marketing/shared/cca-logo-full.png"
            alt="Crandall Christian Academy"
            width={200}
            height={69}
            className="h-12 w-auto"
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
            className="font-kollektif text-sm bg-cca-coral text-white px-4 py-2 rounded-full hover:bg-cca-coral/90 transition-colors"
          >
            NOW HIRING
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="text-cca-ink hover:text-cca-blue transition-colors"
            aria-label="Email us"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
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
            className="block font-kollektif text-center bg-cca-coral text-white px-4 py-3 rounded-full"
          >
            NOW HIRING
          </a>
          <Link
            href={ENROLL_URL}
            className="block font-kollektif text-center bg-cca-green text-white px-4 py-3 rounded-full"
            onClick={() => setMobileOpen(false)}
          >
            APPLY NOW
          </Link>
        </nav>
      )}
    </header>
  );
}
