# Claude Code prompt — Preschool Businesses Win platform build

> Paste this into a fresh Claude Code session inside the project directory. This is a **multi-tenant white-label preschool management SaaS platform**. One Next.js 16 repo. Four surfaces: platform site (`preschool.businesses.win`), tenant marketing sites (custom domains), tenant staff portal, tenant parent portal. First tenant: Crandall Christian Academy. Pushes to `main` auto-deploy via Vercel.

---

You are building **Preschool Businesses Win** — a multi-tenant preschool management SaaS platform at `preschool.businesses.win`. The first tenant is Crandall Christian Academy (CCA). Goal: the best preschool management platform in the market. Phone-first. Apple-grade polish. Every state change auditable. Every parent notification automated. Every child's safety non-negotiable. Multi-tenant from day one.

## Required reading (in order, before writing any code)

1. `AGENTS.md` — **this is Next.js 16**, not the version you were trained on. Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. Async `params`/`searchParams`, async `headers()`/`cookies()`, `proxy.ts` (not `middleware.ts`), Turbopack default.
2. `docs/PLATFORM_ARCHITECTURE.md` — **the multi-tenant architecture.** Tenant resolution, RLS patterns, theming, app shell, feature flags, storage isolation, user model. Read this before touching any table or component.
3. `docs/CCA_BUILD_BRIEF.md` — **the canonical feature spec.** 48 sections covering every feature area. Every instruction is binding. Read cover-to-cover. Pay special attention to §44 (custom fields), §45 (form builder), §46 (system enrollment form), §47 (application pipeline), and §48 (appointment booking) — these are the newest and most ambitious features.
4. `docs/OVERNIGHT_BUILD_PLAN.md` — **the phased build plan.** 20 continuous phases (0–18 + 13B). This is your execution order. Follow it phase by phase. Do not skip phases. Do not stop between phases. Log every phase completion in `BUILD_LOG.md`.
5. `docs/BRAND.md` — design system tokens (implemented via CSS variables, overridable per tenant).
6. `docs/CCA_MARKETING_BRIEF.md` — the CCA marketing site brief.
7. `docs/COPY.md` — CCA marketing copy (tenant-specific content, not hardcoded).
8. `BUILD_LOG.md` — read the top before starting any task.

## Execution model

**Follow `docs/OVERNIGHT_BUILD_PLAN.md` phase by phase.** That document is the master execution plan. It tells you exactly what to build in what order, which migrations to run, which files to create, and what to verify before moving on. The build brief and architecture docs are the spec — the overnight plan is the playbook.

Do not ask for permission between phases — just keep going. If something fails, fix it and continue. Log every phase completion in `BUILD_LOG.md`.

## Mental model — read this twice

- A **Student** is a first-class entity. Each child has their own record with enrollment status, classroom assignment, medical profile (allergies, medications, dietary restrictions, emergency protocols), authorized pickup list, immunization records, and developmental milestones. A student can be enrolled in multiple programs (full-day, half-day, before/after care, summer camp).
- A **Family** is a first-class entity that groups one or more parents/guardians with one or more students. **Blended families are first-class.** A child can belong to multiple families (mom's household + dad's household). A parent can have children across multiple families. Billing can be split across households. Custody schedules can restrict which parent can pick up on which days.
- A **Parent/Guardian** is a first-class entity with contact info, billing profile, communication preferences, and an authorized-pickup flag per student. Not every guardian is a parent — grandparents, nannies, and authorized pickups are modeled distinctly.
- A **Staff Member** is a first-class entity with credentials, certifications (CPR, First Aid, early childhood education), background check status, classroom assignments, schedule, time clock, and payroll profile.
- A **Classroom** is a first-class entity with a name, age range, capacity, required staff-to-student ratio (per state licensing), assigned lead teacher, assigned aides, daily schedule template, and curriculum track.
- A **CCA Admin** is a first-class entity that can see everything, configure everything, and impersonate any role with a typed justification and audit trail.

If a feature requires bending one of these into another's shape, the model is wrong. Stop and rethink.

**THIS IS A MULTI-TENANT PLATFORM.** Every table has `tenant_id`. Every RLS policy includes tenant isolation. Every component uses CSS variables for theming. Every sidebar item checks feature flags. The platform is the product — CCA is the first customer.

**Hard rules baked into the schema:**
- Never store a child's SSN, medical record number, or any identifier that constitutes PHI beyond what's needed for allergy/medication management at the school.
- Never allow a check-out to a person not on the authorized pickup list for that student on that day (custody-schedule-aware).
- Never show one family's billing details to another family, even if they share a child.
- Always surface allergy information when a child is checked in, on daily report screens, and on any food/activity planning page.

## Stack — install exactly these

```bash
npm i @supabase/ssr @supabase/supabase-js @tanstack/react-table react-hook-form @hookform/resolvers stripe @stripe/stripe-js date-fns @internationalized/date zustand zod resend motion lucide-react @sentry/nextjs qrcode @types/qrcode recharts workbox-precaching workbox-routing
```

Do **not** install: Prisma, Drizzle, Remix loaders, Recoil, MUI, Ant Design, Chakra, tRPC, shadcn/ui, Radix, framer-motion (legacy). Ask before adding any new dependency, with a one-line justification.

> **Supabase Edge Functions** should be used in place of Next.js API routes for: heavy reporting queries (§33), scheduled jobs that need connection pooling, CACFP claim generation (§25), accounting exports (§26), and any background job that runs longer than Vercel's function timeout.

## Roles (the spine of the app)

`cca_owner`, `cca_admin`, `lead_teacher`, `teacher`, `aide`, `parent`, `guardian`, `applicant_parent`. There is **no** generic "admin" role — always say which kind. RLS depends on it. See §4 of the brief for the membership table and impersonation rules.

All roles are **tenant-scoped** via `user_tenant_memberships`. A user can have different roles in different tenants.

## Family model (read this thrice)

- `families` is a household unit. It has a billing profile, a mailing address, and one or more `family_members`.
- `family_members` is a join table: `(family_id, user_id, relationship_to_students, is_primary_contact, is_billing_responsible, can_pickup_default)`.
- `student_family_links` connects students to families: `(student_id, family_id, custody_schedule jsonb, billing_split_pct)`.
- A student with two divorced parents has **two family records**, each with their own billing split, their own authorized pickups, and their own custody schedule that determines which days each parent can pick up.
- `authorized_pickups` is a per-student, per-family list: `(student_id, family_id, person_name, relationship, phone, photo_path, id_verified_at, valid_from, valid_to)`. Can include non-family-members (grandma, nanny, carpool parent).
- Billing is **per-family, not per-student.** A family with three enrolled children gets one invoice. If a child is shared across two families, each family's invoice reflects their `billing_split_pct`.

## Non-negotiables

- **Multi-tenant first.** Every table has `tenant_id`. Every query is tenant-scoped. Every component uses CSS variables.
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
- **CSS variables, never hardcoded colors.** If you type a hex color in a component, you're breaking multi-tenancy.
- **Feature flags gate everything.** `hasTenantFeature('cacfp')` before rendering CACFP sidebar items, pages, or server actions.

## Hard rules

- **SuiteDash is read-only forever.** Never click anything in SuiteDash. Every action there triggers a real parent/staff email. URL navigation and exports only.
- **Never store PHI beyond allergies/medications/dietary needs required for child safety at the school.**
- **Never allow check-out to unauthorized person.** The system must refuse and alert admin.
- **Never show Family A's billing to Family B, even if they share a child.**
- **Never hard-delete a student record.** Soft delete only, with 7-year retention for licensing compliance.
- **No new dependencies without a one-line justification.**
- **Never duplicate a primitive.** If it exists in `src/components/ui/*`, extend it.

## When you're done

- `npm run build` clean, `npm run lint` clean, `npm run test` (Vitest) green, `npm run e2e` (Playwright) green
- Stripe test-mode end-to-end smoke test passes
- Push to `main` so Vercel deploys; reply with the preview/production URL
- Smoke-test the enrollment → portal flow: submit an enrollment application on the marketing site, watch it appear in admin's application queue in under 5 seconds, approve it, verify the magic-link onboarding email arrived, complete onboarding as the new parent, check in a child, receive a daily report push notification, make a tuition payment.

If anything in `CCA_BUILD_BRIEF.md`, `PLATFORM_ARCHITECTURE.md`, `BRAND.md`, or `CCA_MARKETING_BRIEF.md` is unclear or contradicts itself, **stop and ask Skylar** before guessing. This is the operational backbone of a real school — children's safety and parents' trust depend on getting it right.
