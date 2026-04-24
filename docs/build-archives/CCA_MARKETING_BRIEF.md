# Crandall Christian Academy — Marketing Site Build Brief
**Last updated: 2026-04-09**

This document is the single source of truth for the CCA marketing site build. Read it in full before writing code. Read `BRAND.md` and `COPY.md` alongside it.

> ⚠️ **Next.js 16 — read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` before touching any route file.**

---

## 1. Goal

Build a marketing site for Crandall Christian Academy that:

1. Looks and feels like a premium, warm, faith-forward preschool — not a template. Think Apple-meets-Montessori, not church-bulletin-clip-art.
2. Converts on one primary funnel: **enrollment application** (PASTOR-style).
3. Captures every lead in Supabase **and** notifies the school director by email via Resend.
4. Is mobile-first, accessible (WCAG 2.2 AA), and respects `prefers-reduced-motion`.
5. Is structured to share components, types, and Supabase access with the management portal.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16** (App Router, Turbopack default) | |
| Runtime | React **19** | |
| Language | TypeScript 5 strict | |
| Styling | Tailwind CSS **v4** (`@import "tailwindcss"` + `@theme inline`) | |
| Animation | **`motion`** (the new Framer Motion) | `npm i motion` |
| Icons | `lucide-react` | |
| DB / Backend | **Supabase** | Same project as the portal. |
| Email | **Resend** | |
| Validation | **Zod** | |
| Hosting | Vercel | |

**Do not install:** shadcn/ui, Radix, framer-motion (legacy), tailwindcss-animate, MUI. Keep the bundle lean.

---

## 3. File tree (marketing portion)

```
src/
  app/
    (marketing)/
      layout.tsx
      page.tsx                  # Home
      programs/
        page.tsx                # Programs overview
      about/
        page.tsx                # About the school + staff
      enroll/
        page.tsx                # Enrollment PASTOR funnel + wizard
      contact/
        page.tsx
      faith/
        page.tsx                # Faith & mission
    globals.css
  components/
    ui/                         # Shared primitives
      button.tsx
      container.tsx
      section.tsx
      eyebrow.tsx
      section-header.tsx
      card.tsx
      stat.tsx
      quote.tsx
      logo.tsx
      reveal.tsx
      form-field.tsx
      wizard.tsx
      progress-bar.tsx
    layout/
      site-header.tsx
      site-footer.tsx
      mobile-menu.tsx
      page-transition.tsx
      skip-to-content.tsx
    home/
      hero.tsx
      programs-preview.tsx
      faith-statement.tsx
      founder-cutin.tsx
      stats-strip.tsx
      testimonials.tsx
      final-cta-band.tsx
    enrollment/
      enrollment-wizard.tsx
      wizard-steps/
        step-parent.tsx
        step-child.tsx
        step-program.tsx
        step-additional.tsx
  lib/
    motion.ts
    cn.ts
    supabase/
      server.ts
      browser.ts
    actions/
      submit-enrollment.ts
      submit-contact-message.ts
    email/
      resend.ts
      templates/
        new-enrollment.tsx
        new-contact-message.tsx
    schemas/
      enrollment.ts
      contact-message.ts
    database.types.ts
public/
  logos/
  assets/
    photos/
```

---

## 4. Pages — required sections

### `/` Home
1. SiteHeader (sticky)
2. Hero — warm, inviting, photo-forward. Headline + sub + CTA to enroll.
3. Programs preview — cards for each age group / program.
4. Faith statement — what makes CCA different.
5. Founder / director cut-in — personal, trustworthy.
6. Stats strip — years in operation, student count, teacher-to-student ratio, satisfaction score.
7. Testimonials — parent quotes.
8. Final CTA band — enroll today.
9. SiteFooter

### `/programs`
- Detailed breakdown of each program: Infants, Toddlers, Pre-K, Before/After Care, Summer Camp.
- Age ranges, schedules, curriculum approach, teacher-to-student ratios.
- Photo-rich. Warm and inviting.

### `/about`
- School history, mission, vision.
- Director/founder story.
- Staff highlights (photos + bios for lead teachers).
- Facility tour (photos of classrooms, playground, etc.).

### `/enroll` — PASTOR funnel
- Problem: finding a preschool you trust is hard.
- Amplify: the wrong choice affects your child's development.
- Solution: CCA's approach — faith-based, small ratios, trained staff, parent transparency.
- Transformation: testimonials from parents.
- Offer: enrollment application.
- Risk reversal: tour before committing, no enrollment fee until confirmed.
- **Enrollment Wizard** (4 steps) at the bottom.

### `/faith`
- CCA's Christian foundation.
- How faith is integrated into daily activities (age-appropriate, welcoming to all families).
- Chapel time, biblical stories, character development.
- Statement of faith.

### `/contact`
- Contact form, phone, email, address, map.
- Office hours.

---

## 5. The enrollment wizard

A **4-step inline form** at the bottom of `/enroll` (id-anchored).

### Behavior
- Same wizard infrastructure as Yes Mamms: step transitions, progress bar, Zod per-step, `useActionState` for final submit.
- On submit: Server Action → Supabase insert → Resend email to director → success state.
- Honeypot field for anti-spam.

### Fields
1. **Parent info:** first_name, last_name, email, phone, relationship_to_child (parent/grandparent/guardian)
2. **Child info:** child_first_name, child_last_name, child_dob, gender, allergies_or_medical (textarea), special_needs (textarea, optional)
3. **Program interest:** program_type (segmented: infant/toddler/pre-k/before-after/summer), desired_start_date, schedule_preference (full_day/half_day_am/half_day_pm), how_heard (text)
4. **Additional:** faith_community (text, optional), sibling_enrolled (toggle + name), notes (textarea, optional), agree_to_contact (checkbox)

### Supabase table: `enrollment_applications`
Same table the portal reads from. Columns match the wizard fields plus: `triage_status`, `triage_score`, `triage_assigned_to`, `triage_notes`, `utm_*`, `user_agent`, `created_at`.

---

## 6. Server Actions

Same pattern as Yes Mamms:
```ts
'use server'
// Honeypot check → Zod validate → Supabase insert (service role) → Resend email → return { ok: true }
```

---

## 7. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=<to be created>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<to be created>
SUPABASE_SERVICE_ROLE_KEY=<ask Skylar>
RESEND_API_KEY=<ask Skylar>
DIRECTOR_NOTIFICATION_EMAIL=<school director email>
NEXT_PUBLIC_SITE_URL=https://crandallchristianacademy.com
```

---

## 8. Next.js 16 gotchas

Same as Yes Mamms — see `CCA_BUILD_BRIEF.md` or the upgrade guide:
1. `params` and `searchParams` are Promises — must `await`.
2. `cookies()`, `headers()`, `draftMode()` are async.
3. `middleware.ts` → `proxy.ts`.
4. Turbopack is default.
5. `next/legacy/image` is deprecated.
6. Server Actions validate with Zod inside the action, not just client-side.

---

## 9. Acceptance criteria

**Per page:**
- [ ] All copy from `COPY.md` rendered.
- [ ] Hero animates in, respecting reduced motion.
- [ ] Mobile (375px), tablet (768px), desktop (1440px) pixel-considered.
- [ ] Lighthouse: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO = 100.
- [ ] No console warnings, no hydration mismatches.

**Per wizard:**
- [ ] All four steps render and validate.
- [ ] Submitting writes to Supabase.
- [ ] Submitting sends a Resend email.
- [ ] Honeypot blocks bots.
- [ ] Keyboard navigation complete.

**Project-wide:**
- [ ] `npm run build` zero warnings.
- [ ] `npm run lint` clean.
- [ ] Deployed to Vercel preview.

---

## 10. Out of scope

- The management portal (separate phase, same repo).
- Auth / sign-in.
- Payments / Stripe.
- Blog / CMS.
- Internationalization.
- Dark mode.

---

## 11. Build sequence

1. Install deps, set up `globals.css` with tokens, `lib/cn.ts`, `lib/motion.ts`, `lib/supabase/*`.
2. Build `components/ui/*` primitives.
3. Build layout (header, footer, page transition).
4. Build home page.
5. Build `/enroll` — PASTOR sections + wizard.
6. Build `/programs`, `/about`, `/faith`, `/contact`.
7. Server actions + email templates.
8. Sitemap, robots, OG image.
9. Lighthouse + accessibility pass.
10. Deploy preview → Skylar review.
