# Crandall Christian Academy — Claude Code project context

## Scope of THIS build

**In scope:** the **CCA Preschool Management Platform** — a from-scratch replacement for CCA's SuiteDash workspace. Build it per `docs/CCA_BUILD_BRIEF.md`, `docs/prompts/CCA_PORTAL_PROMPT.md`, and `docs/BRAND.md`. Goal: the best preschool management platform a small Christian academy could dream of. Phone-first PWA. Apple-grade polish. Every state change auditable. Every notification automated. Every parent able to check in their child in under 10 seconds.

The platform has **three audiences in one repo:**
1. **Marketing site** at `crandallchristianacademy.com` — public-facing enrollment funnel + info pages.
2. **Staff portal** at `portal.crandallchristianacademy.com` — classroom management, attendance, payroll, curriculum, door control, camera feeds.
3. **Parent portal** at `portal.crandallchristianacademy.com` (role-switched) — check-in/out, daily reports, payments, messaging.

Marketing lives under `src/app/(marketing)/`. The portal lives under `src/app/(portal)/`. They share the design system, Supabase client, Tailwind tokens, and `components/ui/*` library.

**Already shipped (do not regress):** nothing yet. This is a greenfield build. But once the marketing site ships first, treat `src/app/(marketing)/` as frozen — same rule as Yes Mamms.

## The bigger picture (one paragraph)

Crandall Christian Academy is a small, faith-based preschool replacing a SuiteDash workspace with a purpose-built Next.js 16 + Supabase platform. The existing SuiteDash instance handles enrollment forms, parent communication, basic invoicing, and staff coordination — all poorly. The new platform models the actual world: Students are first-class entities with medical profiles, allergies, authorized pickups, and classroom assignments. Parents/Guardians are first-class with nested family structures that handle blended families, multiple children, and shared custody. Staff are first-class with credentials, certifications, schedules, payroll, and classroom assignments. Classrooms are first-class with capacity, age ranges, ratio requirements, and daily schedules. The marketing site and the portal share one repo, one design system, and one Supabase project. The portal should feel like the natural second wing of a building whose first wing already exists.

## Required reading (in order, before writing any code)

1. @AGENTS.md — one-paragraph warning: **this is Next.js 16, not the version you were trained on.** Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` before touching any route file. Async `params`/`searchParams`, async `headers()`/`cookies()`, `proxy.ts` (not `middleware.ts`), Turbopack default.
2. @docs/prompts/CCA_PORTAL_PROMPT.md — the kickoff prompt. Orientation, mental model, mandatory v1 features, definition of done. Read this second because it frames everything that follows.
3. @docs/CCA_BUILD_BRIEF.md — **the canonical spec.** Read cover-to-cover including all appendices. Every instruction is binding. The role families, the student/family model, the check-in system, the payment architecture, the staff management, the classroom model, the hardware abstraction layer, the SuiteDash gap analysis, and the build sequence.
4. @docs/BRAND.md — design system. Colors, type scale, motion curves, primitives. The portal **shares** the design system with the marketing site, it doesn't re-skin it.
5. @docs/CCA_MARKETING_BRIEF.md — the marketing site brief. Read it to understand what already exists in `src/` so you reuse (`globals.css`, `lib/cn.ts`, `lib/motion.ts`, `lib/supabase/*`, `components/ui/*`) instead of duplicating.
6. @docs/COPY.md — marketing copy. Not directly relevant to portal pages, but grounds you in the school's voice so any portal-side strings (empty states, emails, error messages, onboarding microcopy) stay on-brand.
7. @BUILD_LOG.md — the living build log (see §Build log below). Read the top before starting any new task so you know what exists and how it's wired.

## Principles that override defaults

- **Beauty wins ties.** If it would not ship from Apple, redo it.
- **Phone-first.** A parent dropping off a toddler at 7:15 AM must succeed on every critical flow one-handed on a cracked iPhone.
- **Server Components by default.** `'use client'` only when genuinely required.
- **Every Server Action validates with Zod server-side.** Not just on the client. Every. Single. One.
- **RLS is not optional.** Every table Claude Code creates has RLS enabled before the migration is committed, and the policy is proved by an attempted-unauthorized-write test.
- **Every state change writes to `audit_log`.** If you can't figure out where the audit call goes, you don't understand the state change yet.
- **No new dependencies without a one-line justification in the PR.**
- **SuiteDash is strictly read-only forever.** Never click anything in SuiteDash that could fire an email or parent notification. Export via Claude in Chrome, read paths only. See the SuiteDash migration appendix in `CCA_BUILD_BRIEF.md`.
- **Never duplicate a primitive.** If it exists in `src/components/ui/*`, extend it. If the extension would break marketing, fork with a portal-specific name and document it in the build log.
- **Ask before inventing schema.** If a table isn't in `CCA_BUILD_BRIEF.md`, stop and propose it in the build log before writing the migration.
- **Child safety is non-negotiable.** Every check-in/check-out is audited. Authorized pickup lists are enforced. Photo verification on pickup. No child record is ever hard-deleted. Allergy information is surfaced at every touchpoint where a child interacts with food or activities.

## Build log — the system that keeps you intelligent

Every non-trivial build unit is recorded in `BUILD_LOG.md` at the repo root. The log is not documentation; it's a **grep-friendly index** that lets any future Claude Code session orient itself in under 60 seconds without re-reading the world. Keep it lean — one or two sentences per entry plus file/line anchors.

### When to append to the build log

Append a new entry when you:
- Add a new route under `src/app/(portal)/`.
- Add a new Server Action, notification template, cron job, webhook, or Edge function.
- Create or materially change a Supabase migration.
- Introduce a new shared primitive, helper, or lib module.
- Wire a new third-party integration (Stripe, Twilio, door control, camera, Resend).
- Make a design-or-data decision that deviates from `CCA_BUILD_BRIEF.md` — explain why in one sentence and link the section you deviated from.

Do **not** append for: routine refactors, typo fixes, lint cleanups, or anything fully derivable from `git log`.

### Entry format (copy this exactly)

```md
### <YYYY-MM-DD> — <short title>
- **What:** <one sentence describing the unit of functionality>
- **Why:** <one sentence — usually a section reference from CCA_BUILD_BRIEF.md>
- **Where:** `path/to/file.ts:LINE` · `path/to/other.tsx:LINE` · `supabase/migrations/00NN_*.sql`
- **How to extend:** <one sentence — "add a new classroom? edit enum at schemas/classroom.ts:42 and the capacity form at components/portal/admin/classroom-editor.tsx:88">
- **Grep anchors:** `SEARCH_TOKEN_1`, `SEARCH_TOKEN_2` <-- unique strings you deliberately placed so future sessions can find this unit in one ripgrep>
- **Spec ref:** `CCA_BUILD_BRIEF.md §<section>`
```

### Grep anchors — non-negotiable

Every non-trivial function, action, component, and migration includes a short, unique, searchable comment tag above its declaration in the source. Format: `// @anchor: cca.<area>.<unit>` (e.g. `// @anchor: cca.checkin.qr-scan`, `// @anchor: cca.classroom.ratio-check`). These are the search keys that make the build log useful. Keep anchors stable across refactors; rename only with a build-log entry.

### Build log header (keep at the top of `BUILD_LOG.md`)

```md
# Crandall Christian Academy — Build log

> Read the top 50 lines of this file before starting any new task. Entries are newest-first. Each entry points at file:line anchors and unique grep tokens so you can orient in under a minute without re-reading specs.
>
> Append format: see `CLAUDE.md` §"Build log".

## Index by area
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
- Food program / CACFP → grep `@anchor: cca.food-program`, `@anchor: cca.cacfp`
- Expenses & accounting → grep `@anchor: cca.expenses`, `@anchor: cca.accounting`
- Child portfolios → grep `@anchor: cca.portfolio`, `@anchor: cca.assessment`
- Enrollment CRM & leads → grep `@anchor: cca.leads`, `@anchor: cca.crm`
- Surveys → grep `@anchor: cca.survey`
- Carline / pickup queue → grep `@anchor: cca.carline`
- Drop-in scheduling → grep `@anchor: cca.dropin`
- Subsidies → grep `@anchor: cca.subsidy`
- Analytics & reporting → grep `@anchor: cca.analytics`, `@anchor: cca.reports`
- Checklists → grep `@anchor: cca.checklist`
- Document vault → grep `@anchor: cca.documents`
- Calendar & events → grep `@anchor: cca.calendar`, `@anchor: cca.events`
- Emergency & lockdown → grep `@anchor: cca.emergency`, `@anchor: cca.lockdown`
- Professional development → grep `@anchor: cca.training`, `@anchor: cca.pd`
- Texas DFPS compliance → grep `@anchor: cca.dfps`, `@anchor: cca.compliance`
- Newsfeed → grep `@anchor: cca.newsfeed`
- Migration (SuiteDash) → grep `@anchor: cca.migration`

---
```

### Rules for using the log

1. **Read first.** New task starts by reading the top of `BUILD_LOG.md` and `rg "@anchor: cca.<area>"` on whatever you're about to touch.
2. **Never trust the log alone.** Memories in the log can drift. Confirm file:line anchors still exist before acting. If an anchor is stale, update it in the same commit.
3. **One entry per logical unit.** A migration plus its role helpers plus its RLS policies is one entry.
4. **Keep it under ~150 lines of active entries.** When it exceeds that, archive the oldest third to `BUILD_LOG_ARCHIVE.md` without dropping grep anchors.
5. **Deviations are first-class.** If you disagree with `CCA_BUILD_BRIEF.md`, write a `### DEVIATION` entry with the why and a link back to the spec section.

## Where things live (fast map)

- Routes: `src/app/(portal)/{admin,staff,parent,api}/...` — see `CCA_BUILD_BRIEF.md` for the full target tree.
- Marketing routes: `src/app/(marketing)/...` — frozen once shipped.
- Shared UI primitives: `src/components/ui/*`.
- Portal-specific UI: `src/components/portal/*`.
- Server Actions: `src/lib/actions/<domain>/*.ts`.
- Zod schemas: `src/lib/schemas/*.ts` (shared between client forms and server actions).
- Supabase clients: `src/lib/supabase/{server,browser,ssr}.ts`.
- Role/permission helpers: `src/lib/auth/permissions.ts`.
- Notification dispatcher: `src/lib/notifications/send.ts`.
- Hardware abstraction: `src/lib/hardware/{door-control,camera}.ts`.
- Database migrations: `supabase/migrations/NNNN_*.sql` — numbered, never edited after merge.
- Generated types: `src/lib/database.types.ts` — **do not hand-edit.** Regenerate via the Supabase MCP `generate_typescript_types` tool after every migration.

## When you are uncertain

- Stop. Re-read the relevant `CCA_BUILD_BRIEF.md` section.
- If it's still ambiguous, write a `### OPEN QUESTION` entry in `BUILD_LOG.md` and keep moving on unblocked work.
- Never silently improvise schema, permissions, payment flows, or anything that touches child safety.
