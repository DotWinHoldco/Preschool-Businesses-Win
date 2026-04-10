# Crandall Christian Academy — Brand & Design System

> The marketing site and portal should feel warm, trustworthy, and joyful — but grounded. Think premium Montessori school meets modern app, not generic daycare template. Parents should feel "my child is safe and loved here" from the first pixel.

---

## 1. Brand voice

**Personality:** Warm, faithful, confident. Community-rooted. Joyful but never flippant. Professional but never cold.

**Voice rules**
- Speak like the director who knows every child by name and every parent by first name.
- Short sentences. Warm verbs. Concrete nouns.
- Address the reader as "you" and "your child/family." CCA is "we."
- No corporate-speak ("leverage," "optimize," "solutions"). No clichés ("little ones" is fine once, not five times per page).
- Specifics beat generalities. "8:1 student-teacher ratio" > "small class sizes."

**Audience tones**
- **To parents:** trust, warmth, transparency. Your child's day is visible. Your family is known. Your faith is honored.
- **To prospective families:** welcome, clarity, confidence. This is the preschool you've been looking for.
- **To staff:** respect, purpose, support. You're not just a caregiver — you're shaping lives.

---

## 2. Color tokens

> **NOTE:** These are placeholder tokens. Before the marketing site build begins, Skylar should provide CCA's actual brand colors, or confirm these defaults. The structure matches Yes Mamms' token system so the design system carries forward identically.

All values exposed as Tailwind v4 `@theme` tokens in `globals.css`.

| Token | Hex | Use |
|---|---|---|
| `--color-primary-500` | `#2563EB` | Primary brand. CTAs, accents. (Placeholder: warm blue — adjust to CCA brand) |
| `--color-primary-600` | `#1D4ED8` | Hover/pressed state for primary. |
| `--color-primary-50`  | `#EFF6FF` | Tinted backgrounds, badge fills. |
| `--color-gold-500`    | `#F59E0B` | Secondary accent. Faith elements, stars, warmth. |
| `--color-gold-50`     | `#FFFBEB` | Warm tinted backgrounds. |
| `--color-charcoal-900`| `#1C1C28` | Display headings on light bg. |
| `--color-charcoal-700`| `#2E2E3D` | Body text. |
| `--color-cream-50`    | `#FDF8F0` | Hero background washes, section dividers. |
| `--color-gray-50`     | `#F2F3F7` | Card backgrounds. |
| `--color-gray-200`    | `#E5E7EE` | Borders, hairlines. |
| `--color-white`       | `#FFFFFF` | Default surface. |
| `--color-success`     | `#10B981` | Check-in confirmed, ratio compliant. |
| `--color-warning`     | `#F59E0B` | Approaching limits, cert expiring soon. |
| `--color-danger`      | `#EF4444` | Allergy alerts, unauthorized pickup, ratio violation. |

**Gradients**
- `--gradient-hero`: `linear-gradient(135deg, #EFF6FF 0%, #FDF8F0 50%, #FFFFFF 100%)`
- `--gradient-cta`:  `linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)`

**Dark mode:** out of scope for v1.

---

## 3. Typography

Load via `next/font/google`.

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / headings | **Nunito** | 600, 700, 800 | Rounded, warm, childcare-appropriate but not childish. |
| Body | **Open Sans** | 400, 500, 600, 700 | Same as Yes Mamms — proven readable. |

**Type scale (mobile → desktop)**

| Token | Mobile | Desktop | Line height | Tracking |
|---|---|---|---|---|
| `text-display-2xl` | 40px | 72px | 0.95 | -0.03em |
| `text-display-xl`  | 32px | 56px | 1.0  | -0.025em |
| `text-display-lg`  | 28px | 44px | 1.05 | -0.02em |
| `text-h1` | 26px | 36px | 1.1 | -0.015em |
| `text-h2` | 22px | 30px | 1.15 | -0.01em |
| `text-h3` | 18px | 22px | 1.25 | -0.005em |
| `text-body-lg` | 17px | 19px | 1.55 | 0 |
| `text-body`    | 15px | 16px | 1.6 | 0 |
| `text-small`   | 13px | 14px | 1.5 | 0.01em |
| `text-eyebrow` | 11px | 12px | 1.2 | 0.12em uppercase |

Use `text-balance` on every headline, `text-pretty` on every paragraph.

---

## 4. Spacing, radius, elevation

- **Spacing scale:** Tailwind default (4px base). Section vertical padding: `py-20 md:py-28 lg:py-36`.
- **Radius tokens:** `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-xl: 28px`, `--radius-pill: 9999px`. Default cards `--radius-lg`. Buttons pill or `--radius-md`.
- **Elevation:** flat by default. Shadows reserved for elevated cards on hover and floating action bars.
  - `shadow-card`: `0 1px 2px rgba(28,28,40,.04), 0 8px 24px -8px rgba(28,28,40,.08)`
  - `shadow-card-hover`: `0 2px 4px rgba(28,28,40,.06), 0 24px 48px -12px rgba(37,99,235,.12)`
  - `shadow-cta`: `0 8px 24px -8px rgba(37,99,235,.35)`

---

## 5. Motion language

Library: **Motion** (the new Framer Motion). All animation in client components.

**Easing curves (in `lib/motion.ts`)**
- `easeOutExpo`: `[0.16, 1, 0.3, 1]` — default for entrance.
- `easeInOutSoft`: `[0.65, 0, 0.35, 1]` — page transitions, layout shifts.
- `easeOutSnap`: `[0.22, 1, 0.36, 1]` — buttons, micro-interactions.

**Durations**
- Micro (hover, tap): 150–200ms
- Component entrance: 600–800ms
- Hero / set-piece: 1000–1400ms
- Page transitions: 400ms

**Standard variants** (shared, from `lib/motion.ts`):
```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show:   { opacity: 1, y: 0, filter: 'blur(0px)',
            transition: { duration: 0.8, ease: easeOutExpo } },
}
export const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
```

**Scroll:** `whileInView` with `viewport={{ once: true, margin: '-10% 0px' }}`. Numbers count up on scroll into view.

**Reduced motion:** always respected. Non-negotiable.

---

## 6. Component primitives

Build once in `components/ui/`, reuse everywhere. Same philosophy as Yes Mamms.

| Component | Notes |
|---|---|
| `Button` | Variants: `primary` (blue gradient or solid), `secondary` (outline), `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Pill radius. Motion: scale 0.97 on tap. |
| `Container` | `max-w-7xl mx-auto px-6 md:px-10`. |
| `Section` | Vertical padding wrapper, optional `bg` prop. |
| `Eyebrow` | Uppercase primary-color label above headings. |
| `SectionHeader` | Eyebrow + h2 + optional lead paragraph. |
| `Card` | Rounded-lg, white, shadow-card → shadow-card-hover on hover. |
| `Stat` | Big number + label, count-up on scroll. |
| `Quote` | Testimonial card with avatar. |
| `Logo` | Brand mark variants. |
| `Nav` | Sticky, glass background after scroll. |
| `Footer` | Brand mark, nav columns, contact, copyright. |
| `FormField` | Label + input + error, accessible. |
| `Wizard` | Multi-step container with progress bar. |
| `Reveal` | Drop-in `whileInView` wrapper. |

---

## 7. Iconography & imagery

- **Icons:** `lucide-react`. Stroke 1.5.
- **Photography:** use real photos from CCA if available in `public/assets/photos/`. Fall back to warm gradient blocks in brand palette — never AI-generated stock imagery of children.
- **Logos:** source files in `public/logos/`. Skylar to provide.

---

## 8. Accessibility floor

- WCAG 2.2 AA color contrast on every text/background combo.
- Every interactive element has visible focus ring.
- Forms have associated labels, `aria-describedby` for errors.
- All animation respects `prefers-reduced-motion`.
- Skip-to-content link.
- Semantic landmarks.
