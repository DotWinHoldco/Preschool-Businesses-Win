# Preschool Businesses Win — Build Log

> Read the top of this file before starting any task. Newest entries first.

---

### 2026-04-24 — Analytics Install Tab + CAPI config UI

- **What:** Added tabbed navigation on `/portal/admin/analytics/traffic` (Overview / Install & Integrations). New install tab shows the tenant's site key with copy, the pre-filled Wix snippet with copy, an editable allowed-origins list, and form fields for Meta CAPI (pixel id + access token + test event code), GA4 MP (measurement id + API secret), and TikTok Events API (pixel id + access token). Site name + active toggle included.
- **Server action:** `updateAnalyticsSite` — Zod-validated, admin-gated, tenant-scoped. Verifies the target row belongs to the current tenant before updating. Audit-logged with a summary of what was configured (not the secret values).
- **Where:** src/app/portal/admin/analytics/traffic/install/page.tsx · src/app/portal/admin/analytics/traffic/install/install-form.tsx · src/lib/actions/analytics/update-site.ts · src/lib/schemas/analytics-site.ts · src/components/portal/analytics/traffic-tabs.tsx · src/app/portal/admin/analytics/traffic/page.tsx.
- **Status:** Complete · `npx tsc --noEmit` clean · `npx next build` clean · both routes compiled.

---

### 2026-04-24 — Website Analytics + CAPI Pipeline (commit pending)

- **What:** First-party web analytics for tenant marketing sites (Wix Studio for CCA) → `/api/collect` on the PBW app → Supabase → live traffic dashboard at `/portal/admin/analytics/traffic` → Meta/GA4/TikTok CAPI forwarder on a 1-minute Vercel cron. Multi-tenant from day one via `analytics_sites.site_key`.
- **Schema (migration 0064):** `analytics_sites`, `analytics_events`, `analytics_sessions`, `analytics_visitors`, `analytics_consent`, `analytics_ip_salt` + `rotate_analytics_ip_salt()`. Full tenant*isolation + service_all RLS. Seeded CCA site row with site_key `pk_cca*…`.
- **Collector (`/api/collect`):** POST with Zod-validated batch (≤50 events), PUT for consent; CORS enforced against `analytics_sites.origins`; proxy.ts whitelists the path for cross-origin; rate-limited 600/min per IP; salt-rotated SHA-256 IP hashing; lightweight UA parser (no new dep); bot UAs dropped at ingest; Vercel/Cloudflare geo headers captured.
- **Snippet (`/pbw-analytics.js`, `/pbw-consent.js`):** ~6KB, zero deps. Auto page_view + session_start, DNT/GPC respected, TDPSA consent banner, `sendBeacon` on unload, UTM + fbclid/gclid/ttclid capture + stickiness, `[data-track]` capture, auto-detect enrollment CTAs by href/text, MutationObserver rewrites outbound enrollment links with `?_av={visitor_id}` for cross-domain stitch. `window.pbwa.{track,conversion,setConsent}` exposed.
- **Cross-domain stitch:** Enrollment wizard page reads `?_av`, fires `enrollment_started` conversion, passes visitor+session ids into `submitSystemEnrollment`. Server action writes `enrollment_completed` and links `analytics_visitors.application_id`.
- **Dashboard (`/portal/admin/analytics/traffic`):** Server component aggregates events in-range; KPI grid (visitors, page views, conversions, conv rate, sessions, bounce rate, enrollment clicks, avg duration); funnel bar (page view → click → started → completed with drop-off %); daily bar chart; top pages/referrers/UTM sources/UTM campaigns; devices, top countries, top cities. Live "X on site now" pill via `/api/analytics/realtime` polling (10s). Range toggles: today/7d/30d/90d.
- **CAPI forwarder (`/api/cron/analytics-forward`, runs `* * * * *`):** Fans `event_type='conversion'` rows to Meta CAPI, GA4 MP, TikTok Events API using credentials from `analytics_sites` row. Dedupes via `forwarded_to` jsonb. Meta mapping Lead/InitiateCheckout/AddToCart; TikTok CompleteRegistration/InitiateCheckout/ClickButton.
- **Compliance (TX TDPSA):** consent banner with Accept/Opt out, DNT/GPC silent opt-out, SHA-256 salted IP hashing (no raw IPs stored), `analytics_consent` audit trail, `window.pbwaManageConsent()` hook for the privacy page. Bot filter at ingest.
- **Where:** supabase/migrations/0064_analytics_tracking.sql · src/app/api/collect/route.ts · src/app/api/analytics/realtime/route.ts · src/app/api/cron/analytics-forward/route.ts · src/app/portal/admin/analytics/traffic/page.tsx · src/app/portal/admin/analytics/page.tsx · src/app/(enroll)/enroll/page.tsx · src/app/(enroll)/enroll/enrollment-page-client.tsx · src/lib/analytics/{schemas,ingest,site-lookup,ua-parse,ip-hash,emit}.ts · src/lib/cron/analytics-forward.ts · src/lib/actions/enrollment/submit-system-enrollment.ts · src/lib/schemas/enrollment.ts · src/components/portal/analytics/realtime-visitors.tsx · src/proxy.ts · public/pbw-analytics.js · public/pbw-consent.js · docs/WIX_ANALYTICS_INSTALL.md · vercel.json.
- **Status:** Complete · `npx tsc --noEmit` clean · `npx next build` clean · OPTIONS preflight verified 204 with correct CORS headers. Migration applied to oajfxyiqjqymuvevnoui. POST endpoint requires `SUPABASE_SERVICE_ROLE_KEY` (already set in Vercel; local .env.local still has placeholder).
- **Install:** docs/WIX_ANALYTICS_INSTALL.md — paste 2 script tags in Wix Studio → Custom Code → body-end. Site key in dashboard header.

---

### 2026-04-24 — Admin Platform Gap-Close (15 clusters, commit 76f14ad)

- **What:** Closed the gap between admin UI promises and backing tables/actions across the entire admin portal. Replaced stubs, mock data, and dead buttons with real CRUD, persistence, and server-action wiring.
- **Scale:** 1 new migration (0063, 32 new tables with RLS) · 108 new files · 71 modified pages · typecheck + lint clean.
- **Migration 0063 — tables added:** curriculum_activities, learning_standards, lesson_plan_standards, lesson_plan_days, checklist_runs, checklist_run_items, incidents, incident_involved, incident_attachments, dfps_standards, dfps_inspections, dfps_deficiencies, corrective_action_plans, emergency_drills, emergency_muster_points, emergency_contacts, camera_motion_events, access_points, access_point_events, newsfeed_comments, drop_in_sessions, drop_in_pricing, waitlist_offers, application_documents, enrollment_deposits, acceptance_letters, vendors, expense_approvals, expense_receipts, form_response_annotations, family_documents, broadcasts. (pto_balances already existed and was skipped.)
- **Surfaces fixed:**
  - **Curriculum:** lesson_plans with day-body editor, activity library (`/curriculum/activities`), standards library (`/curriculum/standards`), plan detail editor with day cards, activity attachment, standards mapping with coverage levels.
  - **Drop-in:** bookings list, sessions CRUD, pricing CRUD, cancel flow — replaced 100% mock data.
  - **Billing:** invoices list page (new), invoice detail real data + Record Payment / Send Reminder / Void actions, plans CRUD with 14-field editor.
  - **Food/CACFP:** Generate Claim dialog wired, claim lines rendered per claim, menus persist via `saveMealMenus`.
  - **Subsidies:** agency CRUD, claim generate dialog, claim row actions (Submitted / Paid / Cancel).
  - **Settings (8 pages):** profile / billing / branding / check-in / drop-in / features / integrations / notifications all persist to `tenant_settings`.
  - **Compliance:** incidents full workflow (CRUD + detail + involved + attachments + status), DFPS standards CRUD with compliance score, emergency drills / muster points / contacts, cameras CRUD + motion events, doors CRUD + access events.
  - **Audit log:** dynamic filter dropdowns, date range, entity search, CSV export.
  - **Messaging:** broadcast form with recipient resolution (all_parents / all_staff / classroom), reply wired, conversations + messages persist.
  - **Newsfeed:** edit / delete / pin row actions, detail page with comments, soft-delete comments, real comment counts.
  - **Notifications:** row Mark Read + Dismiss, mark-all-read, preferences DB-backed (not localStorage).
  - **Training:** records CRUD + verify + requirements + annual-expiry badge.
  - **Checklists:** template CRUD, items drawer, assign → run creation, per-item completion, tracking dashboard with filters + stats.
  - **Expenses:** vendors CRUD, approval workflow (submit → approve / reject / changes_requested), receipts dialog.
  - **Enrollment:** waitlist offers with expiry, application documents, deposits (set / mark paid / waive), acceptance letters (generate / send / mark accepted), lead edit / delete / convert-to-application / notes, family documents, family billing prefs (via `tenant_settings`), pickup photo/ID verification.
  - **Forms / Surveys:** edit / duplicate / archive / delete row actions, response detail drawer with annotation + delete, CSV export, survey/new wrapper creates a form and redirects, survey detail CSV export + close.
  - **Analytics:** attendance + revenue pages (30-day stats, tables, CSV), report builder Run / Save / Edit / Delete / Schedule with whitelisted data sources.
  - **Staff detail:** certifications CRUD (maps spec keys → actual columns `cert_name`/`issuing_body`/`document_path`), schedule builder, profile editor (employment_type/hourly_rate/bio), PTO balance CRUD (director-gated).
  - **Calendar:** full CRUD via server action, event detail with Edit/Delete, extended form (event_type, scope, classroom, RSVP, permission slip, max_participants, cost_per_child_cents, description).
  - **Attendance:** date + classroom filters, per-classroom breakdown, amend-by-student dialog, day CSV export.
  - **Payroll:** real Calculate → Preview → Submit → Approve → Export CSV. Hours bucketed weekly (Mon-anchored) for OT. Tax placeholders: 10% federal, 7.65% FICA, 0% TX state. Run detail page `/staff/payroll/[runId]` with line items.
- **Status:** Complete · commit `76f14ad` on main, pushed to `DotWinHoldco/Preschool-Businesses-Win`.
- **Deferred (tracked in memory):** Supabase Storage buckets for uploads, OAuth flows (Stripe/QB/Google/Twilio), PDF export, feature-flag middleware enforcement, Resend email dispatch on reminders/broadcasts, DFPS ruleset seed, live HLS/RTSP camera streams, hardware door integration.

---

### 2026-04-20 — Enterprise Hardening: 8 Phases Complete

- **What:** Closed all 14 enterprise-readiness gaps identified in full platform audit.
- **Phase 1 (Security & Observability):** Sentry wired (instrumentation.ts + global-error.tsx + next.config.ts), in-memory rate limiting on 4 public API routes, tenant header validation (throw on missing x-tenant-id), file upload MIME validation + path traversal prevention, marketing APIs multi-tenanted, /api/health endpoint.
- **Phase 2 (Notifications):** sendNotification() now inserts into notifications table for in_app channel, email channel wired to Resend, 10 notification templates.
- **Phase 3 (Cron Jobs):** All 8 cron jobs implemented with real business logic: ratio-check, late-pickup-alert, cert-expiry, attendance-finalize, document-expiry-check, scheduled-messages, email-digest, billing-run. Shared helpers in src/lib/cron/.
- **Phase 4 (Billing):** /api/billing/pay route creates Stripe PaymentIntents, Stripe Elements (PaymentElement) integrated in payment form, webhook handler enhanced with notifications + audit logging.
- **Phase 5 (Performance):** Pagination helper + UI component, 7 admin list pages paginated, N+1 audit loop fix in attendance finalize.
- **Phase 6 (Compliance):** consent_records + access_log tables (migrations 0056-0057), compliance schemas, privacy settings backend (save/load to tenant_settings), consent tracking CRUD, full data export as CSV, family anonymization with confirmation, data retention cron job, privacy page wired to real backend.
- **Phase 7 (Testing):** Vitest configured, 86 tests across 4 test files (billing schemas, check-in schemas, compliance schemas, permissions). All passing.
- **Phase 8 (CI/CD):** GitHub Actions workflow (type-check + lint + test on PR/push to main).
- **Where:** 70+ files across src/, supabase/migrations/, .github/workflows/, vercel.json, package.json
- **Status:** Complete — `npx tsc --noEmit` clean, `npx next build` clean, 86/86 tests passing.

### 2026-04-20 — Portal QA Phase 7: Staff & Parent Portal Real Data Wiring

- **What:** Wired all staff portal (11 pages) and parent portal (20 pages) to real Supabase data. Every page queries the live database — no mock/hardcoded data remains. Staff portal covers dashboard, schedule, daily reports, time clock, messaging, classroom views (overview/attendance/reports/student), calendar, and training. Parent portal covers dashboard, children list/detail/reports/medical, family profile/pickups, messaging, check-in (QR), surveys, billing (dashboard/invoices/subscriptions/payment-methods/tax-statements), calendar, checklists, documents, and drop-in.
- **Where:** 31 files across `src/app/portal/staff/` and `src/app/portal/parent/`. Key patterns: `createTenantAdminClient(tenantId)` for data access, `getSession()` for user identity, proper `family_members→student_family_links→students` chain for parent data, `classroom_staff_assignments` for staff-classroom mapping.
- **Status:** Complete — `npx tsc --noEmit` clean, `npx next build` clean.

### 2026-04-20 — Portal QA Phase 6: Production Wiring + Data Integrity

- **What:** Made every portal admin page display real database data and fixed all known column mismatches between server actions and the live Supabase schema.
- **Bug fixes:** (1) `audit.ts` used `before`/`after` columns — DB has `before_data`/`after_data` (silent failure on every audit write). (2) 52 direct `audit_log` inserts across 30 action files had the same `before`/`after` → `before_data`/`after_data` mismatch. (3) Newsfeed schema/action/component used `title`/`body`/`audience` — DB has `content`/`scope`/`post_type`. Scope enum `all_parents`/`staff` → `school_wide`/`classroom`. (4) `create-staff` inserted names into `staff_profiles` — names live in `user_profiles`. Rewrote to auth→user_profiles→memberships→staff_profiles. (5) `attendance_amendments` had same `before`/`after` column bug + missing `amended_by`. (6) `create-applicant-account` skipped `user_profiles` row creation.
- **Pages wired (23):** dashboard, staff list/detail/payroll, billing, attendance, calendar, messaging, newsfeed, audit-log, analytics (main + financial/staff/compliance/reports), documents, surveys detail, cameras, emergency, compliance, checklists, training, doors (honest empty state).
- **Seeded:** 35+ tables with exactly 1 "Test" row each, all check constraints verified against live DB.
- **Where:** 60+ files across `src/app/portal/admin/`, `src/lib/actions/`, `src/lib/schemas/`, `src/components/portal/`
- **Status:** Complete — `npx tsc --noEmit` clean, `npx next build` clean.

### 2026-04-20 — Portal QA Phases 3–5: CTAs, Stub Pages, Settings

- **What (Phase 3):** Wired dead CTAs across 10 areas: student/family search filters, carline release, subsidies enroll/agency/claims dialogs, billing invoice generation, expenses add/export, leads add dialog, food program menu add/save with toast, messaging broadcast + conversation selection, payroll approve/export CSV.
- **What (Phase 4):** Built 10 stub pages into functional surfaces: Surveys (form list), Calendar (month grid + events), Documents (two-pane folder/file), Checklists (templates + runs), Training (staff × requirement matrix), Analytics (6 KPI cards + sub-routes), Doors (unlock/hold + event log), Cameras (tile grid + detail), Emergency (alert trigger + drills + contacts), Compliance (DFPS scorecard + renewals + inspections).
- **What (Phase 5):** Replaced all hash anchors on settings index with real routes. Built 8 settings sub-pages: Profile, Notifications, Billing, Integrations, Features, Drop-in, Check-in/Kiosk, Data & Privacy. Each with working form + save confirmation. Danger zone wired with export + suspend-with-confirmation.
- **Where:** 48 files across `src/app/portal/admin/` and `src/components/portal/`. Key new components: `calendar-client`, `documents-client`, `checklists-client`, `training-client`, `doors-client`, `cameras-client`, `emergency-client`, `compliance-client`, `danger-zone`. Settings sub-pages at `src/app/portal/admin/settings/{profile,notifications,billing,integrations,features,drop-in,check-in,privacy}/page.tsx`.
- **Status:** Complete — `npx next build` passes, `npx tsc --noEmit` clean.

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

- **What:** Deleted ~515MB of duplicate folders (CCA/, Preschool Businesses Win/, duplicate logo dir). Archived 6 completed build specs to `docs/build-archives/`. Established build archive system.
- **Where:** `docs/build-archives/` · root cleanup
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
