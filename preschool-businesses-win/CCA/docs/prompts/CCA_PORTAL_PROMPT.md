# Claude Code prompt — Crandall Christian Academy preschool management platform

> Copy the entire block below into a fresh Claude Code session inside the CCA project directory. The repo is a **single** Next.js 16 repo. The marketing site lives under `app/(marketing)/` and is served on `crandallchristianacademy.com`. The portal lives under `app/(portal)/` route group and is served on `portal.crandallchristianacademy.com` via Vercel rewrites. Pushes to `main` auto-deploy.

---

You are building the **Crandall Christian Academy (CCA) Preschool Management Platform** — the from-scratch replacement for SuiteDash. Goal: the best preschool management system a small Christian academy could run. Phone-first. Apple-grade polish. Every state change auditable. Every parent notification automated. Every child's safety non-negotiable.

## Read these first, in this order, before writing a single line of code

1. `AGENTS.md` — this is **Next.js 16**, not the version you were trained on. Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` before touching any route file. Async `params`/`searchParams`, async `headers()`/`cookies()`, `proxy.ts` (not `middleware.ts`), Turbopack default, `next/legacy/image` is gone, `images.domains` is gone, AMP is gone.
2. `docs/CCA_BUILD_BRIEF.md` — **the canonical spec**. Read it cover to cover including all appendices. Every instruction is binding. The role families in §4 are the spine. The student/family model in §5 is the heart. The check-in system in §7, the classroom management in §8, the staff/payroll model in §9, the payment architecture in §12, and the hardware abstraction layer in §14 are the centerpieces. The gap analysis in §20A is what separates this from SuiteDash and from Brightwheel/HiMama/Procare. Acceptance criteria in §20.
3. `docs/BRAND.md` — design system. Colors, type scale, motion curves, primitives. The portal **shares the design system** with the marketing site, not just the theme.
4. `docs/CCA_MARKETING_BRIEF.md` — read this even though it's the marketing brief. The portal lives in the same repo and shares `globals.css`, `lib/cn.ts`, `lib/motion.ts`, `lib/supabase/*`, and the entire `components/ui/*` library. Do not duplicate any of it.
5. Whatever lives in `public/assets/photos/` — for staff/child placeholders use brand-palette gradient blocks unless real photos exist.

## Mental model — read this twice

- A **Student** is a first-class entity. Each child has their own record with enrollment status, classroom assignment, medical profile (allergies, medications, dietary restrictions, emergency protocols), authorized pickup list, immunization records, and developmental milestones. A student can be enrolled in multiple programs (full-day, half-day, before/after care, summer camp).
- A **Family** is a first-class entity that groups one or more parents/guardians with one or more students. **Blended families are first-class.** A child can belong to multiple families (mom's household + dad's household). A parent can have children across multiple families. Billing can be split across households. Custody schedules can restrict which parent can pick up on which days.
- A **Parent/Guardian** is a first-class entity with contact info, billing profile, communication preferences, and an authorized-pickup flag per student. Not every guardian is a parent — grandparents, nannies, and authorized pickups are modeled distinctly.
- A **Staff Member** is a first-class entity with credentials, certifications (CPR, First Aid, early childhood education), background check status, classroom assignments, schedule, time clock, and payroll profile.
- A **Classroom** is a first-class entity with a name, age range, capacity, required staff-to-student ratio (per state licensing), assigned lead teacher, assigned aides, daily schedule template, and curriculum track.
- A **CCA Admin** is a first-class entity that can see everything, configure everything, and impersonate any role with a typed justification and audit trail.

If a feature requires bending one of these into another's shape, the model is wrong. Stop and rethink.

**Hard rules baked into the schema:**
- Never store a child's SSN, medical record number, or any identifier that constitutes PHI beyond what's needed for allergy/medication management at the school.
- Never allow a check-out to a person not on the authorized pickup list for that student on that day (custody-schedule-aware).
- Never show one family's billing details to another family, even if they share a child.
- Always surface allergy information when a child is checked in, on daily report screens, and on any food/activity planning page.

## What you're building — mandatory v1 features

Following `CCA_BUILD_BRIEF.md` build sequence (v2.0 — expanded after competitive gap analysis):

### Core platform (§1–§20 of the brief)

1. **Foundations:** route group `app/(portal)/`, Supabase Auth (email/password + magic link + optional WebAuthn for admin), role helpers, RLS policies. `lib/auth/permissions.ts` is the single source of truth for who-can-do-what.
2. **Identity & onboarding:** login, role chooser (staff vs parent for dual-role users), parent self-registration from enrollment form, staff invite flow.
3. **Student CRUD + medical profiles + allergy management + authorized pickup lists + immunization tracking + enrollment status lifecycle.** Plus: universal search, student quick-card, student timeline, entity notes (§41).
4. **Family CRUD + blended family support + custody schedules + billing splits + household groupings.** Plus: family dashboard, relationship visualization, family notes (§41).
5. **Classroom CRUD + capacity management + Texas DFPS ratio compliance (Ch.746 age-specific ratios, §39) + age range enforcement + lead teacher assignment + daily schedule templates.**
6. **Staff CRUD + credentials + certifications + background checks + classroom assignments + availability + time clock.**
7. **Check-in / check-out system** (the centerpiece — see §7). QR code on parent's phone + PIN fallback + staff override. Under 10 seconds for a parent. Geofence optional. Authorized-pickup enforcement. Allergy banner on check-in. Photo verification on check-out to non-parent. Plus: carline / pickup queue (§30).
8. **Attendance dashboard** — real-time who's-here board per classroom. Ratio compliance indicator. Absent/late alerts to parents. Daily attendance reports for state licensing.
9. **Daily reports** — per-child log of meals, naps, diaper changes, activities, mood, milestones. Staff enter throughout the day on phone/tablet. Parents see in their portal with photos. Push notification when report is published. Plus: teacher "My Day" view, daily itinerary, batch operations, end-of-day review, parent prep checklists (§42).
10. **Payments & billing** — Stripe for tuition, fees, and ad-hoc charges. Auto-recurring billing. Split billing across households. Late fee automation. Payment history. Tax receipts. Plus: application fees, registration fees, supply fees, subscription management portal, admin subscription editing, credits/debits, refunds, tuition agreements/contracts, processing fee pass-through, failed payment escalation workflow (§40).
11. **Staff scheduling + time clock + payroll prep** — shift scheduling, clock-in/out (with geofence), break tracking, overtime calculation, payroll export (CSV for ADP/Gusto/QuickBooks), PTO tracking. Plus: professional development + training hour tracker with Texas DFPS compliance (§38).
12. **Messaging** — parent↔staff, parent↔admin, staff↔staff, broadcast announcements. Per-classroom channels. Photo/file sharing. Read receipts. Urgent flag with push override. Plus: newsfeed / activity stream, scheduled messages, message templates, email digest (§43).
13. **Curriculum & lesson planning** — weekly/monthly lesson plans per classroom. Learning standards alignment (state + faith-based). Activity library. Staff can log which activities were completed. Optional parent visibility. Plus: child development portfolios, learning stories, developmental assessments, progress reports (§27).
14. **Door control abstraction layer** — maglock API connector with unlock-from-app, auto-lock timer, access log, role-based access (staff during shift only, admin always, parents during check-in window). Hardware-agnostic interface.
15. **Camera feed abstraction layer** — live feed viewer in admin portal. Clip bookmarking. Motion-event timeline. Hardware-agnostic interface for IP camera systems (ONVIF/RTSP).

### Expanded features (§25–§43 of the brief — competitive advantage layer)

16. **CACFP food program** (§25) — menu planner with USDA food component validation, allergy-aware meal recording, bulk meal logging, CACFP claim generator, kitchen prep view, meal-to-daily-report sync.
17. **Expense tracking + accounting** (§26) — expense entry with receipt capture, recurring expenses, budget vs actual, revenue integration, QuickBooks/Xero CSV export, classroom P&L, financial dashboard.
18. **Enrollment CRM + lead management** (§28) — lead capture from multiple sources, Kanban pipeline board, tour scheduling, automated follow-up sequences, conversion tracking, lead scoring.
19. **Subsidy tracking** (§32) — agency management, student subsidy enrollment, attendance-to-subsidy sync, mixed-funding invoices, claim generation, reconciliation, authorization expiry alerts.
20. **Checklists** (§34) — template builder (onboarding, re-enrollment, field trip), auto-assignment, e-signature collection, deadline tracking, admin completion dashboard.
21. **Document vault** (§35) — entity-scoped storage, document types, version tracking, expiry tracking, e-signature collection, inspection prep mode, bulk download.
22. **Calendar + events** (§36) — school calendar, field trips with permission slips, RSVPs, volunteer sign-ups, closure days, recurring events, billing integration for paid events.
23. **Drop-in / flex scheduling** (§31) — availability calendar, instant booking, capacity enforcement, cancellation policy, drop-in billing, recurring drop-ins.
24. **Parent satisfaction surveys** (§29) — survey builder, NPS tracking, targeted distribution, anonymous option, results dashboard, action items.
25. **Advanced analytics** (§33) — executive dashboard, revenue/enrollment/attendance/staff/financial analytics, compliance scorecard, custom report builder, scheduled report delivery.
26. **Texas DFPS compliance** (§39) — Ch.746 ratio engine with age-specific tables, minimum standards checklist, inspection prep mode, deficiency tracker, compliance reports.
27. **Emergency broadcast + lockdown** (§37) — one-tap lockdown, all-channel blast, door auto-lock, camera auto-record, attendance snapshot, reunification mode, drill logging, post-incident report.
28. **PWA + Web Push** (VAPID), manifest, service worker, offline shell for check-in, install prompt.
29. **Audit log viewer + impersonation** with mandatory typed justification + red banner.
30. **Enrollment pipeline** — marketing site form → application queue → approval → parent onboarding → student record creation → classroom assignment → first-day ready.
31. **SuiteDash migration scripts** (read-only export → idempotent import). Never write to SuiteDash.
32. **Lighthouse pass + accessibility pass + security review.**

## Stack — install exactly these

```bash
npm i @supabase/ssr @supabase/supabase-js @tanstack/react-table react-hook-form @hookform/resolvers stripe @stripe/stripe-js date-fns @internationalized/date zustand zod resend motion lucide-react @sentry/nextjs @vercel/flags qrcode @types/qrcode recharts
```

> `recharts` added for analytics dashboards, financial charts, progress reports, and compliance scorecards.

Do **not** install: Prisma, Drizzle, Remix loaders, Recoil, MUI, Ant Design, Chakra, tRPC, shadcn/ui, Radix, framer-motion (legacy). Ask before adding any new dependency, with a one-line justification.

> **Supabase Edge Functions** should be used in place of Next.js API routes for: heavy reporting queries (§33), scheduled jobs that need connection pooling, CACFP claim generation (§25), accounting exports (§26), and any background job that runs longer than Vercel's function timeout.

## Roles (the spine of the app)

`cca_owner`, `cca_admin`, `lead_teacher`, `teacher`, `aide`, `parent`, `guardian`, `applicant_parent`. There is **no** generic "admin" role — always say which kind. RLS depends on it. See §4 of the brief for the membership table and impersonation rules.

## Family model (read this thrice)

- `families` is a household unit. It has a billing profile, a mailing address, and one or more `family_members`.
- `family_members` is a join table: `(family_id, user_id, relationship_to_students, is_primary_contact, is_billing_responsible, can_pickup_default)`.
- `student_family_links` connects students to families: `(student_id, family_id, custody_schedule jsonb, billing_split_pct)`.
- A student with two divorced parents has **two family records**, each with their own billing split, their own authorized pickups, and their own custody schedule that determines which days each parent can pick up.
- `authorized_pickups` is a per-student, per-family list: `(student_id, family_id, person_name, relationship, phone, photo_path, id_verified_at, valid_from, valid_to)`. Can include non-family-members (grandma, nanny, carpool parent).
- Billing is **per-family, not per-student.** A family with three enrolled children gets one invoice. If a child is shared across two families, each family's invoice reflects their `billing_split_pct`.

## Non-negotiables

- **Server Components by default.** `'use client'` only where genuinely needed.
- **Every server action validates with Zod server-side. Every. Single. One.**
- **RLS verified by attempting an unauthorized read/write in a Vitest test for every table.**
- **Audit log entry for every state change.**
- **Notification fired (or explicitly suppressed with a comment) for every state change a parent or staff member would care about.**
- **WCAG 2.2 AA**, reduced motion respected, keyboard navigation complete.
- **Lighthouse PWA = 100** on production build.
- **Stripe end-to-end test mode green:** enroll student → generate tuition invoice → parent pays → receipt issued → payment reconciled.
- **Sentry receives a synthetic error in preview deploy.**
- **No console warnings, no hydration mismatches.**
- **Child safety above all.** Every check-in/check-out audited. Allergy info surfaced everywhere it matters. Authorized pickup enforced without exception.
- **Beauty wins ties.** Ask "Would Apple ship this? Will a parent using this one-handed while holding a toddler succeed?"

## Hard rules

- **SuiteDash is read-only forever.** Never click anything in SuiteDash. Every action there triggers a real parent/staff email. URL navigation and exports only.
- **Never store PHI beyond allergies/medications/dietary needs required for child safety at the school.**
- **Never allow check-out to unauthorized person.** The system must refuse and alert admin.
- **Never show Family A's billing to Family B, even if they share a child.**
- **Never hard-delete a student record.** Soft delete only, with 7-year retention for licensing compliance.

## When you're done

- `npm run build` clean, `npm run lint` clean, `npm run test` (Vitest) green, `npm run e2e` (Playwright) green
- Stripe test-mode end-to-end smoke test passes
- Push to `main` so Vercel deploys; reply with the preview/production URL
- Smoke-test the enrollment → portal flow: submit an enrollment application on the marketing site, watch it appear in admin's application queue in under 5 seconds, approve it, verify the magic-link onboarding email arrived, complete onboarding as the new parent, check in a child, receive a daily report push notification, make a tuition payment.

If anything in `CCA_BUILD_BRIEF.md`, `BRAND.md`, or `CCA_MARKETING_BRIEF.md` is unclear or contradicts itself, **stop and ask Skylar** before guessing. This is the operational backbone of a real school — children's safety and parents' trust depend on getting it right.
