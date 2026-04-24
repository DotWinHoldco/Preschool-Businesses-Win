# CCA Marketing Site — Next.js Replica Build Doc

## @anchor cca-marketing-replica-v1

**Purpose:** Self-contained build doc to replicate the Wix-hosted `crandallchristianacademy.com` marketing site as a Next.js application within the existing multi-tenant "Preschool Businesses Win" platform. Execute start-to-finish in a single session. No prior context needed.

**Supabase project:** `oajfxyiqjqymuvevnoui` (Preschool Businesses Win)
**Tenant ID:** `a0a0a0a0-cca0-4000-8000-000000000001` (CCA)
**Tenant slug:** `cca`
**Domains:** `crandallchristianacademy.com` (primary), `cca.preschool.businesses.win` (fallback)
**Portal:** `portal.crandallchristianacademy.com` (SuiteDash — external, read-only, never write)

**What exists already:**
- Supabase project with 147 tables, full multi-tenant schema, RLS everywhere
- `enrollment_leads` table (use for contact form submissions)
- `staff_profiles` table (use for team page)
- `tenant_branding` row for CCA with colors/fonts
- `tenant_domains` with 5 domain entries
- All marketing assets at `public/cca-assets/marketing/` (45 files, organized by page)

**What this doc builds:**
- Next.js 16 marketing site: Home, About, Contact, FAQ, Blog, Our Team
- Two new Supabase tables: `newsletter_subscribers`, `blog_posts`
- Native forms (newsletter + contact) with Supabase + Resend
- Framer Motion scroll animations
- Full SEO (JSON-LD, OG tags, sitemap)
- Blog migration script from Wix

**Operational mandates:**
- Every table has `tenant_id`. Every RLS policy enforces tenant isolation.
- SuiteDash portal links are EXTERNAL only — open in new tab, never iframe (X-Frame-Options blocks it), never write.
- Marketing site fonts are Kollektif Bold (headings) + Questrial (body) + Coming Soon (accent) — NOT the portal defaults (Nunito/Open Sans).
- All images served via Next.js `<Image>` with responsive srcsets.
- Videos are background loops — muted, autoplay, `playsinline`, `prefers-reduced-motion` gate.

---

## @anchor brand-tokens

### Palette

```typescript
// lib/marketing/tokens.ts
export const CCA_COLORS = {
  green:      '#5CB961', // primary — "Shine Bright" accent, pillar card
  blue:       '#3B70B0', // secondary — "More Than a Preschool", primary CTA
  coral:      '#F15A50', // accent — "Play, Explore"
  pink:       '#F878AF', // pillar card accents, icon fills
  yellow:     '#F2B020', // subhead accents, "A Parent's Dream"
  teal:       '#4ABDAC', // secondary accent
  ink:        '#141413', // near-black body text
  cream:      '#FAF9F5', // section wash / alternating bg
  white:      '#FFFFFF', // default background
} as const;

// Pillar-specific accents (improved from live — live used pink for all four)
export const PILLAR_COLORS = {
  'creative-arts':        CCA_COLORS.green,
  'curiosity-discovery':  CCA_COLORS.blue,
  'language-literacy':    CCA_COLORS.coral,
  'physical-development': CCA_COLORS.yellow,
} as const;
```

### Typography

```typescript
// lib/marketing/tokens.ts (continued)
export const CCA_FONTS = {
  heading: 'Kollektif Bold, system-ui, sans-serif',
  headingAlt: 'Kollektif, system-ui, sans-serif',
  body: 'Questrial, system-ui, sans-serif',
  accent: 'Coming Soon, cursive',
} as const;

export const CCA_TYPE_SCALE = {
  h1:   { size: '2.875rem', lineHeight: '1.5',  weight: 700, family: 'heading' },    // 46px
  h2:   { size: '3.544rem', lineHeight: '1.3',  weight: 700, family: 'heading' },    // 56.7px
  h3:   { size: '1.538rem', lineHeight: '1.4',  weight: 700, family: 'heading' },    // 24.6px
  body: { size: '1.125rem', lineHeight: '1.75', weight: 400, family: 'body' },       // 18px (improved from Wix's 21.9px/700)
  eyebrow: { size: '0.875rem', lineHeight: '1.4', weight: 400, family: 'accent' },   // 14px Coming Soon
} as const;
```

### Font loading

```css
/* app/marketing/fonts.css */
@font-face {
  font-family: 'Kollektif Bold';
  src: url('/marketing/shared/fonts/kollektif-bold.woff2') format('woff2'),
       url('/marketing/shared/fonts/kollektif-bold.woff') format('woff');
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: 'Kollektif';
  src: url('/marketing/shared/fonts/kollektif-regular.woff2') format('woff2'),
       url('/marketing/shared/fonts/kollektif-regular.woff') format('woff');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'Coming Soon';
  src: url('/marketing/shared/fonts/coming-soon.woff2') format('woff2'),
       url('/marketing/shared/fonts/coming-soon.woff') format('woff');
  font-weight: 400;
  font-display: swap;
}
```

Google Font import for Questrial (body):
```html
<link href="https://fonts.googleapis.com/css2?family=Questrial&display=swap" rel="stylesheet" />
```

### Logo paths

| Asset | Path |
|---|---|
| Full logo | `/marketing/shared/cca-logo-full.png` |
| Small logo | `/marketing/shared/cca-logo-small.png` |
| Favicon | `/marketing/shared/favicon.png` |

---

## @anchor project-scaffold

### Directory structure

All marketing pages live under `app/(marketing)/` using a route group so they share a marketing-specific layout (header + footer) that is separate from the portal layout.

```
Preschool Businesses Win/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              ← MarketingLayout (header + footer + fonts)
│   │   ├── page.tsx                ← Home page
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── our-team/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx            ← Blog index (paginated)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        ← Blog detail
│   │   └── not-found.tsx
│   ├── api/
│   │   ├── newsletter/
│   │   │   └── route.ts            ← Newsletter subscribe endpoint
│   │   └── contact/
│   │       └── route.ts            ← Contact form endpoint
│   └── marketing/
│       └── fonts.css
├── components/
│   └── marketing/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Hero.tsx
│       ├── SectionHeader.tsx
│       ├── PillarCard.tsx
│       ├── CurriculumCard.tsx
│       ├── ValuePropCard.tsx
│       ├── FeatureRow.tsx
│       ├── CTABlock.tsx
│       ├── NewsletterForm.tsx
│       ├── ContactForm.tsx
│       ├── FAQAccordion.tsx
│       ├── StaffCard.tsx
│       ├── BlogCard.tsx
│       ├── VideoBackground.tsx
│       ├── ScrollReveal.tsx
│       └── ProgramCard.tsx
├── lib/
│   └── marketing/
│       ├── tokens.ts               ← Colors, fonts, type scale
│       ├── copy.ts                 ← All page copy as typed constants
│       ├── actions.ts              ← Server actions for forms
│       └── metadata.ts             ← Per-page SEO metadata factory
├── CCA/
│   └── public/
│       └── marketing/              ← All assets (already downloaded)
└── public/
    └── marketing -> ../public/cca-assets/marketing   ← symlink so Next serves assets
```

### Dependencies to install

```bash
npm install framer-motion @supabase/supabase-js resend
npm install -D @types/node
```

> **Note:** If Next.js 16 and React 19 are already installed in the project, do not reinstall. If the project doesn't exist yet, scaffold with:
> ```bash
> npx create-next-app@latest "Preschool Businesses Win" --typescript --tailwind --eslint --app --src-dir=false
> ```

### Tailwind config additions

Add to `tailwind.config.ts`:

```typescript
// tailwind.config.ts — merge into existing
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cca: {
          green: '#5CB961',
          blue: '#3B70B0',
          coral: '#F15A50',
          pink: '#F878AF',
          yellow: '#F2B020',
          teal: '#4ABDAC',
          ink: '#141413',
          cream: '#FAF9F5',
        },
      },
      fontFamily: {
        'kollektif': ['"Kollektif Bold"', 'system-ui', 'sans-serif'],
        'kollektif-regular': ['Kollektif', 'system-ui', 'sans-serif'],
        'questrial': ['Questrial', 'system-ui', 'sans-serif'],
        'coming-soon': ['"Coming Soon"', 'cursive'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Environment variables required

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://oajfxyiqjqymuvevnoui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard>
RESEND_API_KEY=<get from Resend dashboard>
NEXT_PUBLIC_TENANT_ID=a0a0a0a0-cca0-4000-8000-000000000001
NEXT_PUBLIC_SITE_URL=https://crandallchristianacademy.com
```

---

## @anchor components

### 1. VideoBackground

```tsx
// components/marketing/VideoBackground.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  src1080: string;
  src720: string;
  poster: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: string; // e.g. 'bg-black/40'
}

export function VideoBackground({
  src1080,
  src720,
  poster,
  className = '',
  children,
  overlay = 'bg-black/30',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!prefersReducedMotion ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={src1080} type="video/mp4" media="(min-width: 768px)" />
          <source src={src720} type="video/mp4" />
        </video>
      ) : (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

### 2. ScrollReveal

```tsx
// components/marketing/ScrollReveal.tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const directionMap = {
  up:    { y: 32, x: 0 },
  down:  { y: -32, x: 0 },
  left:  { y: 0, x: 32 },
  right: { y: 0, x: -32 },
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = directionMap[direction];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. SectionHeader

```tsx
// components/marketing/SectionHeader.tsx
interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowColor?: string;
  heading: string;
  headingColor?: string;
  subheading?: string;
  centered?: boolean;
}

export function SectionHeader({
  eyebrow,
  eyebrowColor = 'text-cca-pink',
  heading,
  headingColor = 'text-cca-ink',
  subheading,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow && (
        <p className={`font-coming-soon text-sm uppercase tracking-wider mb-2 ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-kollektif text-3xl md:text-[3.544rem] md:leading-[1.3] ${headingColor}`}>
        {heading}
      </h2>
      {subheading && (
        <p className="font-questrial text-lg text-cca-ink/70 mt-4 max-w-2xl mx-auto">
          {subheading}
        </p>
      )}
    </div>
  );
}
```

### 4. PillarCard

```tsx
// components/marketing/PillarCard.tsx
import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface PillarCardProps {
  title: string;
  body: string;
  imageSrc: string;
  accentColor: string; // Tailwind bg class e.g. 'bg-cca-green'
  index: number;
}

export function PillarCard({ title, body, imageSrc, accentColor, index }: PillarCardProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor}`} />
        </div>
        <div className="p-6">
          <h3 className="font-kollektif text-xl mb-3">{title}</h3>
          <p className="font-questrial text-cca-ink/80 text-base leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

### 5. CurriculumCard

```tsx
// components/marketing/CurriculumCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface CurriculumCardProps {
  age: string;
  body: string;
  imageSrc?: string;
  slug: string;
  applyUrl: string;
  index: number;
}

export function CurriculumCard({ age, body, imageSrc, slug, applyUrl, index }: CurriculumCardProps) {
  return (
    <ScrollReveal delay={index * 0.08}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {imageSrc && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={imageSrc}
              alt={`${age} program`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-kollektif text-xl mb-3 text-cca-blue">{age}</h3>
          <p className="font-questrial text-cca-ink/80 text-base leading-relaxed flex-1">{body}</p>
          <div className="flex gap-3 mt-4">
            <Link
              href={`/about#${slug}`}
              className="text-sm font-medium text-cca-blue hover:underline"
            >
              Learn More
            </Link>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white bg-cca-green px-4 py-2 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </a>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

### 6. ValuePropCard

```tsx
// components/marketing/ValuePropCard.tsx
import { ScrollReveal } from './ScrollReveal';

interface ValuePropCardProps {
  title: string;
  body: string;
  iconColor?: string;
  index: number;
}

export function ValuePropCard({ title, body, iconColor = 'text-cca-pink', index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="text-center p-6">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${iconColor} bg-current/10`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <h3 className="font-kollektif text-lg mb-2">{title}</h3>
        <p className="font-questrial text-cca-ink/80 text-base leading-relaxed">{body}</p>
      </div>
    </ScrollReveal>
  );
}
```

### 7. FeatureRow

```tsx
// components/marketing/FeatureRow.tsx
import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface FeatureRowProps {
  title: string;
  body: string;
  imageSrc?: string;
  reversed?: boolean;
  index: number;
}

export function FeatureRow({ title, body, imageSrc, reversed = false, index }: FeatureRowProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 ${reversed ? 'md:flex-row-reverse' : ''}`}>
        {imageSrc && (
          <div className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        )}
        <div className={`w-full ${imageSrc ? 'md:w-1/2' : ''}`}>
          <h3 className="font-kollektif text-2xl mb-4 text-cca-blue">{title}</h3>
          <p className="font-questrial text-cca-ink/80 text-lg leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

### 8. CTABlock

```tsx
// components/marketing/CTABlock.tsx
interface CTABlockProps {
  heading: string;
  subheading?: string;
  buttonText: string;
  buttonHref: string;
  external?: boolean;
  bgClass?: string;
}

export function CTABlock({
  heading,
  subheading,
  buttonText,
  buttonHref,
  external = true,
  bgClass = 'bg-cca-blue',
}: CTABlockProps) {
  const Tag = external ? 'a' : 'a'; // Next Link for internal, <a> for external
  const linkProps = external
    ? { href: buttonHref, target: '_blank', rel: 'noopener noreferrer' }
    : { href: buttonHref };

  return (
    <div className={`${bgClass} text-white text-center py-20 px-6 rounded-2xl`}>
      <h2 className="font-kollektif text-3xl md:text-5xl mb-4">{heading}</h2>
      {subheading && (
        <p className="font-questrial text-lg text-white/80 mb-8 max-w-xl mx-auto">{subheading}</p>
      )}
      <a
        {...linkProps}
        className="inline-block bg-white text-cca-blue font-kollektif text-lg px-8 py-4 rounded-full hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
      >
        {buttonText}
      </a>
    </div>
  );
}
```

### 9. FAQAccordion

```tsx
// components/marketing/FAQAccordion.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="max-w-3xl mx-auto divide-y divide-gray-200">
      {items.map((item, i) => (
        <ScrollReveal key={i} delay={i * 0.05}>
          <div className="py-4">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between text-left py-2 group"
              aria-expanded={openIndex === i}
            >
              <h3 className="font-kollektif text-lg pr-8 group-hover:text-cca-blue transition-colors">
                {item.question}
              </h3>
              <span
                className={`text-2xl text-cca-blue transition-transform duration-200 ${
                  openIndex === i ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="font-questrial text-cca-ink/80 text-base leading-relaxed pb-2 pt-1">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
```

### 10. StaffCard

```tsx
// components/marketing/StaffCard.tsx
import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface StaffCardProps {
  name: string;
  title: string;
  bio?: string;
  headshotPath: string;
  index: number;
}

export function StaffCard({ name, title, bio, headshotPath, index }: StaffCardProps) {
  return (
    <ScrollReveal delay={index * 0.08}>
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={headshotPath}
            alt={`${name} — ${title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4 text-center">
          <h3 className="font-kollektif text-lg">{name}</h3>
          <p className="font-questrial text-sm text-cca-ink/60">{title}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

### 11. BlogCard

```tsx
// components/marketing/BlogCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverPath: string;
  publishedAt: string;
  readTimeMinutes: number;
  index: number;
}

export function BlogCard({ slug, title, excerpt, coverPath, publishedAt, readTimeMinutes, index }: BlogCardProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScrollReveal delay={index * 0.06}>
      <Link href={`/blog/${slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={coverPath}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-kollektif text-lg mb-2 group-hover:text-cca-blue transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="font-questrial text-sm text-cca-ink/70 line-clamp-2 flex-1">{excerpt}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-cca-ink/50 font-questrial">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
```

### 12. ProgramCard (About page)

```tsx
// components/marketing/ProgramCard.tsx
import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface ProgramCardProps {
  slug: string;
  title: string;
  body: string;
  imageSrc: string;
  applyUrl: string;
  index: number;
}

export function ProgramCard({ slug, title, body, imageSrc, applyUrl, index }: ProgramCardProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div id={slug} className="scroll-mt-24">
        <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 py-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
          <div className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="font-kollektif text-2xl md:text-3xl mb-4 text-cca-blue">{title}</h3>
            <p className="font-questrial text-cca-ink/80 text-lg leading-relaxed mb-6">{body}</p>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-green text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </a>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

### 13. NewsletterForm

```tsx
// components/marketing/NewsletterForm.tsx
'use client';

import { useState, type FormEvent } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      setErrorMsg('Please check the newsletter consent box.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setStatus('success');
      setEmail('');
      setConsent(false);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center text-white">
        <p className="font-kollektif text-2xl mb-2">Thank you!</p>
        <p className="font-questrial text-white/80">You&apos;re subscribed to our newsletter.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <h3 className="font-kollektif text-xl text-white text-center mb-4">
        Subscribe To Our Newsletter
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Email*"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-full text-cca-ink font-questrial focus:outline-none focus:ring-2 focus:ring-cca-green"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-cca-green text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-green/90 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending...' : 'Submit'}
        </button>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-white/80 font-questrial cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="rounded border-white/40"
        />
        Yes, subscribe me to your newsletter.
      </label>
      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {status === 'error' && (
        <p className="text-red-300 text-sm mt-2 text-center font-questrial">{errorMsg}</p>
      )}
    </form>
  );
}
```

### 14. ContactForm

```tsx
// components/marketing/ContactForm.tsx
'use client';

import { useState, type FormEvent } from 'react';

export function ContactForm() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center p-8 bg-cca-cream rounded-2xl">
        <p className="font-kollektif text-2xl text-cca-green mb-2">Message Sent!</p>
        <p className="font-questrial text-cca-ink/70">
          Thanks for reaching out — we&apos;ll be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-questrial text-sm text-cca-ink/70 mb-1">First Name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Last Name</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Email*</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
        />
      </div>
      <div>
        <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Message*</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent resize-none"
        />
      </div>
      {/* Honeypot */}
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-cca-blue text-white font-kollektif text-lg py-4 rounded-full hover:bg-cca-blue/90 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Submit'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm text-center font-questrial">{errorMsg}</p>
      )}
    </form>
  );
}
```

### 15. Header

```tsx
// components/marketing/Header.tsx
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

const APPLY_URL = 'https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt';
const HIRING_URL = 'https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h';
const EMAIL = 'admin@crandallchristianacademy.com';
const PHONE = '(945) 226-6584';
const PHONE_TEL = 'tel:+19452266584';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Top strip */}
      <div className="bg-cca-blue text-white text-xs font-questrial py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>Premier Pre-School in Crandall, Texas</span>
          <a href={PHONE_TEL} className="hover:underline hidden sm:inline">
            Tel. {PHONE}
          </a>
        </div>
      </div>

      {/* Main nav */}
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

        {/* Desktop nav */}
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

        {/* Mobile hamburger */}
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

      {/* Mobile menu */}
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
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-kollektif text-center bg-cca-green text-white px-4 py-3 rounded-full"
          >
            APPLY NOW
          </a>
        </nav>
      )}
    </header>
  );
}
```

### 16. Footer

```tsx
// components/marketing/Footer.tsx
import Image from 'next/image';
import Link from 'next/link';

const PHONE = '(945) 226-6584';
const PHONE_TEL = 'tel:+19452266584';
const EMAIL = 'admin@crandallchristianacademy.com';
const APPLY_URL = 'https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt';
const HIRING_URL = 'https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cca-ink text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & description */}
          <div className="md:col-span-2">
            <Image
              src="/marketing/shared/cca-logo-full.png"
              alt="Crandall Christian Academy"
              width={220}
              height={76}
              className="h-14 w-auto mb-4 brightness-0 invert"
            />
            <p className="font-questrial text-white/70 text-sm leading-relaxed max-w-sm">
              A premier, faith-based preschool in Crandall, Texas. Nurturing young minds
              through hands-on learning and character-building activities.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-kollektif text-sm uppercase tracking-wider mb-4 text-cca-green">
              Quick Links
            </h4>
            <ul className="space-y-2 font-questrial text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Apply Now
                </a>
              </li>
              <li>
                <a href={HIRING_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Now Hiring
                </a>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-kollektif text-sm uppercase tracking-wider mb-4 text-cca-green">
              Contact
            </h4>
            <ul className="space-y-2 font-questrial text-sm text-white/70">
              <li>Crandall, Texas</li>
              <li>
                <a href={PHONE_TEL} className="hover:text-white transition-colors">{PHONE}</a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
              </li>
              <li className="pt-2 text-white/50">
                Mon – Fri: 7:00 AM – 6:00 PM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-questrial text-xs text-white/40">
            © {year} Crandall Christian Academy. All rights reserved.
          </p>
          <p className="font-questrial text-xs text-white/40">
            Powered by{' '}
            <a href="https://preschool.businesses.win" className="hover:text-white/60 transition-colors">
              Preschool Businesses Win
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## @anchor marketing-layout

```tsx
// app/(marketing)/layout.tsx
import type { Metadata } from 'next';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import '@/app/marketing/fonts.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Crandall Christian Academy',
    default: 'Crandall Christian Academy — Premier Pre-School in Crandall, Texas',
  },
  description: 'A premier, faith-based preschool in Crandall, Texas offering programs for infants through private kindergarten. Nurturing young minds through hands-on learning and character-building activities.',
  metadataBase: new URL('https://crandallchristianacademy.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Crandall Christian Academy',
    images: [{ url: '/marketing/home/facility-hero-poster.jpg', width: 1920, height: 1080 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/marketing/shared/favicon.png',
    apple: '/marketing/shared/favicon.png',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 font-questrial">
        Skip to main content
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
```

---

## @anchor page-home

### Home page — `app/(marketing)/page.tsx`

```tsx
// app/(marketing)/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { VideoBackground } from '@/components/marketing/VideoBackground';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { PillarCard } from '@/components/marketing/PillarCard';
import { CurriculumCard } from '@/components/marketing/CurriculumCard';
import { ValuePropCard } from '@/components/marketing/ValuePropCard';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { CTABlock } from '@/components/marketing/CTABlock';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';

export const metadata: Metadata = {
  title: 'Home | Crandall Christian Academy',
  description: "Crandall Christian Academy's preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities.",
};

const APPLY_URL = 'https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt';

const PILLARS = [
  {
    title: 'Creative Arts',
    body: 'From painting and crafting to music and imaginative play, our creative arts program inspires self-expression, builds confidence, and nurtures a love for the arts. By engaging their imaginations and developing fine motor skills, children discover the joy of creating while growing in their ability to think critically and solve problems.',
    imageSrc: '/marketing/home/pillar-creative-arts.jpg',
    accentColor: 'bg-cca-green',
  },
  {
    title: 'Curiosity and Discovery',
    body: 'At Crandall Christian Academy, we nurture a sense of wonder by encouraging children to explore, question, and discover the world around them. Through hands-on activities and interactive learning experiences, young minds develop problem-solving skills, creativity, and a lifelong love for discovery. Our program inspires curiosity and equips children with the tools to think critically and innovate with confidence.',
    imageSrc: '/marketing/home/pillar-curiosity-discovery.jpg',
    accentColor: 'bg-cca-blue',
  },
  {
    title: 'Language and Literacy',
    body: 'Students develop the foundation for strong communication skills through engaging language and literacy activities. From storytime and early writing exercises to phonics and vocabulary building, children develop the tools they need to express themselves and connect with the world. Our program fosters a love for reading, enhances comprehension, and builds confidence in young learners as they discover the power of words and storytelling.',
    imageSrc: '/marketing/home/pillar-language-literacy.jpg',
    accentColor: 'bg-cca-coral',
  },
  {
    title: 'Physical Development',
    body: 'Together, we support your child\'s growth through activities that promote strength, coordination, and overall wellness. From active play and movement exercises to fine and gross motor skill development, our program helps our students build healthy habits and confidence in their abilities. By staying active and engaged, children develop the physical foundation they need to thrive in learning and in life!',
    imageSrc: '/marketing/home/pillar-physical-development.jpg',
    accentColor: 'bg-cca-yellow',
  },
];

const CURRICULUM = [
  {
    age: 'Infants',
    slug: 'infants',
    body: 'Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning. With attentive caregivers, low ratios, and individualized care, we focus on building trust, comfort, and early developmental milestones while partnering closely with parents every step of the way.',
    imageSrc: '/marketing/home/curriculum-infants.jpg',
  },
  {
    age: 'Toddlers',
    slug: 'toddlers',
    body: 'Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities and play.',
    imageSrc: '/marketing/home/curriculum-toddlers.jpg',
  },
  {
    age: 'Twos',
    slug: 'twos',
    body: 'The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence, independence, and foundational skills.',
    imageSrc: '/marketing/home/curriculum-twos.jpg',
  },
  {
    age: 'Threes',
    slug: 'threes',
    body: 'In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity and a love for discovery.',
  },
  {
    age: 'Pre-K',
    slug: 'preschool-kinder',
    body: 'The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning in a supportive and engaging environment.',
  },
  {
    age: 'Private Kindergarten',
    slug: 'preschool-kinder',
    body: 'Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention to ensure children thrive in their first formal year of school.',
  },
];

const VALUE_PROPS = [
  {
    title: 'Faith-Centered Education',
    body: 'We integrate Christian values into every aspect of learning, fostering spiritual growth alongside academic success for a well-rounded foundation.',
  },
  {
    title: 'Exceptional Teachers & Curriculum',
    body: 'Our experienced educators and age-appropriate curriculum ensure your child receives personalized attention and the tools they need to thrive.',
  },
  {
    title: 'Safe & Nurturing Environment',
    body: 'CCA provides a loving, secure space where children feel supported as they explore, grow, and develop their God-given potential.',
  },
];

const CCA_DIFFERENCE = [
  {
    title: 'Highly Experienced Leadership & Highly Trained Staff',
    body: 'Our leadership team brings years of early childhood and Christian education experience, and our teachers are highly trained, caring, and consistent, creating a safe, structured, and loving environment for every child.',
  },
  {
    title: 'A Premier Preschool, Right Here in Crandall',
    body: "Crandall finally has a premier local preschool families can be proud of. Our brand new, state-of-the-art 8,000 SF facility gives your child a beautiful place to learn and grow, right here in the community.",
  },
  {
    title: 'A Curriculum That Prepares Your Child',
    body: 'Our preschool curriculum blends joyful, play-based learning with the structure kids thrive on, building early literacy, math readiness, and social-emotional skills through hands-on activities, guided discovery, and purposeful daily routines.',
  },
  {
    title: 'Safety You Can Feel',
    body: "Your child's safety is our highest priority, and it's built into everything we do. Our state-of-the-art campus features 24/7 gated and controlled access, advanced facial recognition, and layered security measures, all working quietly in the background so kids can focus on what they do best: learning, playing, and being cared for. From drop-off to pick-up, families get real peace of mind in a warm, joyful environment.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* === SECTION 1: Hero === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="min-h-[80vh] flex items-center"
        overlay="bg-black/40"
      >
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <ScrollReveal>
            <div className="w-10 h-10 mx-auto mb-4">
              <Image
                src="/marketing/home/mascot-sunshine-face.png"
                alt=""
                width={40}
                height={40}
                aria-hidden="true"
              />
            </div>
            <h1 className="font-kollektif text-4xl md:text-6xl text-white mb-6">
              A Place To Shine Bright
            </h1>
            <p className="font-questrial text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              Crandall Christian Academy&apos;s preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities. Our curriculum fosters creativity, social development, and foundational academic skills, preparing children for a bright future.
            </p>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Apply Now!
            </a>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 2: More Than A Preschool === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <div className="relative aspect-[756/700] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/home/more-than-a-preschool.jpg"
                alt="Children learning together at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-blue mb-6">
              More Than A Preschool
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed">
              At Crandall Christian Academy, we&apos;re more than a place for learning—we&apos;re a loving, close-knit community where children, teachers, and families build meaningful relationships. We celebrate each child&apos;s unique gifts, encourage their growth, and surround them with warmth, care, and connection. Together, we create a joyful environment where every child feels valued, supported, and inspired to thrive in every way.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 3: Play, Explore, Discover, Grow === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-coral mb-6">
              Play, Explore, Discover, Grow.
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed">
              At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique potential. Every day offers opportunities for active learning, fostering growth in mind, body and spirit. We nurture curiosity, creativity, and a sense of wonder as little ones thrive.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 4: A Parent's Dream Come True / Apply CTA === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-24"
        overlay="bg-black/50"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-yellow mb-3">
              A Parent&apos;s Dream Come True
            </p>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg"
            >
              Apply Now!
            </a>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 5: Peace of Mind for Parents === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">
              Peace of Mind for Parents
            </p>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-6">
              Today&apos;s Learners. Tomorrow&apos;s Leaders. Together!
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mb-8">
              At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child&apos;s growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn. Together, we build a foundation of trust and shared goals, giving parents peace of mind and children the tools they need to thrive. By working hand-in-hand, we help today&apos;s little learners grow into tomorrow&apos;s confident leaders.
            </p>
            <a href="/about" className="inline-block bg-cca-blue text-white font-kollektif px-8 py-4 rounded-full hover:bg-cca-blue/90 transition-colors">
              Learn More
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 6: Learning Adventures (Four Pillars) === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Learning Adventures"
              heading="Our Curriculum"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.title} {...pillar} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === SECTION 7: Our Curriculum — Age Programs === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Our Programs"
              heading="Programs by Age"
              eyebrowColor="text-cca-green"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {CURRICULUM.map((prog, i) => (
              <CurriculumCard
                key={prog.age}
                age={prog.age}
                body={prog.body}
                imageSrc={prog.imageSrc}
                slug={prog.slug}
                applyUrl={APPLY_URL}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* === SECTION 8: Why Choose Us === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Why Choose Us"
              heading="Every Child with Love & Safety"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-ink"
              subheading="Crandall Christian Academy is dedicated to fostering academic excellence and Christian values in a nurturing environment. We strive to develop respectful, compassionate leaders who positively impact the world."
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {VALUE_PROPS.map((vp, i) => (
              <ValuePropCard key={vp.title} {...vp} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-blue text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-blue/90 transition-colors"
            >
              Apply Now!
            </a>
          </div>
        </div>
      </section>

      {/* === SECTION 9: Newsletter === */}
      <VideoBackground
        src1080="/marketing/home/videos/newsletter-bg-1080p.mp4"
        src720="/marketing/home/videos/newsletter-bg-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-20"
        overlay="bg-cca-blue/80"
      >
        <div className="max-w-xl mx-auto px-6">
          <NewsletterForm />
        </div>
      </VideoBackground>

      {/* === SECTION 10: The CCA Difference === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="The CCA Difference"
              heading="The Ingredients Of A Perfect Pre-School For Your Child"
              eyebrowColor="text-cca-green"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="mt-12 divide-y divide-gray-100">
            {CCA_DIFFERENCE.map((feature, i) => (
              <FeatureRow key={feature.title} {...feature} reversed={i % 2 !== 0} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === SECTION 11: Where Little Minds Shine — Closing CTA === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-28"
        overlay="bg-black/50"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-5xl text-white mb-4">
              Where Little Minds Shine
            </h2>
            <p className="font-questrial text-lg text-white/80 mb-8">
              Lighting the Way for Lifelong Learning.
            </p>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg"
            >
              APPLY NOW
            </a>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 12: (Duplicate Christ-centered block from Wix — REMOVED per extraction notes) === */}

      {/* === SECTION 13: Now Enrolling — Final CTA === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-coral mb-3">
              Now Enrolling
            </p>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-6">
              Crandall&apos;s New Pre-School Gem
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mb-8">
              Located in the heart of Crandall, Texas, our facility is designed to provide a warm and welcoming environment where children can learn, grow, and thrive. With state-of-the-art classrooms, engaging activity spaces, and a nurturing atmosphere, we focus on creating a home away from home for our students. Every detail of our facility reflects our commitment to fostering curiosity, creativity, and a sense of community, ensuring every child feels safe, supported, and inspired each day.
            </p>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </a>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
```

---

## @anchor page-about

### About page — `app/(marketing)/about/page.tsx`

```tsx
// app/(marketing)/about/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { ProgramCard } from '@/components/marketing/ProgramCard';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Crandall Christian Academy — our mission, our programs, and what makes us the premier preschool in Crandall, Texas.',
};

const APPLY_URL = 'https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt';

const PROGRAMS = [
  {
    slug: 'infants',
    title: 'Our Infant Classes',
    body: "From their very first days, your child is lovingly cared for in a Christ-centered environment designed for comfort, safety, and growth. Our infant program focuses on nurturing each baby with patience, prayer, and individualized care, creating a strong foundation for lifelong learning.",
    imageSrc: '/marketing/about/program-infants.jpg',
  },
  {
    slug: 'toddlers',
    title: 'Our Toddlers Classes',
    body: "Our toddler program provides a nurturing and stimulating environment designed to support your child's early developmental milestones. Through age-appropriate activities, sensory play, and loving care, toddlers explore the world around them while building a foundation for lifelong learning.",
    imageSrc: '/marketing/about/program-toddlers.jpg',
  },
  {
    slug: 'twos',
    title: 'Our 2s Classes',
    body: "In our 2s program, children take their first steps into a structured learning environment, separate from the toddler space. With a focus on fostering independence, socialization, and early academic skills, our 2s classroom encourages curiosity and confidence through guided play and hands-on exploration.",
    imageSrc: '/marketing/about/program-twos.jpg',
  },
  {
    slug: 'threes',
    title: 'Our 3s Class',
    body: "Our 3s program is designed to ignite curiosity and foster a love for learning in a warm, supportive environment. Through engaging activities, creative play, and age-appropriate lessons, children develop essential skills in literacy, math, and problem-solving while building social connections and confidence. This class provides the perfect balance of structure and exploration to help your child thrive.",
    imageSrc: '/marketing/about/program-threes.jpg',
  },
  {
    slug: 'preschool-kinder',
    title: 'Preschool & Private Kindergarten',
    body: "Our Preschool and Private Kindergarten programs provide a strong foundation for lifelong learning in a nurturing, faith-based environment. Preschool focuses on building essential skills in literacy, math, and social-emotional development through engaging, hands-on activities that foster curiosity and independence. Private Kindergarten offers a comprehensive, well-rounded curriculum with personalized attention to ensure your child is prepared for future academic success while growing in confidence and character.",
    imageSrc: '/marketing/about/program-preschool-kinder.jpg',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">About</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-6">
              Where Learning and Fun Come Together
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/about/hero-playing-toddlers.jpg"
                alt="Children playing and learning at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <SectionHeader
              heading="Our Mission"
              subheading="We support the growth and development of every child through personalized care."
              headingColor="text-cca-blue"
            />
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mt-6">
              At Crandall Christian Academy, our mission is to provide a safe, loving, and educational environment where children can thrive. We believe in nurturing each child&apos;s unique abilities and fostering a lifelong love of learning.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8 text-left max-w-lg mx-auto">
              {[
                'Encouraging curiosity and creativity.',
                'Supporting emotional, social, and spiritual development.',
                'Building strong partnerships with families.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-cca-blue flex-shrink-0" />
                  <p className="font-questrial text-cca-ink/80">{item}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.25}>
            <Link
              href="/our-team"
              className="inline-block mt-8 bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors"
            >
              Meet Our Educators
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Programs */}
      <section id="programs" className="py-20 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              heading="Our Programs"
              subheading="At Crandall Christian Academy, our programs are thoughtfully designed to nurture children's growth from toddlers to private kindergarten. Each program focuses on age-appropriate learning, fostering curiosity, independence, and a love for God in a safe and supportive environment."
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          {PROGRAMS.map((prog, i) => (
            <ProgramCard key={prog.slug} {...prog} applyUrl={APPLY_URL} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
```

---

## @anchor page-contact

### Contact page — `app/(marketing)/contact/page.tsx`

```tsx
// app/(marketing)/contact/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Crandall Christian Academy. Connect with us for more information about enrollment, programs, and employment opportunities.',
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">Get In Touch</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink">
              Connect with Us for More Information and Enrollment
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/contact/hero-painting-class.jpg"
                alt="Painting class at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Body + Form */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-4xl text-cca-blue text-center mb-6">
              We&apos;re Here to Answer Your Questions and Help Your Child Thrive
            </h2>
            <div className="font-questrial text-lg text-cca-ink/80 leading-relaxed text-center space-y-4 mb-12">
              <p>
                Thank you for your interest in Crandall Christian Academy. We are excited to connect with families who are seeking a nurturing, faith-based learning environment for their children.
              </p>
              <p>
                Whether you have questions about enrollment, programs, or employment opportunities, our team is here to help.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
```

---

## @anchor page-faq

### FAQ page — `app/(marketing)/faq/page.tsx`

```tsx
// app/(marketing)/faq/page.tsx
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Crandall Christian Academy — ages served, hours, enrollment, meals, sibling discounts, and more.',
};

const FAQ_ITEMS = [
  {
    question: 'What ages does Crandall Christian Academy serve?',
    answer: 'Crandall Christian Academy serves children from 3 months through Kindergarten, providing nurturing care and Christ-centered education at every developmental stage.',
  },
  {
    question: 'What are your hours of operation?',
    answer: 'CCA is open Monday through Friday from 7:00 AM – 6:00 PM. Children must be picked up promptly by closing time.',
  },
  {
    question: 'Do you offer sibling discounts?',
    answer: 'Yes! The youngest sibling pays full tuition, and each additional sibling receives a $50 monthly discount.',
  },
  {
    question: 'What should my child bring each day?',
    answer: 'Families should provide a labeled change of clothes, diapers/wipes (if applicable), a water bottle, any required comfort items for rest time, and rain boots for outdoor play. Children should bring a labeled lunch and snack each day. Specific supply lists are provided by classroom.',
  },
  {
    question: 'Are meals or snacks provided?',
    answer: 'At this time, Crandall Christian Academy does not provide lunches or snacks. Families are responsible for sending a labeled lunch and snack each day for their child.',
  },
  {
    question: 'How do you communicate with parents?',
    answer: 'We believe in strong family partnerships and open communication. Crandall Christian Academy uses a secure communication software system to provide updates throughout the day, including daily reports and photos, activity and learning updates, messages from teachers and staff, and important announcements and reminders.',
  },
  {
    question: 'How do I schedule a tour or enroll?',
    answer: 'To begin the enrollment process, please complete the online application form. Our team will follow up with you regarding next steps and availability.',
  },
  {
    question: 'What makes CCA different?',
    answer: 'Crandall Christian Academy offers a warm, faith-filled environment where children grow academically, socially, and spiritually. We are committed to providing loving, experienced teachers, strong Christian values, developmentally appropriate learning, a supportive community atmosphere, and state-of-the-art security measures, including controlled building access and monitored systems, to ensure the safety and well-being of every child and staff member.',
  },
];

export default function FAQPage() {
  return (
    <>
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-4">
              Frequently Asked Questions
            </h1>
            <p className="font-questrial text-lg text-cca-ink/70">
              Everything you need to know about Crandall Christian Academy.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-20 px-6 bg-white">
        <FAQAccordion items={FAQ_ITEMS} />
      </section>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </>
  );
}
```

---

## @anchor page-team

### Our Team page — `app/(marketing)/our-team/page.tsx`

```tsx
// app/(marketing)/our-team/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { StaffCard } from '@/components/marketing/StaffCard';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Our Team',
  description: 'Meet the dedicated educators and staff at Crandall Christian Academy committed to your child\'s growth.',
};

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

async function getStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, first_name, last_name, title, bio, avatar_url')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch staff:', error);
    return [];
  }
  return data ?? [];
}

export default async function TeamPage() {
  const staff = await getStaff();

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">Our Team</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink">
              Dedicated Educators Committed to Your Child&apos;s Growth
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/team/hero-art-class.jpg"
                alt="Art class at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Staff grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {staff.map((member, i) => (
                <StaffCard
                  key={member.id}
                  name={`${member.first_name} ${member.last_name}`}
                  title={member.title ?? ''}
                  bio={member.bio ?? undefined}
                  headshotPath={member.avatar_url ?? '/marketing/shared/cca-logo-small.png'}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="text-center py-12">
                <p className="font-questrial text-lg text-cca-ink/60">
                  Our team information is coming soon. Check back for updates!
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  );
}
```

> **Note for CC:** The `staff_profiles` table already exists. If columns `is_active` or `sort_order` don't exist, add them:
> ```sql
> ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
> ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
> ```

---

## @anchor page-blog

### Blog index — `app/(marketing)/blog/page.tsx`

```tsx
// app/(marketing)/blog/page.tsx
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { BlogCard } from '@/components/marketing/BlogCard';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest articles from Crandall Christian Academy about early childhood education, parenting tips, and faith-based learning.',
};

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const POSTS_PER_PAGE = 12;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset = (page - 1) * POSTS_PER_PAGE;

  const supabase = await createClient();
  const { data: posts, count } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_path, published_at, read_time_minutes', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE);

  return (
    <>
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-4">Blog</h1>
            <p className="font-questrial text-lg text-cca-ink/70">
              Insights on early childhood education, parenting, and faith-based learning.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {posts && posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, i) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt ?? ''}
                    coverPath={post.cover_path ?? '/marketing/shared/cca-logo-full.png'}
                    publishedAt={post.published_at}
                    readTimeMinutes={post.read_time_minutes ?? 3}
                    index={i}
                  />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/blog?page=${p}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-full font-questrial text-sm transition-colors ${
                        p === page
                          ? 'bg-cca-blue text-white'
                          : 'bg-gray-100 text-cca-ink hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <ScrollReveal>
              <div className="text-center py-12">
                <p className="font-questrial text-lg text-cca-ink/60">
                  Blog posts are coming soon. Check back for updates!
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  );
}
```

### Blog detail — `app/(marketing)/blog/[slug]/page.tsx`

```tsx
// app/(marketing)/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { createClient } from '@/lib/supabase/server';

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_path, meta_title, meta_description')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt,
    openGraph: {
      title: post.meta_title ?? post.title,
      description: post.meta_description ?? post.excerpt,
      images: post.cover_path ? [{ url: post.cover_path }] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) notFound();

  const formattedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* Hero */}
      <section className="py-16 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <Link href="/blog" className="font-questrial text-sm text-cca-blue hover:underline mb-4 inline-block">
              ← Back to Blog
            </Link>
            <h1 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-cca-ink/50 font-questrial">
              <span>{post.author ?? 'Crandall Christian Academy'}</span>
              <span>·</span>
              <span>{formattedDate}</span>
              {post.read_time_minutes && (
                <>
                  <span>·</span>
                  <span>{post.read_time_minutes} min read</span>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Cover */}
      {post.cover_path && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 mb-8">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={post.cover_path}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      )}

      {/* Body */}
      <article className="py-12 px-6">
        <div
          className="max-w-3xl mx-auto prose prose-lg prose-gray font-questrial prose-headings:font-kollektif prose-a:text-cca-blue"
          dangerouslySetInnerHTML={{ __html: post.body_html ?? '' }}
        />
      </article>

      {/* BlogPosting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: {
              '@type': 'Organization',
              name: post.author ?? 'Crandall Christian Academy',
            },
            datePublished: post.published_at,
            image: post.cover_path,
            publisher: {
              '@type': 'Organization',
              name: 'Crandall Christian Academy',
              logo: { '@type': 'ImageObject', url: 'https://crandallchristianacademy.com/marketing/shared/cca-logo-full.png' },
            },
          }),
        }}
      />
    </>
  );
}
```

---

## @anchor ddl

### New tables — DDL

Run these as Supabase migrations.

#### 1. `newsletter_subscribers`

```sql
-- migration: create_newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  source_page text DEFAULT 'home',
  ip_address inet,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS: service role can insert (server action); authenticated tenant members can read
CREATE POLICY "service_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "tenant_read_newsletter"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT utm.tenant_id FROM public.user_tenant_memberships utm
      WHERE utm.user_id = auth.uid() AND utm.status = 'active'
    )
  );

-- Allow anon inserts via API route (the route validates + uses service role)
CREATE POLICY "anon_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_newsletter_tenant ON public.newsletter_subscribers(tenant_id);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(tenant_id, email);
```

#### 2. `blog_posts`

```sql
-- migration: create_blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  body_html text,
  cover_path text,
  author text DEFAULT 'Crandall Christian Academy',
  published_at timestamptz NOT NULL DEFAULT now(),
  read_time_minutes integer DEFAULT 3,
  is_published boolean NOT NULL DEFAULT false,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts (marketing site is public)
CREATE POLICY "public_read_published_posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

-- Tenant members can manage posts
CREATE POLICY "tenant_manage_posts"
  ON public.blog_posts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT utm.tenant_id FROM public.user_tenant_memberships utm
      WHERE utm.user_id = auth.uid() AND utm.status = 'active'
    )
  );

-- Service role full access (for migration script)
CREATE POLICY "service_all_posts"
  ON public.blog_posts
  FOR ALL
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_blog_tenant_published ON public.blog_posts(tenant_id, is_published, published_at DESC);
CREATE INDEX idx_blog_slug ON public.blog_posts(tenant_id, slug);
```

#### 3. Staff profile columns (add if missing)

```sql
-- migration: add_staff_marketing_columns
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
```

---

## @anchor server-actions

### API Routes

#### Newsletter — `app/api/newsletter/route.ts`

```typescript
// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const ADMIN_EMAIL = 'admin@crandallchristianacademy.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ success: true }); // Silent fail for bots
    }

    // Validate
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Get IP for audit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

    // Upsert subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          tenant_id: TENANT_ID,
          email: email.toLowerCase().trim(),
          consent_at: new Date().toISOString(),
          source_page: 'home',
          ip_address: ip,
        },
        { onConflict: 'tenant_id,email' }
      );

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    // Notify admin
    await resend.emails.send({
      from: 'CCA Newsletter <noreply@crandallchristianacademy.com>',
      to: ADMIN_EMAIL,
      subject: `New newsletter subscriber: ${email}`,
      text: `New subscriber: ${email}\nSource: Marketing site home page\nTime: ${new Date().toISOString()}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Contact — `app/api/contact/route.ts`

```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const ADMIN_EMAIL = 'admin@crandallchristianacademy.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, message } = body;

    // Honeypot check
    if (body.company) {
      return NextResponse.json({ success: true }); // Silent fail for bots
    }

    // Validate required fields
    if (!email || !email.includes('@') || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }

    // Insert into enrollment_leads (existing table)
    const { error } = await supabase.from('enrollment_leads').insert({
      tenant_id: TENANT_ID,
      parent_first_name: firstName || null,
      parent_last_name: lastName || null,
      parent_email: email.toLowerCase().trim(),
      notes: message,
      source: 'marketing_contact_form',
      source_detail: '/contact',
      status: 'new',
      priority: 'medium',
    });

    if (error) {
      console.error('Contact form error:', error);
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }

    // Notify admin
    await resend.emails.send({
      from: 'CCA Website <noreply@crandallchristianacademy.com>',
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `New contact form submission from ${firstName || 'someone'} ${lastName || ''}`.trim(),
      text: `Name: ${firstName || ''} ${lastName || ''}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    // Auto-reply to submitter
    await resend.emails.send({
      from: 'Crandall Christian Academy <noreply@crandallchristianacademy.com>',
      to: email,
      subject: 'Thanks for reaching out to Crandall Christian Academy!',
      text: `Hi ${firstName || 'there'},\n\nThank you for contacting Crandall Christian Academy. We received your message and will be in touch within one business day.\n\nBlessings,\nThe CCA Team\n\n(945) 226-6584\nadmin@crandallchristianacademy.com`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## @anchor blog-migration

### Blog migration script

```typescript
// scripts/migrate-cca-blog.ts
//
// Usage: npx tsx scripts/migrate-cca-blog.ts
//
// Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env
// Also requires Playwright: npm install -D playwright @playwright/test && npx playwright install chromium
//
// This script:
// 1. Launches headless Chromium (needed because Wix is client-rendered)
// 2. Visits each blog post URL
// 3. Extracts title, date, body HTML, cover image
// 4. Downloads cover images to public/marketing/blog/
// 5. Inserts rows into blog_posts table

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const BASE_URL = 'https://www.crandallchristianacademy.com/post';
const COVER_DIR = path.join(process.cwd(), 'public/cca-assets/marketing/blog');

const SLUGS = [
  'free-activities-for-kids-in-dallas-this-spring',
  '5-fun-springtime-activities-for-preschoolers',
  'crandall-christian-academy-opening-august-2025',
  'the-role-of-play-in-child-development-1',
  '10-creative-ways-to-display-your-child-s-artwork-and-why-it-s-important',
  'the-importance-of-early-childhood-education',
  'how-to-teach-gratitude-to-young-children-and-why-it-s-important',
  'innovative-parenting-strategies-for-high-energy-families-how-crandall-christian-academy-can-help',
  'building-a-foundation-the-impact-of-early-childhood-education',
  'teaching-christian-values-through-early-education',
  '7-bible-verses-every-preschooler-should-learn',
  'the-importance-of-early-childhood-education-for-future-success',
  'how-faith-and-education-go-hand-in-hand',
  '10-best-books-for-preschoolers-educational-and-faith-based-favorites',
  'tips-for-preparing-your-family-for-preschool',
  'the-benefits-of-storytelling-for-early-learners',
  '5-questions-to-ask-when-touring-a-preschool',
  'how-to-choose-the-right-preschool-for-your-child-1',
  'the-benefits-of-faith-based-early-learning-programs',
  '5-fun-outdoor-activities-for-preschool-aged-kids',
  'how-to-choose-the-right-preschool-for-your-child',
  'how-to-create-a-routine-that-works-for-your-family',
  'preparing-your-child-emotionally-for-preschool',
  'preparing-the-next-generation-with-faith-based-learning',
  'storytelling-in-early-childhood-development-unleashing-imagination-and-learning',
  'tips-for-building-a-strong-parent-child-bond',
  'why-play-is-an-essential-part-of-learning',
  'how-our-values-shape-the-future-of-education-at-crandall-christian-academy',
  'how-to-prepare-your-child-for-their-first-day-of-preschool',
  'how-to-encourage-curiosity-and-learning-at-home',
  'the-mission-of-crandall-christian-academy',
  'navigating-the-playful-energy-strategies-for-managing-high-energy-kids',
  'the-role-of-preschool-in-a-child-s-social-development',
  'bible-stories-that-inspire-preschoolers',
  'why-crandall-needs-a-christian-preschool',
  'fun-learning-activities-you-can-do-at-home-with-your-preschooler',
  'preparing-your-home-for-crandall-preschool-creating-a-sensory-friendly-environment-for-your-prescho',
  'understanding-the-needs-of-preschool-aged-children',
  'what-sets-crandall-christian-academy-apart',
  'the-symphony-of-sensory-play-in-early-childhood-education',
  'the-symphony-of-learning-and-imagination-understanding-the-symbiosis-between-learning-and-creative',
  'the-role-of-play-in-child-development',
  'the-benefits-of-a-christian-preschool-environment-a-look-inside-crandall-christian-academy',
  '5-essential-tips-for-choosing-the-right-private-preschool-for-your-child',
  'preparing-your-toddler-for-preschool-a-parent-s-guide',
  'preparing-your-preschooler-for-preschool-a-guide-from-crandall-christian-academy',
  'choosing-the-right-childcare-center-for-your-family-insights-from-crandall-christian-academy',
  'nurturing-early-learners-a-comprehensive-guide-for-future-parents-of-crandall-christian-academy',
  'nourishing-young-minds-the-tapestry-of-early-childhood-education',
  'building-emotional-intelligence-in-preschoolers-strategies-from-crandall-christian-academy',
  'the-art-of-storytelling-in-early-childhood-development-unleashing-imagination-and-learning',
  'engaging-young-minds-interactive-learning-at-crandall-christian-academyintroduction',
  'the-importance-of-faith-in-early-learning-insights-from-crandall-christian-academyintroduction',
  'outdoor-learning-and-play-the-benefits-of-nature-in-preschool-education',
  'the-role-of-technology-in-preschool-education-what-parents-should-know',
  'effective-parent-teacher-communication-building-a-partnership-for-your-child-s-success',
  'nutrition-for-preschoolers-healthy-eating-habits-start-early',
  'the-importance-of-play-in-preschool-learning',
  'choosing-the-right-preschool-factors-to-consider',
  'understanding-early-childhood-development-what-to-expect-in-the-preschool-years-at-crandall-christi',
  '7-key-factors-to-consider-when-touring-crandall-christian-academy',
  'building-a-foundation-the-impact-of-early-childhood-educationintroduction',
  'title-managing-separation-anxiety-tips-for-a-tear-free-preschool-experience',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function downloadImage(url: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = url.match(/\.(jpg|jpeg|png|webp|avif)/i)?.[1] ?? 'jpg';
    const filename = `${slug}.${ext}`;
    const filepath = path.join(COVER_DIR, filename);
    await writeFile(filepath, buffer);
    return `/marketing/blog/${filename}`;
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(COVER_DIR)) {
    await mkdir(COVER_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let successCount = 0;
  let errorCount = 0;

  for (const slug of SLUGS) {
    const url = `${BASE_URL}/${slug}`;
    console.log(`[${successCount + errorCount + 1}/${SLUGS.length}] ${slug}`);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for Wix to render
      await page.waitForSelector('[data-hook="blog-post-page"]', { timeout: 10000 }).catch(() => {});

      const postData = await page.evaluate(() => {
        const titleEl = document.querySelector('h1');
        const title = titleEl?.textContent?.trim() ?? '';

        // Body — Wix wraps blog content in a rich-content container
        const bodyEl = document.querySelector('[data-hook="post-description__viewer"]') ??
                       document.querySelector('.post-content') ??
                       document.querySelector('article');
        const bodyHtml = bodyEl?.innerHTML ?? '';

        // Cover image
        const coverEl = document.querySelector('[data-hook="blog-cover-image"] img') ??
                        document.querySelector('article img');
        const coverUrl = coverEl?.getAttribute('src') ?? null;

        // Published date
        const dateEl = document.querySelector('[data-hook="time-ago"]') ??
                       document.querySelector('time');
        const dateStr = dateEl?.getAttribute('datetime') ?? dateEl?.textContent ?? null;

        return { title, bodyHtml, coverUrl, dateStr };
      });

      // Download cover
      let coverPath: string | null = null;
      if (postData.coverUrl) {
        coverPath = await downloadImage(postData.coverUrl, slug);
      }

      // Parse date
      let publishedAt = new Date().toISOString();
      if (postData.dateStr) {
        const parsed = new Date(postData.dateStr);
        if (!isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
      }

      // Generate excerpt
      const plainText = postData.bodyHtml.replace(/<[^>]*>/g, '').trim();
      const excerpt = plainText.slice(0, 200) + (plainText.length > 200 ? '...' : '');

      // Upsert to Supabase
      const { error } = await supabase.from('blog_posts').upsert(
        {
          tenant_id: TENANT_ID,
          slug,
          title: postData.title || slug.replace(/-/g, ' '),
          excerpt,
          body_html: postData.bodyHtml,
          cover_path: coverPath,
          author: 'Crandall Christian Academy',
          published_at: publishedAt,
          read_time_minutes: estimateReadTime(postData.bodyHtml),
          is_published: true,
        },
        { onConflict: 'tenant_id,slug' }
      );

      if (error) {
        console.error(`  DB error: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        console.log(`  ✓ ${postData.title.slice(0, 60)}`);
      }

      await page.close();
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
      errorCount++;
    }

    // Rate limit — be nice to Wix
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();
  console.log(`\nDone. ${successCount} success, ${errorCount} errors.`);
}

main();
```

---

## @anchor seo

### Structured Data — LocalBusiness + Preschool

Add to `app/(marketing)/layout.tsx` inside the `<>` wrapper, after `<Footer />`:

```tsx
{/* Global JSON-LD */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'Preschool'],
      name: 'Crandall Christian Academy',
      description: 'A premier, faith-based preschool in Crandall, Texas offering programs for infants through private kindergarten.',
      url: 'https://crandallchristianacademy.com',
      telephone: '+19452266584',
      email: 'admin@crandallchristianacademy.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Crandall',
        addressRegion: 'TX',
        addressCountry: 'US',
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '18:00',
      },
      logo: 'https://crandallchristianacademy.com/marketing/shared/cca-logo-full.png',
      image: 'https://crandallchristianacademy.com/marketing/home/facility-hero-poster.jpg',
      priceRange: '$$',
    }),
  }}
/>
```

### Sitemap — `app/sitemap.ts`

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://crandallchristianacademy.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/our-team`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Blog posts
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at, updated_at')
    .eq('tenant_id', TENANT_ID)
    .eq('is_published', true);

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...blogPages];
}
```

### Robots — `app/robots.ts`

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://crandallchristianacademy.com/sitemap.xml',
  };
}
```

---

## @anchor redirects

### Redirect `/book-online` → `/contact`

In `next.config.ts`:

```typescript
// next.config.ts — add to existing config
const nextConfig = {
  // ... existing config
  async redirects() {
    return [
      {
        source: '/book-online',
        destination: '/contact',
        permanent: true, // 301
      },
    ];
  },
};
```

---

## @anchor animation-spec

### Framer Motion — Scroll Reveal System

**Principle:** Every `<section>` entrance gets a subtle reveal. The `ScrollReveal` component (defined above) handles all of this. Rules:

1. **Gate on `prefers-reduced-motion`** — if the user prefers reduced motion, render children without animation. The `ScrollReveal` component already does this via `useReducedMotion()`.
2. **Direction:** Default is `up` (slide up + fade). Use `left`/`right` for alternating FeatureRows.
3. **Stagger:** Cards in grids get `delay={index * 0.08}` to `delay={index * 0.12}` depending on grid density.
4. **Viewport trigger:** `once: true, margin: '-64px'` — triggers when the element is 64px into the viewport, fires once only.
5. **Easing:** `[0.22, 1, 0.36, 1]` (custom cubic-bezier — snappy entry, gentle settle).
6. **Duration:** 0.6s for sections, 0.3s for accordion open/close.

**Video backgrounds:**
- Check `prefers-reduced-motion` — if true, show poster image only (no video). The `VideoBackground` component already handles this.
- Videos are `muted autoPlay loop playsInline` — no audio, no controls.
- Use `<source>` with `media` queries: 1080p for ≥768px, 720p fallback.

---

## @anchor supabase-client

### Supabase client setup

If the project doesn't already have a Supabase server client helper, create one:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies, which is fine for reads
          }
        },
      },
    }
  );
}
```

> **Note:** If `@supabase/ssr` is not installed, run `npm install @supabase/ssr`. If a server client already exists in the project, use that instead of creating a duplicate.

---

## @anchor image-optimization

### Image optimization — post-download processing

Run this after the initial build to optimize the large images:

```bash
#!/bin/bash
# scripts/optimize-marketing-images.sh
# Requires: sharp-cli (npm install -g sharp-cli)

cd public/cca-assets/marketing

# Generate responsive variants for all JPGs
find . -name "*.jpg" -size +500k | while read img; do
  dir=$(dirname "$img")
  base=$(basename "$img" .jpg)
  
  for width in 320 640 960 1280 1920; do
    sharp resize $width --output "$dir/${base}-${width}w.webp" "$img" 2>/dev/null
    sharp resize $width --output "$dir/${base}-${width}w.avif" "$img" 2>/dev/null
  done
  echo "✓ $img"
done

# Re-encode videos at lower bitrate
find . -name "*-1080p.mp4" | while read vid; do
  base=$(basename "$vid" -1080p.mp4)
  dir=$(dirname "$vid")
  ffmpeg -i "$vid" -vf scale=1920:-2 -b:v 1500k -an -movflags +faststart "$dir/${base}-1080p-opt.mp4" -y 2>/dev/null
  ffmpeg -i "$vid" -vf scale=1920:-2 -b:v 1500k -an -c:v libvpx-vp9 "$dir/${base}-1080p-opt.webm" -y 2>/dev/null
  echo "✓ $vid"
done

echo "Done. Check file sizes and replace originals if satisfactory."
```

---

## @anchor verify

### VERIFY queries

Run these after the build is complete to confirm correctness.

```sql
-- VERIFY 1: newsletter_subscribers table exists with correct structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'newsletter_subscribers' AND table_schema = 'public'
ORDER BY ordinal_position;
-- Expected: id, tenant_id, email, consent_at, source_page, ip_address, unsubscribed_at, created_at

-- VERIFY 2: blog_posts table exists with correct structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'blog_posts' AND table_schema = 'public'
ORDER BY ordinal_position;
-- Expected: id, tenant_id, slug, title, excerpt, body_html, cover_path, author, published_at, read_time_minutes, is_published, meta_title, meta_description, created_at, updated_at

-- VERIFY 3: RLS is enabled on new tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('newsletter_subscribers', 'blog_posts') AND schemaname = 'public';
-- Expected: both should show rowsecurity = true

-- VERIFY 4: RLS policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('newsletter_subscribers', 'blog_posts') AND schemaname = 'public';
-- Expected: 3 policies on newsletter_subscribers, 3 policies on blog_posts

-- VERIFY 5: staff_profiles has marketing columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'staff_profiles' AND column_name IN ('is_active', 'sort_order', 'bio', 'avatar_url');
-- Expected: all four columns present

-- VERIFY 6: CCA tenant exists
SELECT id, name, slug FROM tenants WHERE slug = 'cca';
-- Expected: a0a0a0a0-cca0-4000-8000-000000000001, Crandall Christian Academy, cca
```

### Build verification (run from project root)

```bash
# VERIFY 7: All marketing components exist
ls components/marketing/Header.tsx \
   components/marketing/Footer.tsx \
   components/marketing/Hero.tsx \
   components/marketing/ScrollReveal.tsx \
   components/marketing/VideoBackground.tsx \
   components/marketing/SectionHeader.tsx \
   components/marketing/PillarCard.tsx \
   components/marketing/CurriculumCard.tsx \
   components/marketing/ValuePropCard.tsx \
   components/marketing/FeatureRow.tsx \
   components/marketing/CTABlock.tsx \
   components/marketing/NewsletterForm.tsx \
   components/marketing/ContactForm.tsx \
   components/marketing/FAQAccordion.tsx \
   components/marketing/StaffCard.tsx \
   components/marketing/BlogCard.tsx \
   components/marketing/ProgramCard.tsx

# VERIFY 8: All page routes exist
ls app/\(marketing\)/page.tsx \
   app/\(marketing\)/about/page.tsx \
   app/\(marketing\)/contact/page.tsx \
   app/\(marketing\)/faq/page.tsx \
   app/\(marketing\)/our-team/page.tsx \
   app/\(marketing\)/blog/page.tsx \
   app/\(marketing\)/blog/\[slug\]/page.tsx

# VERIFY 9: API routes exist
ls app/api/newsletter/route.ts \
   app/api/contact/route.ts

# VERIFY 10: Build passes
npm run build 2>&1 | tail -20

# VERIFY 11: Lighthouse (requires lighthouse CLI: npm install -g lighthouse)
# Run against the dev server after `npm run dev`
lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-home.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo
# Target: all scores ≥ 90 (stretch goal ≥ 95)
```

---

## @anchor build-log

### BUILD_LOG entries

After each major section is complete, CC should append to `BUILD_LOG.md`:

```markdown
## @anchor marketing-replica-build

### [DATE] Marketing Site Replica — Phase 1: Scaffold + Components
- Created `app/(marketing)/layout.tsx` with marketing-specific header/footer
- Created 17 reusable components under `components/marketing/`
- Installed framer-motion, @supabase/ssr, resend
- Added CCA-specific Tailwind tokens (colors, fonts, animations)
- Symlinked `public/cca-assets/marketing/` → `public/marketing/`

### [DATE] Marketing Site Replica — Phase 2: Pages
- Home page: 13 sections (hero through final CTA), all copy verbatim from extraction
- About page: hero, mission, 5 program cards with anchor links
- Contact page: hero, body, native contact form
- FAQ page: 8-item accordion with JSON-LD FAQPage schema
- Our Team page: dynamic from staff_profiles table (graceful empty state)
- Blog index: paginated grid from blog_posts table
- Blog detail: full post with BlogPosting JSON-LD

### [DATE] Marketing Site Replica — Phase 3: Backend
- Migration: created newsletter_subscribers table + RLS
- Migration: created blog_posts table + RLS
- Migration: added is_active, sort_order, bio, avatar_url to staff_profiles
- API route: /api/newsletter (upsert + Resend notify)
- API route: /api/contact (enrollment_leads insert + admin notify + auto-reply)
- Blog migration script: scripts/migrate-cca-blog.ts (Playwright scraper)

### [DATE] Marketing Site Replica — Phase 4: SEO + Polish
- LocalBusiness + Preschool JSON-LD on all pages
- FAQPage schema on /faq
- BlogPosting schema on each blog post
- sitemap.ts (static + dynamic blog posts)
- robots.ts
- /book-online → /contact redirect (301)
- Open Graph + Twitter meta on all pages
- Skip-to-main link, semantic landmarks, aria-labels
```

---

## @anchor execution-notes

### Execution notes

1. **Check if the Next.js project already exists.** If `Preschool Businesses Win/` has a `package.json`, `app/` directory, and `node_modules/`, work within it. If not, scaffold from scratch.

2. **Symlink assets.** The assets live at `public/cca-assets/marketing/`. Create a symlink at `public/marketing` pointing to `../public/cca-assets/marketing/` so Next.js `<Image>` can serve them. If symlinks don't work on the deployment target, copy the directory instead.

3. **Don't duplicate existing utilities.** If `lib/supabase/server.ts` already exists, use it. If Tailwind is already configured, merge the CCA tokens into the existing config rather than replacing it.

4. **The `(marketing)` route group** is intentional. It shares the marketing layout (Header + Footer) without affecting the portal routes (which use a different layout with the portal header/sidebar).

5. **Run migrations before testing pages** that query `blog_posts` or `newsletter_subscribers`. The `/our-team` and `/blog` pages will show graceful empty states if their tables exist but have no data.

6. **Blog migration is a separate step.** Run `npx tsx scripts/migrate-cca-blog.ts` after the main build is complete. It takes ~3 minutes (63 posts × 2s rate limit).

7. **Image optimization is optional for the initial build.** The raw images work; optimization is a post-ship polish step.

8. **Test forms end-to-end** by submitting a newsletter signup and a contact form, then running:
   ```sql
   SELECT * FROM newsletter_subscribers WHERE tenant_id = 'a0a0a0a0-cca0-4000-8000-000000000001';
   SELECT * FROM enrollment_leads WHERE tenant_id = 'a0a0a0a0-cca0-4000-8000-000000000001' AND source = 'marketing_contact_form';
   ```

---

**END OF BUILD DOC**
