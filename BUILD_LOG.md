# Preschool Businesses Win — Build Log

> Read the top of this file before starting any task. Newest entries first.

---

### 2026-04-20 — Portal QA Phase 2: Missing Admin CRUD Surfaces
- **What:** Added CRUD surfaces across 7 areas: Staff (Add Staff form + server action), Student detail (edit dialog per section + server actions), Newsfeed (compose post dialog + DB migration 0055 + server action), Drop-in (3-tab layout: bookings/slots/rates with inline CRUD), Staff availability (add override form + calendar connection stubs), Curriculum (add lesson plan dialog, expandable rows), Portfolios (add entry dialog, expandable rows).
- **Where:** `src/app/portal/admin/staff/` · `src/components/portal/students/student-edit-dialog.tsx` · `src/lib/actions/student/` · `src/components/portal/newsfeed/compose-post.tsx` · `src/lib/actions/newsfeed/create-post.ts` · `supabase/migrations/0055_newsfeed_posts.sql` · `src/components/portal/drop-in/drop-in-tabs.tsx` · `src/components/portal/appointments/availability-client.tsx` · `src/components/portal/admin-curriculum-client.tsx` · `src/components/portal/admin-portfolios-client.tsx`
- **Status:** Complete

### 2026-04-20 — Portal QA Phase 1: Shell & Nav
- **What:** Wired topbar classroom dropdown to real DB data (removed hardcoded Butterfly/Sunshine placeholders), persists selection via cookie. Search input navigates to new search page on Enter. Bell links to new notifications page. User menu items link to new profile and notification preferences pages. Added `attendance_tracking` feature flag for CCA.
- **Where:** `src/app/portal/layout.tsx` · `src/components/portal/topbar.tsx` · `src/components/portal/portal-shell.tsx` · `src/lib/actions/classroom/set-active.ts` · `src/app/portal/admin/search/page.tsx` · `src/app/portal/admin/notifications/` · `src/app/portal/admin/profile/` · `src/app/portal/admin/notification-preferences/page.tsx` · `src/lib/actions/notifications/mark-read.ts` · `src/lib/actions/profile/update-profile.ts` · `src/components/portal/profile/profile-form.tsx`
- **Status:** Complete

### 2026-04-17 — CCA Marketing Punchlist — Visual Parity (8 gaps closed)
- **What:** Closed all 8 visual gaps between replica and Wix original. GAP 1: StickyPrograms component — 3 full-viewport sticky scroll-over sections (Infants/Toddlers → Twos/Threes → Pre-K/Kinder) with split-screen layout and full-bleed background images. GAP 2: SpinningCTA component — spinning sunshine face (7s CSS spin) with girl mascot layered on top, video background, "Where Little Minds Shine" heading. GAP 3: MarqueeBanner component — continuously scrolling "A Parent's Dream Come True" ticker on green bg, used twice on page. GAP 4: Hero kept as video (better than slideshow). GAP 5: Color energy — "Today's Learners" now has blue video overlay, "Why Choose Us" uses green bg with glass-morphism cards, newsletter on green bg, all Apply buttons are rounded-full pills with hover:scale. GAP 6: CSS animations — added `@keyframes marquee/float` to globals.css, increased ScrollReveal offset to 48px, hover lift+scale on pillar cards, floating sunshine in hero. GAP 7: CCA Difference ingredients — colored left borders (green/blue/coral/yellow), numbered badges, generous padding. GAP 8: Section reorder to match original — Hero → Marquee → Today's Learners (blue) → More Than A Preschool → Pillars → Sticky Programs → Why Choose Us → Spinning CTA → Newsletter → Ingredients → Spinning CTA (repeated) → Marquee (repeated) → Final CTA.
- **Where:** `src/components/marketing/StickyPrograms.tsx` · `SpinningCTA.tsx` · `MarqueeBanner.tsx` · `ScrollReveal.tsx` · `PillarCard.tsx` · `ValuePropCard.tsx` · `FeatureRow.tsx` · `SectionHeader.tsx` · `NewsletterForm.tsx` · `src/app/(marketing)/page.tsx` · `src/app/globals.css`
- **Status:** Complete

### 2026-04-17 — CCA Marketing Site Replica — Complete Build
- **What:** Full Next.js marketing site replicating crandallchristianacademy.com Wix site. 16 components, 7 pages (Home, About, Contact, FAQ, Our Team, Blog index, Blog detail), marketing layout with header/footer, 2 API routes (newsletter + contact form), sitemap, robots.txt, JSON-LD structured data (LocalBusiness/Preschool, FAQPage, BlogPosting). 3 Supabase migrations (newsletter_subscribers, blog_posts, staff marketing columns). All "Apply Now" links route to `/enroll` (integrated enrollment form). Framer Motion scroll animations throughout. Video backgrounds with reduced-motion fallback.
- **Where:** `src/app/(marketing)/` · `src/components/marketing/` · `src/app/api/newsletter/` · `src/app/api/contact/` · `src/app/sitemap.ts` · `src/app/robots.ts` · `supabase/migrations/0050-0052` · `src/app/marketing/fonts.css` · `next.config.ts`
- **Status:** Complete

### 2026-04-17 — Project cleanup and reorganization
- **What:** Deleted ~515MB of duplicate folders (CCA/, Preschool Businesses Win/, duplicate logo dir). Archived 6 completed build specs to `docs/build-archives/`. Rewrote CLAUDE.md to be lean and marketing-focused. Established build archive system.
- **Where:** `CLAUDE.md` · `docs/build-archives/` · root cleanup
- **Status:** Complete

### 2026-04-16 — Phase 13B: System enrollment form + application pipeline + appointments
- **What:** System form infrastructure, 7-step enrollment wizard with multi-child repeater, application pipeline (8 stages), Calendly-style appointment booking with availability calculator.
- **Where:** `supabase/migrations/0046-0048` · `src/lib/forms/` · `src/lib/actions/enrollment/` · `src/lib/actions/appointments/` · `src/components/enrollment/` · `src/components/appointments/` · `src/app/(forms)/`
- **Status:** Complete

### 2026-04-15 — Phase 13: Custom fields engine + form builder
- **What:** 18-type custom fields engine, 30+ field type form builder (conversational + document modes), logic engine, e-signatures, Stripe payment, submission pipeline.
- **Where:** `supabase/migrations/0044-0045` · `src/lib/forms/` · `src/components/forms/` · `src/components/custom-fields/` · `src/app/portal/admin/forms/` · `src/app/(forms)/`
- **Status:** Complete

### 2026-04-08 — Phases 1–14: Full platform build
- **What:** Auth, CRUD, check-in, daily reports, staff, billing, messaging, curriculum, CRM, CACFP, expenses, checklists, documents, calendar, surveys, analytics, emergency, compliance, hardware, marketing site. 342 files, 47,897 lines.
- **Where:** Entire `src/` directory. 38 page routes, 141 components, 61 server actions, 21 schemas, 10 API routes.
- **Status:** Complete

### 2026-04-08 — Phase 0: Project init + multi-tenant infrastructure
- **What:** Next.js 16 project, Supabase schema (43 feature areas), CCA seed data, proxy.ts, tenant theming, 28 UI primitives, app shell.
- **Where:** `src/proxy.ts` · `src/lib/tenant/` · `src/lib/supabase/` · `src/components/ui/` · `supabase/migrations/`
- **Status:** Complete

---

## Completed phases summary
Phases 0–14 + 13B built. Portal, platform, forms, enrollment pipeline, and appointments all functional. Marketing site reconstruction is the current active workstream.
