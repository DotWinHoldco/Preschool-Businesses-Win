# Preschool Businesses Win — Project Context

## What this is

A **multi-tenant white-label preschool management SaaS platform** at `preschool.businesses.win`. First tenant: Crandall Christian Academy (CCA). One Next.js 16 repo, four surfaces (platform site, tenant marketing, staff portal, parent portal).

**Current focus:** CCA marketing site is live at `crandallchristian.cc` — visual parity with original achieved.

## Active build docs (read before writing code)

1. `docs/BRAND.md` — design tokens, typography, color system, motion, component primitives.
3. `docs/COPY.md` — all marketing copy (PASTOR framework, page-by-page).
4. `AGENTS.md` — Next.js 16 breaking changes. Read the upgrade guide before touching routes.
5. `BUILD_LOG.md` — **read the top 20 lines before every task.** This is how you orient.

Only read archived docs (`docs/build-archives/`) when you need to reference the portal schema, platform architecture, or a completed feature spec. Never load them proactively.

## Principles

- **Beauty wins ties.** If Apple wouldn't ship it, redo it.
- **Phone-first.** One-handed on a cracked iPhone at 7:15 AM.
- **Server Components by default.** `'use client'` only when genuinely required.
- **CSS variables, never hardcoded colors.** Multi-tenancy depends on it.
- **No new dependencies without a one-line justification.**
- **Never duplicate a primitive.** Extend `src/components/ui/*`.
- **Every Server Action validates with Zod server-side.**

## Where things live

```
src/app/(marketing)/     ← Marketing site pages (ACTIVE BUILD)
src/app/(forms)/         ← Public form rendering
src/app/portal/          ← Staff/parent/admin portal (built, not active)
src/app/api/             ← API routes, webhooks, cron
src/components/ui/       ← Shared design system primitives
src/components/home/     ← Marketing homepage components
src/components/layout/   ← Header, footer, nav
src/components/enrollment/ ← Enrollment wizard
src/components/portal/   ← Portal components (built, not active)
src/lib/supabase/        ← Tenant-aware Supabase clients
src/lib/actions/         ← Server actions by domain
src/lib/schemas/         ← Zod validation schemas
src/lib/motion.ts        ← Animation presets
src/lib/cn.ts            ← clsx + twMerge utility
public/cca-assets/       ← CCA logos and brand images
public/dotwin-logos/     ← Platform branding
docs/                    ← Active build specs
docs/build-archives/     ← Completed build specs (reference only)
supabase/migrations/     ← Database migrations (numbered, never edited)
```

## Build log protocol

Every completed unit of work gets an entry in `BUILD_LOG.md`. Format:

```md
### YYYY-MM-DD — Short title
- **What:** One sentence.
- **Where:** `path/to/file.ts` · `path/to/other.tsx`
- **Status:** Complete | In progress | Blocked
```

Read the log before starting. Write to the log after finishing. This is how sessions stay coherent.

## Build archive system

When a build phase is **complete** (all acceptance criteria met, verified working):

1. Move its spec doc from `docs/` → `docs/build-archives/`
2. Update this file to remove it from "Active build docs"
3. Log completion in `BUILD_LOG.md`

Archived docs are never deleted — they're reference material for future sessions that need portal/platform context. But they don't load into context by default, keeping sessions fast and focused.

### Currently archived (completed builds)
- `CCA_BUILD_BRIEF.md` — 48-section portal feature spec (Phases 0–14 built)
- `PLATFORM_ARCHITECTURE.md` — multi-tenant architecture, RLS, theming, domain resolution
- `OVERNIGHT_BUILD_PLAN.md` — 20-phase continuous build plan (Phases 0–13B complete)
- `CCA_PORTAL_PROMPT.md` — portal kickoff prompt
- `ENROLLMENT_SYSTEM_PROMPT.md` — system enrollment form + pipeline + appointments
- `FORM_BUILDER_PROMPT.md` — custom fields + form builder
- `CCA_MARKETING_REPLICA.md` — marketing site replica build (16 components, 7 pages, 2 API routes, 3 migrations)
- `CCA_MARKETING_PUNCHLIST.md` — visual parity punchlist (8 gaps: sticky programs, spinning CTA, marquee, color/energy, animations, section reorder, ingredients, hero)

## When uncertain

- Re-read the relevant active doc.
- Check `BUILD_LOG.md` for prior decisions.
- If an archived doc is needed, read only the specific section (grep for anchors).
- Never silently improvise. Ask Skylar.
