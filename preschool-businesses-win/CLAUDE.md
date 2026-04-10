# Preschool Businesses Win — Claude Code project context

## Scope of THIS build

**In scope:** a **multi-tenant white-label preschool management SaaS platform** at `preschool.businesses.win`. The first tenant is Crandall Christian Academy (CCA). Build it per `docs/PLATFORM_ARCHITECTURE.md` (multi-tenancy, theming, domain resolution), `docs/CCA_BUILD_BRIEF.md` (the complete feature spec — 43 sections), `docs/prompts/CCA_PORTAL_PROMPT.md`, and `docs/BRAND.md`.

**THIS IS A MULTI-TENANT PLATFORM.** Every table has `tenant_id`. Every RLS policy includes tenant isolation. Every component uses CSS variables for theming. Every sidebar item checks feature flags. The platform is the product — CCA is the first customer.

The platform has **four surfaces in one repo:**
1. **Platform site** at `preschool.businesses.win` — DotWin branding, pricing, sign-up, platform admin.
2. **Tenant marketing sites** at custom domains (e.g., `crandallchristianacademy.com`) — tenant branding, enrollment funnel.
3. **Tenant staff portal** at `portal.{domain}` — classroom management, attendance, payroll, curriculum, door control, camera feeds.
4. **Tenant parent portal** at `portal.{domain}` (role-switched) — check-in/out, daily reports, payments, messaging.

Routes: `src/app/(platform)/` for DotWin. `src/app/(marketing)/` for tenant marketing. `src/app/(portal)/` for tenant portal. They share the design system, Supabase client, Tailwind tokens, and `components/ui/*` library.

**Logo rules:** DotWin `.win` logos for platform chrome. CCA logos (in `CCA/public/CCA ASSETS/`) for the CCA tenant. See `PLATFORM_ARCHITECTURE.md` §12.

**Already shipped:** nothing yet. Greenfield build.

## Required reading (in order, before writing any code)

1. @AGENTS.md — **this is Next.js 16**, not the version you were trained on. Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. Async `params`/`searchParams`, async `headers()`/`cookies()`, `proxy.ts` (not `middleware.ts`), Turbopack default.
2. @docs/PLATFORM_ARCHITECTURE.md — **the multi-tenant architecture.** Tenant resolution, RLS patterns, theming, app shell, feature flags, storage isolation, user model.
3. @docs/prompts/CCA_PORTAL_PROMPT.md — the kickoff prompt for the portal build.
4. @docs/CCA_BUILD_BRIEF.md — **the canonical feature spec.** 43 sections covering every feature area. Every instruction is binding. Read cover-to-cover.
5. @docs/BRAND.md — design system tokens (implemented via CSS variables, overridable per tenant).
6. @docs/CCA_MARKETING_BRIEF.md — the CCA marketing site brief.
7. @docs/COPY.md — CCA marketing copy (tenant-specific content, not hardcoded).
8. @docs/OVERNIGHT_BUILD_PLAN.md — the phased build plan. Follow this sequence.
9. @BUILD_LOG.md — read the top before starting any task.

## Principles that override defaults

- **Multi-tenant first.** Every table has `tenant_id`. Every query is tenant-scoped. Every component uses CSS variables.
- **Beauty wins ties.** If Apple wouldn't ship it, redo it.
- **Phone-first.** Parent dropping off a toddler at 7:15 AM must succeed one-handed on a cracked iPhone.
- **Server Components by default.** `'use client'` only when genuinely required.
- **Every Server Action validates with Zod server-side.** Every. Single. One.
- **RLS is not optional.** Every table has tenant isolation + role-based policies. Proved by unauthorized-write tests.
- **Every state change writes to `audit_log`.** If you can't figure out where the audit call goes, you don't understand the state change.
- **Feature flags gate everything.** `hasTenantFeature('cacfp')` before rendering CACFP sidebar items, pages, or server actions.
- **No new dependencies without a one-line justification.**
- **SuiteDash is strictly read-only forever.** Never click anything in SuiteDash that could fire an email.
- **Never duplicate a primitive.** If it exists in `src/components/ui/*`, extend it.
- **Child safety is non-negotiable.** Every check-in/check-out audited. Authorized pickups enforced. Photo verification. No hard deletes. Allergy info surfaced everywhere.
- **CSS variables, never hardcoded colors.** If you type a hex color in a component, you're breaking multi-tenancy.

## Build log — the system that keeps you intelligent

Every non-trivial build unit is recorded in `BUILD_LOG.md`. It's a **grep-friendly index** that lets any future Claude Code session orient in under 60 seconds.

### Entry format (copy this exactly)

```md
### <YYYY-MM-DD> — <short title>
- **What:** <one sentence>
- **Why:** <one sentence — section reference>
- **Where:** `path/to/file.ts:LINE` · `path/to/other.tsx:LINE` · `supabase/migrations/00NN_*.sql`
- **How to extend:** <one sentence>
- **Grep anchors:** `SEARCH_TOKEN_1`, `SEARCH_TOKEN_2`
- **Spec ref:** `CCA_BUILD_BRIEF.md §<section>` or `PLATFORM_ARCHITECTURE.md §<section>`
```

### Build log header (keep at the top of `BUILD_LOG.md`)

```md
# Preschool Businesses Win — Build log

> Read the top 50 lines of this file before starting any new task.

## Index by area
- Platform / multi-tenant → grep `@anchor: platform.tenants`, `@anchor: platform.proxy`, `@anchor: platform.theme`
- Auth & roles → grep `@anchor: cca.auth`
- Students & families → grep `@anchor: cca.student`, `@anchor: cca.family`
- Classrooms → grep `@anchor: cca.classroom`
- Check-in / check-out → grep `@anchor: cca.checkin`
- Attendance → grep `@anchor: cca.attendance`
- Staff & payroll → grep `@anchor: cca.staff`, `@anchor: cca.payroll`
- Curriculum & daily reports → grep `@anchor: cca.curriculum`, `@anchor: cca.daily-report`
- Payments & billing → grep `@anchor: cca.billing`
- Notifications & messaging → grep `@anchor: cca.notify`, `@anchor: cca.messaging`
- Door control → grep `@anchor: cca.door`
- Camera feeds → grep `@anchor: cca.camera`
- Allergies & medical → grep `@anchor: cca.medical`
- Enrollment → grep `@anchor: cca.enrollment`
- Audit log → grep `@anchor: cca.audit`
- Application queue → grep `@anchor: cca.applications`
- Food program / CACFP → grep `@anchor: cca.food-program`
- Expenses & accounting → grep `@anchor: cca.expenses`
- Child portfolios → grep `@anchor: cca.portfolio`
- Enrollment CRM & leads → grep `@anchor: cca.leads`
- Surveys → grep `@anchor: cca.survey`
- Carline / pickup queue → grep `@anchor: cca.carline`
- Drop-in scheduling → grep `@anchor: cca.dropin`
- Subsidies → grep `@anchor: cca.subsidy`
- Analytics & reporting → grep `@anchor: cca.analytics`
- Checklists → grep `@anchor: cca.checklist`
- Document vault → grep `@anchor: cca.documents`
- Calendar & events → grep `@anchor: cca.calendar`
- Emergency & lockdown → grep `@anchor: cca.emergency`
- Professional development → grep `@anchor: cca.training`
- Texas DFPS compliance → grep `@anchor: cca.dfps`
- Newsfeed → grep `@anchor: cca.newsfeed`
- Migration (SuiteDash) → grep `@anchor: cca.migration`
```

### Grep anchors — non-negotiable

Format: `// @anchor: platform.<unit>` for platform-level code, `// @anchor: cca.<area>.<unit>` for feature-level code. Keep anchors stable across refactors.

## Where things live (fast map)

- **Tenant resolution:** `src/proxy.ts` + `src/lib/tenant/resolve.ts`
- **Tenant theming:** `src/lib/theme/inject-tenant-theme.tsx` + `src/app/layout.tsx`
- **Feature flags:** `src/lib/tenant/features.ts`
- **Platform routes:** `src/app/(platform)/...`
- **Marketing routes:** `src/app/(marketing)/...`
- **Portal routes:** `src/app/(portal)/{admin,staff,parent}/...`
- **Shared UI primitives:** `src/components/ui/*` (CSS variables, never hardcoded colors)
- **Portal UI:** `src/components/portal/*`
- **Server Actions:** `src/lib/actions/<domain>/*.ts`
- **Zod schemas:** `src/lib/schemas/*.ts`
- **Supabase clients:** `src/lib/supabase/{server,browser,admin}.ts` (tenant-aware)
- **Role/permission helpers:** `src/lib/auth/permissions.ts` (tenant + role + feature-aware)
- **Notification dispatcher:** `src/lib/notifications/send.ts`
- **Hardware abstraction:** `src/lib/hardware/{door-control,camera}.ts`
- **Migrations:** `supabase/migrations/NNNN_*.sql` — numbered, never edited after merge
- **Generated types:** `src/lib/database.types.ts` — regenerate after every migration
- **CCA assets:** `CCA/public/CCA ASSETS/` — tenant-specific logos, images, videos
- **DotWin assets:** `public/dotwin-logos/` — platform branding

## When you are uncertain

- Stop. Re-read the relevant section in `CCA_BUILD_BRIEF.md` or `PLATFORM_ARCHITECTURE.md`.
- If still ambiguous, write a `### OPEN QUESTION` entry in `BUILD_LOG.md` and keep moving.
- Never silently improvise schema, permissions, payment flows, or anything that touches child safety.
- Never hardcode tenant-specific values. If it varies per tenant, it goes in `tenant_branding`, `tenant_features`, or `tenants.settings`.
