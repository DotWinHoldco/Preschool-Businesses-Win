# Portal QA Fix Punchlist — v1

> **Source of truth:** Manual QA report on `https://crandallchristian.cc/portal/admin/*` and `/portal/staff/*` (Apr 2026). This doc converts that audit into a single-session, phased build.
>
> **Execution rules (Arkz pattern):**
> - This is self-contained. CC should not need any doc outside this file and the files it already reads in-session.
> - **Records, not gates.** Ship each phase end-to-end before moving on. Log each phase to `BUILD_LOG.md` as you finish it.
> - **CC has full refactor latitude.** If a component needs restructuring to unblock a fix, do it.
> - **Server Components by default.** `'use client'` only where required (inputs, dropdowns, DnD, optimistic UI).
> - **Every mutation = a Server Action** (in `src/lib/actions/<domain>/*`) validated with Zod.
> - **Every list = a Server Component** that reads via `createTenantServerClient()`.
> - **No hardcoded colors.** Use `var(--color-*)` tokens only.
> - **No new dependencies** without a one-line justification in `BUILD_LOG.md`.
> - **Reuse primitives** from `src/components/ui/*`. Never duplicate.
> - **Zod-validate every Server Action input** server-side.
> - **Tenant-scope every query.** `createTenantServerClient()` already applies RLS; never bypass it.
>
> **Orientation first:** before touching code, `cat BUILD_LOG.md | head -30`. Then skim `src/components/portal/sidebar.tsx`, `src/components/portal/topbar.tsx`, `src/components/portal/portal-shell.tsx`, and `src/lib/actions/get-tenant-id.ts` so you understand the shell and tenancy primitives.
>
> **Verify protocol:** after each phase, run the VERIFY block at the end of that phase. If it fails, fix before continuing. If a VERIFY query needs real data and the DB is empty, say so in BUILD_LOG and skip — do **not** fake passing.

---

## Phase map (6 phases, ~1 session each)

| # | Phase | Surface area | Complexity |
|---|-------|-------------|-----------|
| 1 | Shell & Nav | Topbar, sidebar, global search | S |
| 2 | Missing admin CRUD surfaces | 7 surfaces across students/staff/newsfeed/drop-in/curriculum/portfolios/availability | M |
| 3 | Wire dead CTAs | ~15 buttons with existing server actions | M |
| 4 | Build out 10 stub pages | Surveys, Calendar, Documents, Checklists, Training, Analytics, Doors, Cameras, Emergency, Compliance | L |
| 5 | Settings sub-pages | 8 settings sub-routes | M |
| 6 | Verification pass | Build + manual click-through + BUILD_LOG | S |

Ship phases 1→6 in order. Do **not** parallelize across phases in one run — each phase's acceptance criteria depends on the prior.

---

## Shared patterns (read once, reuse everywhere)

**Server action template** (`src/lib/actions/<domain>/<verb>.ts`):
```ts
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/actions/get-tenant-id'

const Schema = z.object({ /* fields */ })

export async function someAction(input: z.infer<typeof Schema>) {
  const parsed = Schema.parse(input)
  const tenant_id = await getTenantId()
  const supabase = await createTenantServerClient()
  const { data, error } = await supabase
    .from('some_table')
    .insert({ ...parsed, tenant_id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/portal/admin/<path>')
  return { ok: true, id: data.id }
}
```

**Dialog/modal** — use `src/components/ui/dialog.tsx` (check it exists; if not, add a minimal shadcn-style dialog). All "Add …" buttons on this punchlist open a dialog with a form, NOT a separate page, unless the surface already has an `/<id>/new` route.

**Toast** — use `src/components/ui/toast.tsx` / `sonner` if present. If no toast primitive, add `sonner` (justification: every mutating CTA needs a confirmation affordance).

**Empty state** — use `src/components/ui/empty-state.tsx` if present; otherwise inline a simple `EmptyState` component and hoist to `ui/` the second time you need it.

**Optimistic UI** — prefer `useOptimistic` for lists where a mutation adds/removes a row. For toggles, optimistic on click.

**Search patterns** — list pages with a text search field should use a client-side filter over server-rendered data for <200 rows (students, families, staff). Beyond that, debounce + server action. For this punchlist, assume <200 and do client-side.

---

## Phase 1 — Shell & Nav

**Goal:** The top bar, sidebar, and global search stop being cosmetic. Every surface in the shell either works or is deliberately hidden.

### 1.1 Topbar — wire the real classroom dropdown

**File:** `src/components/portal/topbar.tsx` and its parent `portal-shell.tsx`.

**Problem:** Topbar classroom `<select>` is only populated if `classrooms` prop is passed — and today it isn't. The dashboard also shows "Butterfly Room / Sunshine Room" placeholders from somewhere (find and remove).

**Fix:**
1. In `portal-shell.tsx` (or wherever `PortalTopbar` is rendered), fetch classrooms server-side:
   ```ts
   const { data: classrooms } = await supabase
     .from('classrooms')
     .select('id, name')
     .eq('is_active', true)
     .order('name')
   ```
   Pass `classrooms={classrooms ?? []}` and `activeClassroomId={cookieStore.get('active_classroom_id')?.value ?? null}`.
2. The selected classroom is a **user preference** — persist to a cookie `active_classroom_id` on change via a server action (`src/lib/actions/classroom/set-active.ts`). Server action sets the cookie then `revalidatePath('/portal', 'layout')`.
3. Grep the codebase for `"Butterfly Room"` and `"Sunshine Room"` — delete any hardcoded placeholders. Real classrooms come from the DB.
4. Wire `onClassroomChange` in topbar to call the server action.

**Downstream:** dashboard widgets that filter by classroom should read the cookie (or accept an `activeClassroomId` prop from the layout) and pass it into their Supabase queries as `.eq('classroom_id', activeClassroomId)` when non-null. For this phase, only update the dashboard's attendance/roster widgets that visibly read this filter.

### 1.2 Topbar — global search

**Problem:** search input does nothing.

**Fix:**
1. Create `src/app/portal/admin/search/page.tsx` — Server Component that reads `?q=` and `?type=` and searches across three tables: `students` (first_name, last_name), `families` (guardian names), `classrooms` (name). Render grouped results with links.
2. Create `src/components/portal/global-search-input.tsx` — client component with Enter handler `router.push(/portal/admin/search?q=${encoded})`. Replace the inline input in `topbar.tsx`.
3. Add a `/` keyboard shortcut to focus the search (nice-to-have; do if time).

### 1.3 Topbar — notifications

**Problem:** bell has no handler.

**Fix:** For this phase, do the minimum useful thing:
1. Create `src/app/portal/admin/notifications/page.tsx` — a Server Component that lists rows from `notifications` table filtered by `user_id = auth.uid()` ordered by `created_at desc`. Mark-read action on click.
2. Make the bell button an `<a href="/portal/admin/notifications">` (or a `Link`). Badge count stays.
3. If the `notifications` table doesn't exist yet, add migration `supabase/migrations/0053_notifications.sql`:
   ```sql
   create table if not exists notifications (
     id uuid primary key default gen_random_uuid(),
     tenant_id uuid not null references tenants(id) on delete cascade,
     user_id uuid not null references auth.users(id) on delete cascade,
     kind text not null,
     title text not null,
     body text,
     link text,
     read_at timestamptz,
     created_at timestamptz default now()
   );
   alter table notifications enable row level security;
   create policy "notifications read own" on notifications for select using (user_id = auth.uid());
   create policy "notifications update own" on notifications for update using (user_id = auth.uid());
   create index notifications_user_idx on notifications(user_id, created_at desc);
   ```
   (Check `supabase/migrations/` for the latest number — use next free integer.)

### 1.4 Topbar — user menu items

**Problem:** "My profile" and "Notification preferences" do nothing.

**Fix:**
1. Wrap both in `<Link href="...">`. Create stub pages that at minimum render the user's info and a form:
   - `src/app/portal/admin/profile/page.tsx` — Server Component. Reads `auth.users`, `user_profiles`. Renders a form with name, avatar (upload to Supabase Storage), email (read-only), phone, timezone. Uses `updateProfile` server action.
   - `src/app/portal/admin/notification-preferences/page.tsx` — Server Component. Toggles for each notification channel (email/SMS/push) × each kind (messages, attendance alerts, billing). Stores in `user_notification_preferences(user_id, kind, channel, enabled)`.
2. Use server actions `src/lib/actions/profile/update-profile.ts` and `.../set-notification-preference.ts`. Zod-validate.

### 1.5 Sidebar — Attendance visibility

**Problem:** QA says "View Attendance" quick action points to `/portal/admin/attendance` but sidebar lacks an Attendance item.

**Reality check:** `src/components/portal/sidebar.tsx` *does* list Attendance — but gated by `featureKey: 'attendance_tracking'`. If CCA's tenant record doesn't have that flag, the item is hidden.

**Fix:**
1. Confirm CCA's tenant feature list with:
   ```sql
   select feature_key, enabled from tenant_features
   where tenant_id = (select id from tenants where slug = 'cca');
   ```
2. If `attendance_tracking` is missing or disabled, add a migration to enable it for CCA + any other first-party tenants, OR upgrade the feature gate logic so core daily features default-on.
3. Regardless: move Attendance to appear directly under Check-in in the Daily section (it already does — keep as-is).

### 1.6 Phase 1 VERIFY

- Navigate to `/portal/admin`. Topbar classroom dropdown shows the 4 real classrooms (Butterfly, Rainbow, Star, Sunshine). No "Sunshine Room" placeholder. Selecting one persists across page reload.
- Type "Ava" into search, press Enter → lands on `/portal/admin/search?q=Ava` with results grouped.
- Click bell → `/portal/admin/notifications` loads.
- Click user menu → My profile → `/portal/admin/profile` loads with real user info.
- Sidebar shows "Attendance" for the cca_owner role.
- `npm run build` passes.

**BUILD_LOG entry format:**
```md
### 2026-04-20 — Portal QA Phase 1: Shell & Nav
- **What:** (one sentence)
- **Where:** (paths touched)
- **Status:** Complete
```

---

## Phase 2 — Missing admin CRUD surfaces

**Goal:** Every page where the audit says "no Add button" or "view-only, no edit" gets the missing surface.

### 2.1 Staff — Add Staff button + create form

**Files:** `src/app/portal/admin/staff/page.tsx`, add `src/app/portal/admin/staff/new/page.tsx`, server action `src/lib/actions/staff/create-staff.ts`.

**Fix:**
1. List page: add a primary `Add Staff` button in the header → links to `/portal/admin/staff/new`.
2. New page: form with fields — first_name, last_name, email, phone, role (select: cca_owner|cca_admin|lead_teacher|teacher|aide), hire_date, classroom_id (optional).
3. Server action `createStaff`:
   - Zod-validate.
   - Create auth user via `supabase.auth.admin.inviteUserByEmail(email)` (use service-role client — see `src/lib/supabase/admin.ts` if present; if not, add).
   - Insert into `staff_members` with `tenant_id`, `user_id`.
   - If role in ADMIN_ROLES, also insert into `tenant_members` with that role.
   - `revalidatePath('/portal/admin/staff')`, `redirect(/portal/admin/staff/${id})`.

### 2.2 Student detail — edit paths

**File:** `src/app/portal/admin/students/[studentId]/page.tsx` and related components.

**Fix:**
1. Add an `Edit` button next to each section (Overview, Classroom, Guardians, Medical, Allergies, Pickup authorizations).
2. Each section's edit should open an in-page dialog or expand an inline editor — don't add 6 new routes. Use a single `student-edit-dialog.tsx` client component that accepts `section: 'overview' | 'classroom' | ...` and renders the matching sub-form.
3. Server actions live in `src/lib/actions/student/`:
   - `update-overview.ts` (name, dob, gender, photo)
   - `assign-classroom.ts` (classroom_id, effective_date)
   - `update-guardians.ts` (array of guardian refs with relationship + primary flag)
   - `update-medical.ts` (notes, providers)
   - `update-allergies.ts` (array)
   - `update-pickup-authorizations.ts` (array)
4. Every action Zod-validates, revalidates the detail path.

### 2.3 Newsfeed — compose

**File:** `src/app/portal/admin/newsfeed/page.tsx` + new `src/components/portal/newsfeed/compose-post.tsx` (client).

**Fix:**
1. Top-of-page `+ New Post` button → opens compose dialog.
2. Dialog fields: title (required), body (textarea, markdown supported), audience (select: all_parents | classroom | admins), classroom_id (if audience=classroom), attachments (image upload via Supabase Storage, optional), pin (boolean).
3. Server action `createNewsfeedPost` in `src/lib/actions/newsfeed/create-post.ts`. Inserts into `newsfeed_posts`. Triggers a notification fan-out (insert one row into `notifications` per targeted user — keep simple, direct insert within the same action; no cron).
4. On the list: each post gets a three-dot menu → Edit, Delete, Pin/Unpin. Wire those to their server actions.

### 2.4 Drop-in — admin surfaces

**File:** `src/app/portal/admin/drop-in/page.tsx` + sub-tabs.

**Fix:** Build three tabs (URL-driven: `?tab=slots|rates|bookings`):
1. **Slots** — weekly availability grid with `+ Add Slot` → dialog (weekday, start_time, end_time, capacity, classroom_id optional, effective_from, effective_to).
2. **Rates** — table of rate rules (applies_to age_range, hourly_rate, minimum_hours, cancellation_window_hours). CRUD.
3. **Bookings** — list of current bookings, filter by date range and classroom, cancel action, mark-no-show action.
4. Server actions under `src/lib/actions/drop-in/` — most already exist (`list-slots`, etc.). Add only what's missing: `create-slot`, `update-slot`, `delete-slot`, `upsert-rate`, `cancel-booking`, `mark-no-show`.

### 2.5 Staff availability editor

**File:** `src/app/portal/admin/appointments/availability/page.tsx`.

**Fix:** Replace the "Use the setStaffAvailability server action…" placeholder with a real UI:
1. Per-staff-member weekly grid (Mon–Sun × 30-minute slots). Click-drag to toggle availability. Shadcn-style.
2. "Overrides" tab — list of date-specific overrides (full-day block, partial availability). CRUD.
3. "Calendar sync" tab — three buttons: Connect Google Calendar, Outlook, CalDAV. Each opens an OAuth flow — **stub** with "Coming soon" toast for this phase unless OAuth apps are already provisioned (check `src/lib/integrations/` first).
4. Server actions: `setStaffAvailability` (already exists per the placeholder copy), `addOverride`, `removeOverride`, `connectCalendarProvider` (stub).

### 2.6 Curriculum — interactivity

**File:** `src/app/portal/admin/curriculum/page.tsx`.

**Fix:**
1. Add header buttons: `+ New Lesson Plan`, `Assign to Classroom`.
2. Lesson plan cards become clickable → `/portal/admin/curriculum/[planId]` detail route with activities, objectives, materials, age_range.
3. Detail page has Edit/Delete.
4. Assign dialog → select plan, select classroom(s), select week/date range. Writes to `curriculum_assignments`.
5. Server actions: `create-plan`, `update-plan`, `delete-plan`, `assign-plan`, `unassign-plan`.

### 2.7 Portfolios — interactivity

**File:** `src/app/portal/admin/portfolios/page.tsx`.

**Fix:**
1. List shows one row per enrolled student with thumbnail grid of recent portfolio entries + count.
2. Click student → `/portal/admin/portfolios/[studentId]` detail with chronological entries.
3. Detail page CTAs: `+ Add Entry` (photo/video/note with date, tags, milestone flag), `Share with Parent`, `Export PDF`.
4. Server actions: `addPortfolioEntry`, `deletePortfolioEntry`, `togglePortfolioShare`, `exportPortfolioPdf` (stub OK for this phase).

### 2.8 Phase 2 VERIFY

- Staff page: `Add Staff` button visible, click creates a user, redirects to detail.
- Student detail: Edit buttons visible on each section; clicking opens a dialog that saves.
- Newsfeed: `+ New Post` opens compose; submitting creates a post visible at the top.
- Drop-in admin: 3 tabs render with data and CRUD works.
- Appointments availability: weekly grid click-drag updates persist after reload.
- Curriculum: `+ New Lesson Plan` dialog creates a plan visible on the list.
- Portfolios: clicking a student opens a detail page; `+ Add Entry` persists.
- `npm run build` passes.
- BUILD_LOG updated.

---

## Phase 3 — Wire dead CTAs

**Goal:** Every button on a non-stub page that did "nothing" now does the right thing. For buttons where a server action already exists, just call it. For buttons where it doesn't, add it.

### 3.1 Students search filter

**File:** `src/app/portal/admin/students/page.tsx` + `src/components/portal/students/student-list.tsx` (split into Server+Client if needed).

**Fix:** make the list a client component that filters over the server-supplied array by first_name, last_name, classroom name. Debounce 150ms. Clear button.

### 3.2 Families search filter

Same pattern as 3.1, over `families` list. Filter by guardian names + child names.

### 3.3 Subsidies — Enroll / Add Agency / Generate Claim

**Files:** `src/app/portal/admin/subsidies/*`.

**Fix:** each button gets a dialog + server action:
- **Enroll** — select student, select agency, enter case_number, start_date, authorized_hours_per_week, copay_amount. `createSubsidyEnrollment`.
- **Add Agency** — name, state, contact_email, contact_phone, billing_format (select: CSV|XML|manual). `createSubsidyAgency`.
- **Generate Claim** — select agency + month + year. Pulls attendance for enrolled children, calculates hours × rate, writes claim row, returns downloadable CSV. `generateSubsidyClaim`.

### 3.4 Leads — Add Lead + DnD

**File:** `src/app/portal/admin/leads/page.tsx` + `src/components/portal/enrollment/lead-pipeline.tsx`.

**Fix:**
1. Wire the existing `Add Lead` button to open a dialog. Fields: parent_first_name, parent_last_name, parent_email, parent_phone, child_name, child_dob, program_interest, source (select), priority (warm|hot|cold). `createLead`.
2. DnD between stage columns — use `@dnd-kit/core` if not already installed (justify in BUILD_LOG: "drag-to-reorder kanban; headless and accessible"). On drop, call `updateLeadStage(leadId, newStage)` server action. Use `useOptimistic` for the move.

### 3.5 Billing — Generate Invoices

**File:** `src/app/portal/admin/billing/page.tsx`.

**Fix:**
1. Click opens a dialog: billing_period (YYYY-MM), families (all|select subset), dry_run toggle.
2. Server action `generateInvoices` (likely exists — grep `src/lib/actions/billing/` first). It iterates active enrollments, applies tuition rules, writes `invoices` rows, and (if not dry_run) sends.
3. Result shown as a summary toast: `N invoices generated, $X.XX total.`.

### 3.6 Expenses — Add + Export

**File:** `src/app/portal/admin/expenses/page.tsx`.

**Fix:**
1. `+ Add Expense` dialog: date, category (select), vendor, amount, memo, receipt_upload. Writes `expenses`.
2. `Export` → POST to an API route `/api/expenses/export` that streams CSV. Download triggered by `<form action="/api/expenses/export" method="get">` or `window.location = url`. Date range filter in the export dialog.

### 3.7 Food Program — Menu Add / Save

**File:** `src/app/portal/admin/food-program/menu/page.tsx`.

**Fix:**
1. `Add` button opens dialog per meal slot (Breakfast/AM Snack/Lunch/PM Snack) × day-of-week, adding items with CACFP component tags (Grain, Protein, Fruit, Vegetable, Milk).
2. `Save Menu` → `saveMenu(menuId, items[])` server action. Toast on success.

### 3.8 Payroll — Approve + Export CSV

**File:** wherever payroll surface lives (grep `payroll`).

**Fix:**
1. `Approve Payroll` opens confirm dialog → `approvePayroll(periodId)` action. Toast.
2. `Export CSV` → link to `/api/payroll/export?period=<id>` API route that returns CSV.

### 3.9 Messaging — conversation click + Send Broadcast

**File:** `src/app/portal/admin/messaging/page.tsx` + `src/components/portal/messaging/*`.

**Fix:**
1. Conversation list items become `<Link href="/portal/admin/messaging/${threadId}">` (or a client click that calls `router.push`). Each thread page renders the message history + a reply input wired to `sendMessage`.
2. `Send Broadcast` — fields: audience (all_parents|classroom|staff), subject, body, channels (email toggle, SMS toggle, in-app toggle). Action `sendBroadcast`. Creates a `broadcast` row + per-recipient `notifications` rows. Toast with count. If form clears on submit but nothing happened, that's the bug — fix the success/failure flow and add error logging.

### 3.10 Carline — Release

**File:** `src/app/portal/staff/carline/page.tsx`.

**Fix:** `Release` button calls `releaseCarlineEntry(entryId)` server action (marks entry as released, records timestamp, moves off queue). Use `useOptimistic` so the row disappears instantly. If action fails, re-add with an error toast.

### 3.11 Phase 3 VERIFY

Click every button listed in Phase 3; each either performs a visible action (optimistic UI or page update) or shows a toast. Run `npm run build`. BUILD_LOG entry.

---

## Phase 4 — Build out 10 stub pages

**Goal:** every page that currently renders only a `<h1>` becomes a usable surface. These are the largest pages; keep each to ~1–2 hours of build time. Defer nice-to-haves; ship the primary path.

For each page below: **list view + primary CTA + detail or dialog**. Everything else is v2.

### 4.1 Surveys — `/portal/admin/surveys`

Already has `[surveyId]/` and `new/` subroutes. Page is blank.

**Build:**
- Server Component list of surveys from `surveys` (grep schema; if missing, use `forms` with a `kind='survey'` flag).
- `+ Create Survey` → `/portal/admin/surveys/new` (already exists).
- Table columns: title, status (draft|active|closed), responses, created_at.
- Row click → `/portal/admin/surveys/${id}` detail with response chart + list.

### 4.2 Calendar — `/portal/admin/calendar`

**Build:**
- Month grid (use a lightweight headless calendar lib if present; else hand-roll a 7×6 grid from `date-fns`).
- Events from `calendar_events`.
- `+ Add Event` dialog: title, date, time_start, time_end, all_day flag, audience, location, notes.
- Event click → edit dialog.
- View toggles: Month | Week | Day (stub Week/Day for v2 if tight — ship Month only with a note).

### 4.3 Documents — `/portal/admin/documents`

**Build:**
- Folder tree left, file list right (simple two-pane).
- `+ Upload` button uploads to Supabase Storage bucket `documents/tenants/<tenant_id>/...`.
- `+ New Folder` creates a row in `document_folders`.
- Row actions: rename, download, move, delete.
- Server actions in `src/lib/actions/documents/`.

### 4.4 Checklists — `/portal/admin/checklists`

**Build:**
- List of checklist templates (opening, closing, monthly compliance, etc.).
- `+ New Template` → dialog: title, frequency (daily|weekly|monthly), items[] (drag to reorder).
- Row click → detail with items CRUD and "assign to staff/classroom" button.
- Separate tab "Runs" = instances of completed/in-progress checklists per day.

### 4.5 Training — `/portal/admin/training`

**Build:**
- Matrix view: staff × required trainings. Each cell shows status (green/yellow/red) based on expiry.
- `+ Add Requirement` → dialog: title, required_for_roles[], cadence (one_time|annual|every_N_months), required_hours.
- `+ Record Completion` → dialog: staff member, training, completion_date, hours, certificate_upload.
- Filters: staff, status (expiring_soon, expired, current).

### 4.6 Analytics — `/portal/admin/analytics`

Already has sub-routes (attendance, compliance, financial, revenue, reports, staff). Main page is blank.

**Build:**
- Top KPI row: enrolled students, staff count, MTD revenue, YTD revenue, open invoices, attendance rate (7d), tours booked (7d).
- Below: 4 cards linking to sub-routes with a mini sparkline each. Use `recharts`.
- Date-range selector top-right; persists to a URL param.

### 4.7 Doors — `/portal/admin/doors`

**Build:**
- Grid of door cards (one per hardware endpoint from `hardware_doors` table).
- Each card: name, status (online|offline|locked|unlocked), last_event, and two buttons: `Unlock (10s)`, `Hold Unlocked`.
- Buttons call `unlockDoor(id, duration)` server action which hits the hardware adapter in `src/lib/integrations/hardware/`.
- Event log panel at bottom — last 50 events (`door_events`).

### 4.8 Cameras — `/portal/admin/cameras`

**Build:**
- Grid of camera tiles (one per `cameras` row).
- Each tile shows thumbnail (from `latest_snapshot_url`) + live stream link (opens in new tab or iframe).
- Click tile → detail view with larger stream + recent events.
- Read-only surface; no admin CRUD in this phase (add later).

### 4.9 Emergency — `/portal/admin/emergency`

**Build:**
- Big red `Trigger Emergency Alert` button → confirm dialog → `triggerEmergencyAlert(type, message)` fans out SMS+push to all staff and (optionally) parents.
- Below: list of drill types (fire, tornado, lockdown, reunification) with `Schedule Drill` and `Start Drill Now` buttons.
- Drill records: date, type, duration, participants, notes.
- Emergency contact list editor at the bottom.

### 4.10 Compliance — `/portal/admin/compliance`

There's already a `dfps-compliance/` folder; reuse its components.

**Build:**
- DFPS compliance scorecard: count of required docs present vs missing, staff training % current, incident reports count (30d), inspections due.
- Checklist widget of upcoming renewals (licenses, trainings, immunizations).
- Link to DFPS reports (existing sub-route).

### 4.11 Phase 4 VERIFY

Load each of the 10 pages. Each renders a functional surface (not just a header). Create one item on each where a CTA exists. Run `npm run build`. BUILD_LOG entry.

---

## Phase 5 — Settings sub-pages

**Goal:** every "Configure →" link on `/portal/admin/settings` goes somewhere real.

### 5.1 Replace hash anchors with routes

**File:** `src/app/portal/admin/settings/page.tsx`.

Update the `settingSections` array so each `href` is a real path:

| Title | New href |
|---|---|
| School Profile | `/portal/admin/settings/profile` |
| Notifications | `/portal/admin/settings/notifications` |
| Billing Configuration | `/portal/admin/settings/billing` |
| Integrations | `/portal/admin/settings/integrations` |
| Feature Flags | `/portal/admin/settings/features` |
| Drop-in Settings | `/portal/admin/settings/drop-in` |
| Check-in / Kiosk Mode | `/portal/admin/settings/check-in` |
| Data & Privacy | `/portal/admin/settings/privacy` |
| Branding | (unchanged) `/portal/admin/settings/branding` |

### 5.2 Build each sub-page

For each, keep it thin. Forms bound to server actions that write to `tenant_settings` (upsert by `tenant_id + key`).

- **profile** — school name, address, phone, tax_id, timezone.
- **notifications** — default email sender name, default SMS sender id, quiet hours start/end.
- **billing** — late fee %, grace period days, accepted payment methods (toggles), processing fee pass-through toggle.
- **integrations** — connect buttons for Stripe Connect, Resend, Twilio, hardware. Each shows current connection status + `Connect` / `Disconnect`.
- **features** — table of features with enable toggles. Writes to `tenant_features`.
- **drop-in** — link to `/portal/admin/drop-in?tab=rates` plus a few global policies (cancellation window, minimum notice).
- **check-in** — QR rotation interval, kiosk auto-logout seconds, health screening question list (CRUD).
- **privacy** — retention policy (days), data export button (triggers `/api/tenants/export` stream), COPPA contact email.

### 5.3 Danger zone

- `Export All Data` → `/api/tenants/export` returning a zip of CSVs.
- `Suspend School Account` → confirm dialog with "type SCHOOL_SLUG to confirm" → action sets `tenants.suspended_at = now()` and signs out all sessions.

### 5.4 Phase 5 VERIFY

Click each "Configure →" on `/portal/admin/settings`. Each loads a distinct sub-page with a working form. Save one change on each; confirm persistence with a page reload. `npm run build`.

---

## Phase 6 — Verification pass

**Goal:** confirm the whole audit is green and log the punchlist as complete.

1. **Full build:** `npm run build` — zero errors, zero warnings we introduced.
2. **Typecheck:** `npx tsc --noEmit`.
3. **Lint:** `npm run lint`.
4. **Manual click-through** (copy of the audit's section list — check each item):
   - [ ] Global: notifications bell, My profile, Notification preferences, search, classroom dropdown all work; Attendance in sidebar.
   - [ ] Students: search filters, student detail has edit buttons per section.
   - [ ] Families: search filters.
   - [ ] Staff: Add Staff button.
   - [ ] Carline: Release works.
   - [ ] Curriculum: Add/Edit/Assign visible.
   - [ ] Food Program: Add + Save Menu work.
   - [ ] Portfolios: per-student detail + Add Entry work.
   - [ ] Billing: Generate Invoices.
   - [ ] Expenses: Add Expense, Export.
   - [ ] Subsidies: Enroll / Add Agency / Generate Claim.
   - [ ] Leads: Add Lead, DnD.
   - [ ] Appointments Availability: editable grid.
   - [ ] Drop-in: 3 tabs, CRUD.
   - [ ] Payroll: Approve, Export.
   - [ ] Messaging: threads clickable, Broadcast sends with toast.
   - [ ] Newsfeed: compose + three-dot menu.
   - [ ] Surveys, Calendar, Documents, Checklists, Training, Analytics, Doors, Cameras, Emergency, Compliance: all functional.
   - [ ] Settings: all 9 cards lead to real sub-pages.
5. **BUILD_LOG.md** — single summary entry:
   ```md
   ### 2026-04-20 — Portal QA Punchlist V1 (all phases)
   - **What:** Fixed everything in PORTAL_QA_FIX_PUNCHLIST.md. Shell/nav now functional (classroom dropdown, search, notifications, user menu). 7 admin CRUD surfaces added (staff, student edit, newsfeed compose, drop-in, availability, curriculum, portfolios). 15 dead CTAs wired. 10 stub pages built out (surveys, calendar, documents, checklists, training, analytics, doors, cameras, emergency, compliance). 8 settings sub-pages created.
   - **Where:** `src/app/portal/admin/**` · `src/components/portal/**` · `src/lib/actions/**` · `supabase/migrations/0053*`
   - **Status:** Complete
   ```
6. **Archive this doc:** move to `docs/build-archives/PORTAL_QA_FIX_PUNCHLIST.md` and remove from active build docs if listed. Replace with nothing unless a V2 punchlist exists.

---

## Out of scope (intentionally deferred)

- Parent portal QA (this pass covers admin + staff only).
- Real OAuth for Google/Outlook/CalDAV calendar sync in Phase 2.5 (stubs OK; flag as TODO in BUILD_LOG).
- Door/camera hardware integration beyond the existing adapter layer.
- PDF generation for portfolios (stub action, real render later).
- Real-time presence indicators and push notifications (notifications table polling is fine for V1).
- Admin CRUD for cameras (read-only this pass).
- Full Week/Day calendar views — Month only.

Flag any out-of-scope items you discover mid-build as `TODO:` lines in the relevant file and add a trailing bullet to the BUILD_LOG entry.

---

## When you hit uncertainty

- If a table/column doesn't exist, add a migration — don't hand-edit existing migrations.
- If a primitive doesn't exist in `ui/`, extend existing ones or add a minimal version in `ui/` (no net-new libraries without justification).
- If a server action exists but doesn't quite fit, extend it — don't fork.
- If you're unsure whether a surface is truly stubbed vs. feature-flagged off, grep `hasTenantFeature` and check `tenant_features` in the DB.
- If a fix would regress Phase 1 of the marketing site, stop and ask — do not break the public marketing pages.
