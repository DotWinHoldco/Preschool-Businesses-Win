# CCA Cowork Session — Memory Bootstrap

> **For Skylar:** This document tells you how to set up the new CCA Cowork session so it has the same intelligence as the Yes Mamms session from day one. Follow these steps in order.

---

## Step 1: Create the Cowork project

1. Create a new folder on your Mac: `~/CrandallChristianAcademy` (or wherever you keep projects).
2. Open Cowork, create a new session, and select that folder.
3. Name the project "CrandallChristianAcademy" or "CCA".

## Step 2: Copy the document set into the folder

Copy every file from this `CCA_OUTPUT/` directory into your new project folder, preserving the structure:

```
CrandallChristianAcademy/
  CLAUDE.md               ← from CCA_OUTPUT/CLAUDE.md
  AGENTS.md               ← from CCA_OUTPUT/AGENTS.md
  BUILD_LOG.md            ← from CCA_OUTPUT/BUILD_LOG.md
  docs/
    CCA_BUILD_BRIEF.md    ← the canonical spec
    CCA_MARKETING_BRIEF.md
    BRAND.md
    COPY.md
    prompts/
      CCA_PORTAL_PROMPT.md  ← the kickoff prompt for Claude Code
```

## Step 3: Prime the Cowork session's memory

In the new Cowork session, paste the following message:

---

**Paste this into the CCA Cowork session:**

> I'm Skylar (skylar@holdco.win). I run DotWin Holdco. This project is Crandall Christian Academy — a preschool in Crandall, TX that we're building a complete management platform for.
>
> Please read CLAUDE.md and all the docs/ files I've placed in this folder. These are the complete specs for the build.
>
> Here's what you need to know about how I work:
>
> 1. **I use Cowork to write specs. Claude Code executes them.** My briefs need to be self-contained, opinionated, and dense — CC has zero prior context.
> 2. **The Arkz pattern for CC build docs:** one self-contained MD file with full SQL/TS, VERIFY queries (not approval gates), single-session execution. Front-load reference data, operational mandates, and "what exists" inventories. Complete code, not stubs.
> 3. **Ship fast, iterate.** CC has full latitude to rewrite/refactor. BUILD_LOG.md + @anchor grep tokens are how we keep track. Records, not gates.
> 4. **SuiteDash is read-only forever.** CCA has a live SuiteDash workspace. We will audit it using Claude in Chrome — never clicking anything that could fire a parent email. URL navigation and exports only.
> 5. **Same stack as Yes Mamms:** Next.js 16, Supabase, Vercel, Stripe, Resend, Twilio. Same build methodology, same document structure.
>
> Please save these working preferences to your memory system, then read through the full document set and confirm you understand the scope of what we're building.

---

## Step 4: Set up the project with Claude Code

Once the Cowork session understands the project, have it help you:

1. **Create the GitHub repo** — `CrandallChristianAcademy` under your GitHub org.
2. **Create the Supabase project** — new project in your Supabase org, us-east-1 region.
3. **Create the Vercel project** — linked to the GitHub repo, auto-deploy on push to main.
4. **Initialize Next.js 16** — `npx create-next-app@latest` with TypeScript, Tailwind v4, App Router.
5. **Install the stack** — see `CCA_BUILD_BRIEF.md` §3 for the full dependency list.
6. **Set up environment variables** — Supabase URL/keys, Resend API key, Stripe keys, etc.
7. **Copy the docs/ folder** into the repo.
8. **First commit** — `git add . && git commit -m "Initial project setup with specs"`

## Step 5: SuiteDash audit (before building the portal)

Same process as Yes Mamms:

1. Open CCA's SuiteDash workspace in Chrome.
2. In the Cowork session, ask: "Let's do a read-only audit of the CCA SuiteDash workspace. Use Claude in Chrome to navigate and capture the data model — what entities exist, how they're structured, what data is in them. **Never click any mutation button.** URL navigation only."
3. The audit should capture:
   - How students/children are modeled (contacts? custom fields?)
   - How families/parents are modeled
   - How classrooms/groups are structured
   - Enrollment forms and their fields
   - Billing/invoicing setup
   - Staff records
   - Any documents, templates, or automations
   - Any outstanding balances to reconcile
4. Write the findings into `CCA_BUILD_BRIEF.md` Appendix A (currently a placeholder).
5. Save key findings to Cowork memory so future sessions have context.

## Step 6: Build sequence

Follow the build sequence in `CCA_BUILD_BRIEF.md` §22:

1. Start with the **marketing site** (it ships first, establishes the design system, and creates the enrollment pipeline).
2. Then build the **portal** using the same approach as Yes Mamms — the kickoff prompt is in `docs/prompts/CCA_PORTAL_PROMPT.md`.

For each major build unit, have Cowork write a CC build doc in the Arkz pattern, then execute it in Claude Code.

---

## Document inventory (what you should have)

| File | Purpose | Yes Mamms equivalent |
|---|---|---|
| `CLAUDE.md` | Project-level instructions for CC | `CLAUDE.md` |
| `AGENTS.md` | Next.js 16 warning | `AGENTS.md` |
| `BUILD_LOG.md` | Living grep-indexed build log | `BUILD_LOG.md` |
| `docs/CCA_BUILD_BRIEF.md` | **The canonical spec** — full data model, features, acceptance criteria | `docs/PORTAL_BUILD_BRIEF.md` |
| `docs/CCA_MARKETING_BRIEF.md` | Marketing site spec | `docs/BUILD_BRIEF.md` |
| `docs/BRAND.md` | Design system tokens, typography, motion, primitives | `docs/BRAND.md` |
| `docs/COPY.md` | All site copy, PASTOR funnel | `docs/COPY.md` |
| `docs/prompts/CCA_PORTAL_PROMPT.md` | Kickoff prompt for CC portal build session | `docs/prompts/PORTAL_PROMPT.md` |
| `MEMORY_BOOTSTRAP.md` | This file — setup instructions | *(didn't exist for YM — learned from that)* |

---

## What made Yes Mamms exceptional (preserve this in CCA)

1. **Dense, opinionated specs.** CC never had to guess. Every table, every field, every RLS policy, every notification template, every acceptance criterion was specified.
2. **The build log + grep anchor system.** Future CC sessions could orient in 60 seconds by reading BUILD_LOG.md and grepping for `@anchor:` tokens.
3. **The Arkz pattern for CC build docs.** One file, full code, verify queries, single-session execution. No multi-branch ceremony.
4. **SuiteDash audit before building.** Understanding what exists (and what's wrong with it) informed every modeling decision.
5. **Shared design system.** Marketing site and portal feel like one product because they share primitives, tokens, and motion language.
6. **The memory system.** Cowork remembered preferences, decisions, and context across sessions — CC got smarter over time, not dumber.
7. **"Beauty wins ties."** The visual bar was set at Apple-grade from day one, not bolted on later.
