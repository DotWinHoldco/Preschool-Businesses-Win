# Preschool Businesses Win — Overnight Build Plan
**For: Claude Code**
**Last updated: 2026-04-10**
**Status:** EXECUTE THIS. Do not stop until every phase is complete.

> This is a continuous, phased build plan. Each phase builds on the previous one. Do not ask for permission between phases — just keep going. If something fails, fix it and continue. Log every phase completion in `BUILD_LOG.md`.

> **Required reading before starting:** `CLAUDE.md` → `PLATFORM_ARCHITECTURE.md` → `CCA_BUILD_BRIEF.md` → `BRAND.md` → `CCA_MARKETING_BRIEF.md`

---

## PHASE 0: Project initialization + multi-tenant infrastructure
**Estimated: 30–45 minutes**

### 0.1 — Initialize Next.js 16 project
```bash
npx create-next-app@latest . --typescript --tailwind --app --turbopack --src-dir
```
- Verify Next.js 16 installed (check `package.json`)
- Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Create `src/proxy.ts` (NOT middleware.ts — Next.js 16 uses proxy.ts)

### 0.2 — Install all dependencies
```bash
npm i @supabase/ssr @supabase/supabase-js @tanstack/react-table react-hook-form @hookform/resolvers stripe @stripe/stripe-js date-fns @internationalized/date zustand zod resend motion lucide-react @sentry/nextjs @vercel/flags qrcode @types/qrcode recharts workbox-precaching workbox-routing
```

### 0.3 — Create Supabase project
- Use the Supabase MCP to create the project (or connect to existing)
- Region: us-east-1
- Name: preschool-business-solutions

### 0.4 — Create Vercel project
- Link to GitHub repo
- Auto-deploy on push to main
- Configure custom domains later

### 0.5 — Environment variables
Set in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
SENTRY_DSN=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### 0.6 — Tenant infrastructure migrations
Run these via Supabase MCP `apply_migration`:
- `0001_tenants.sql` — tenants, tenant_domains, tenant_branding, tenant_features tables (from PLATFORM_ARCHITECTURE.md §3)
- `0002_user_tenant_memberships.sql` — user-to-tenant mapping (from PLATFORM_ARCHITECTURE.md §9)
- `0003_platform_subscriptions.sql` — SaaS billing (from PLATFORM_ARCHITECTURE.md §10)
- `0004_set_tenant_context_function.sql` — `set_tenant_context()` RPC function

### 0.7 — Seed CCA as first tenant
- `0099_seed_cca.sql` — insert CCA tenant, domains, branding, all feature flags enabled (from PLATFORM_ARCHITECTURE.md §11)

### 0.8 — Core lib files
Create these foundational files:
- `src/proxy.ts` — domain → tenant resolution (PLATFORM_ARCHITECTURE.md §4)
- `src/lib/tenant/resolve.ts` — tenant lookup + caching
- `src/lib/tenant/context.ts` — React context for tenant config
- `src/lib/tenant/features.ts` — `hasTenantFeature()` helper
- `src/lib/tenant/branding.ts` — fetch + cache tenant_branding
- `src/lib/theme/inject-tenant-theme.tsx` — CSS variable injection (PLATFORM_ARCHITECTURE.md §5)
- `src/lib/supabase/server.ts` — tenant-aware server client (PLATFORM_ARCHITECTURE.md §6)
- `src/lib/supabase/browser.ts` — tenant-aware browser client
- `src/lib/supabase/admin.ts` — service role client
- `src/lib/cn.ts` — `cn()` utility (clsx + twMerge)
- `src/lib/motion.ts` — motion presets (from BRAND.md)

### 0.9 — Global styles + app shell
- `src/app/globals.css` — all colors as CSS variables, Tailwind v4 config, typography scale (from BRAND.md)
- `src/app/layout.tsx` — root layout: fonts, TenantThemeProvider, metadata from tenant config
- `src/app/(marketing)/layout.tsx` — marketing shell: header + footer with tenant branding
- `src/app/(portal)/layout.tsx` — portal shell: sidebar + topbar (feature-flag-aware)
- `src/app/(platform)/layout.tsx` — DotWin platform shell

### 0.10 — Shared UI primitives
Build the `components/ui/*` library (all using CSS variables):
- `button.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio.tsx`
- `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`
- `badge.tsx`, `avatar.tsx`, `skeleton.tsx`, `spinner.tsx`
- `table.tsx` (with @tanstack/react-table integration)
- `form.tsx` (react-hook-form + zod integration)
- `toast.tsx`, `alert.tsx`
- `tabs.tsx`, `accordion.tsx`
- `calendar-widget.tsx`, `date-picker.tsx`
- `file-upload.tsx`, `image-upload.tsx`
- `search-bar.tsx`, `command-palette.tsx`

**VERIFY:** `npm run build` passes. `npm run lint` clean. Push to main.

---

## PHASE 1: Auth, roles, permissions + portal shell
**Estimated: 45–60 minutes**

### 1.1 — Auth migrations
- `0005_profiles.sql` — user profiles with tenant_id
- `0006_roles_permissions.sql` — role definitions, RLS helper functions

### 1.2 — Auth implementation
- `src/lib/auth/permissions.ts` — `canUser('admin', 'create:student')` helper. Checks role + tenant + feature flags.
- `src/app/(portal)/login/page.tsx` — email/password + magic link
- `src/app/(portal)/auth/callback/route.ts` — auth callback
- Sign-up flow (for new parent accounts from enrollment)
- Role-based redirect after login (admin → dashboard, parent → my-children, staff → my-classroom)

### 1.3 — Portal layout + navigation
- `src/components/portal/sidebar.tsx` — feature-flag-aware sidebar. Icons from lucide-react. Sections: Dashboard, Students, Families, Classrooms, Check-in, Attendance, Daily Reports, Staff, Billing, Messaging, Curriculum, Food Program, Expenses, Enrollment, Calendar, Documents, Checklists, Surveys, Analytics, Emergency, Compliance, Settings. Each section only renders if feature flag is on AND user role has access.
- `src/components/portal/topbar.tsx` — user menu, notifications bell, tenant name, search
- `src/components/portal/mobile-nav.tsx` — bottom tab bar for phone (Check In, Daily Reports, Messages, Menu)
- Dashboard pages: admin, staff, parent (each with role-appropriate widgets)

### 1.4 — Impersonation
- Admin can impersonate any user in their tenant. Red banner, typed justification, audit logged. Never extends to payments.

**VERIFY:** Login as admin, staff, parent. Sidebar renders correct items per role. Feature flags hide/show sections. Push to main.

---

## PHASE 2: Core data model — students, families, classrooms
**Estimated: 60–90 minutes**

### 2.1 — Student migrations + CRUD
- `0007_students.sql` — students table with tenant_id, medical profiles, allergies, immunizations, authorized pickups. All per CCA_BUILD_BRIEF.md §5.2.
- Student CRUD pages: list, detail/edit, create
- Student quick-card component (§41)
- Universal search bar (§41)
- Student timeline view
- Entity notes (§41)

### 2.2 — Family migrations + CRUD
- `0008_families.sql` — families, family_members, student_family_links with custody_schedule and billing_split_pct
- Family CRUD pages: list, detail/edit, create
- Blended family support: a child linked to multiple families
- Family dashboard with relationship visualization (§41)
- Family notes

### 2.3 — Classroom migrations + CRUD
- `0009_classrooms.sql` — classrooms with capacity, age_range, ratio requirements
- `0010_dfps_ratios.sql` — Texas DFPS Chapter 746 ratio tables (§39)
- Classroom CRUD pages: list, detail/edit, create
- Roster management
- Ratio compliance indicator (using real Texas ratios)

### 2.4 — Authorized pickups
- Authorized pickup list per student per family
- Photo field for each pickup person
- ID verification tracking

### 2.5 — RLS policies for all new tables
- Tenant isolation on every table
- Admin: full access within tenant
- Staff: read students/families in their assigned classrooms
- Parents: read only their own family's students

**VERIFY:** Create a student, assign to a family, assign to a classroom. Verify RLS blocks cross-family reads. Verify ratio indicator works with Texas DFPS numbers. Push to main.

---

## PHASE 3: Check-in / check-out system (THE CENTERPIECE)
**Estimated: 60–90 minutes**

### 3.1 — Check-in migrations
- `0011_check_in.sql` — check_in_records, health_screenings

### 3.2 — Check-in flows (CCA_BUILD_BRIEF.md §7)
- QR code generation per student (displayed in parent app)
- QR scan → student lookup → health screening questions → allergy acknowledgment (if severe/life-threatening) → check-in confirmed
- PIN fallback (parent enters family PIN)
- Staff manual check-in
- Under 10 seconds target

### 3.3 — Check-out flows
- Authorized pickup verification: scan parent QR or enter PIN → verify against authorized pickup list → custody schedule check (is this person allowed today?) → photo verification for non-parent → check-out confirmed
- Hard block on unauthorized pickup (not a soft warning — HARD BLOCK + admin alert)

### 3.4 — Carline / pickup queue (§30)
- Parent "I'm here" button
- Classroom teacher notification
- Queue board for staff
- Ordered release → triggers check-out

### 3.5 — Kiosk mode
- Full-screen, auto-return to scan screen after 15s inactivity
- Admin toggle in settings

### 3.6 — Offline capability
- Service worker caches student QR data
- Check-ins queue locally during outage
- Background sync when connectivity returns

**VERIFY:** End-to-end: parent checks in child via QR → health screen → allergy ack → confirmed. Check out via authorized pickup. Block unauthorized pickup. Carline queue works. Push to main.

---

## PHASE 4: Attendance + daily reports + educator tools
**Estimated: 60–90 minutes**

### 4.1 — Attendance migrations + dashboard
- `0012_attendance.sql` — attendance records (append-only with amendments)
- Real-time who-is-here board per classroom
- Ratio compliance indicator (auto-computed every 15 min via cron)
- Absent/late alerts to parents

### 4.2 — Daily reports (§8 + §42)
- `0013_daily_reports.sql` — daily_report_entries (meals, naps, diapers, activities, mood, milestones, photos)
- Staff entry: quick-entry toolbar (+Meal, +Nap, +Diaper, +Activity, +Photo, +Note, +Incident)
- Batch operations ("everyone napped 12:00–2:00")
- End-of-day review checklist
- Parent view: beautiful timeline with photos
- Push notification when published

### 4.3 — Teacher "My Day" view (§42)
- Daily itinerary with schedule timeline
- Activity completion tracking from lesson plan
- Classroom roster with allergy badges
- Parent prep checklists

### 4.4 — Incident reports
- Structured incident form
- Parent notification
- Admin notification
- Photo documentation

**VERIFY:** Log attendance for a classroom. Create daily report entries. Verify batch operations. Parent sees timeline. Push to main.

---

## PHASE 5: Staff management + time clock + PD
**Estimated: 45–60 minutes**

### 5.1 — Staff migrations
- `0014_staff.sql` — staff profiles, certifications, background_checks, schedule, time_clock_entries, pto_requests

### 5.2 — Staff CRUD + scheduling
- Staff profile management (credentials, certs, background checks)
- Schedule builder with ratio preview
- Classroom assignment management

### 5.3 — Time clock
- Clock in/out with optional geofence
- Break tracking
- Overtime calculation
- Payroll export CSV (ADP, Gusto, QuickBooks format)

### 5.4 — PTO management
- Request/approval flow
- Balance tracking
- Calendar integration

### 5.5 — Professional development tracker (§38)
- `0015_training.sql` — training records, requirements, goals
- Training hour logging
- Texas DFPS annual minimum tracking
- Topic distribution analysis
- Inspection-ready compliance report

**VERIFY:** Create staff, set schedule, clock in/out, request PTO, log training hours. Payroll export generates valid CSV. Push to main.

---

## PHASE 6: Payments + billing (THE MONEY)
**Estimated: 90–120 minutes**

### 6.1 — Billing migrations
- `0016_billing.sql` — invoices, line_items, payments, payment_methods, discounts, credits, tuition_agreements, application_fees

### 6.2 — Stripe integration
- Tenant Stripe Connect setup (each tenant connects their own Stripe account)
- Stripe subscriptions for recurring tuition
- ACH preferred, card fallback
- Payment method management (parent can switch ACH ↔ card)

### 6.3 — Billing features (§12 + §40)
- Application fees (collected during enrollment)
- Registration fees (on enrollment approval)
- Supply fees (per-semester)
- Auto-recurring tuition billing
- Split billing across households (blended families)
- Sibling/staff/military/church discounts
- Late fee automation with configurable grace period
- Failed payment workflow (Smart Retries → escalating emails)
- Credits and debits management
- Refund processing
- Tuition agreements / contracts (e-sign, stored in document vault)
- Processing fee pass-through (configurable per payment method)
- Parent billing portal: view subscriptions, payment history, update payment method, tax statements

### 6.4 — Invoicing
- Auto-generated invoices from subscriptions
- Manual ad-hoc invoices
- Invoice PDF generation
- Email delivery
- Payment tracking and reconciliation

### 6.5 — Annual tax statements
- Dependent-care FSA-compatible statements
- Auto-generated for each family
- PDF export

### 6.6 — Stripe webhook handler
- `src/app/api/webhooks/stripe/route.ts`
- Handle: payment_intent.succeeded, payment_intent.payment_failed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted

**VERIFY:** End-to-end Stripe test mode: create subscription → generate invoice → parent pays → receipt issued → payment recorded. Split billing works. Late fee calculates. Tax statement generates. Push to main.

---

## PHASE 7: Messaging + newsfeed + notifications
**Estimated: 45–60 minutes**

### 7.1 — Messaging migrations
- `0017_messaging.sql` — conversations, messages, message_templates, newsfeed_posts, newsfeed_reactions

### 7.2 — Messaging system (§11 + §43)
- Direct messaging (parent ↔ staff, parent ↔ admin, staff ↔ staff)
- Classroom channels
- Broadcast (school-wide)
- Staff-only channels
- Photo/file sharing
- Urgent flag with push override
- Read receipts
- Threaded replies
- Scheduled messages
- Template library
- Parents cannot message other parents (privacy enforcement)

### 7.3 — Newsfeed (§43)
- School-wide and per-classroom activity stream
- Post types: announcement, photo, shoutout, event recap, reminder
- Reactions (heart, celebrate, thanks)
- Pinnable posts

### 7.4 — Notification dispatcher
- `src/lib/notifications/send.ts` — unified dispatcher
- Channels: in-app, push (VAPID), email (Resend), SMS (Twilio)
- Priority levels: normal, high, critical
- Template system (Resend React email templates)
- All notification templates from CCA_BUILD_BRIEF.md §13 notification table
- Email digest (daily for parents who don't check the app)

**VERIFY:** Send a message between parent and teacher. Broadcast to classroom. Push notification received. Email delivered via Resend. Push to main.

---

## PHASE 8: Curriculum + portfolios + assessments
**Estimated: 45–60 minutes**

### 8.1 — Curriculum migrations
- `0018_curriculum.sql` — lesson_plans, activities, activity_library, learning_standards
- `0019_portfolios.sql` — portfolio_entries, portfolio_media, learning_domains, developmental_assessments, assessment_ratings

### 8.2 — Curriculum features (§10)
- Weekly lesson plan editor per classroom
- Faith component field (for faith-based tenants)
- Activity library with learning standards alignment
- Staff log which activities were completed
- Optional parent visibility

### 8.3 — Child development portfolios (§27)
- Observation capture (photo/video + narrative + learning domain tags)
- Learning domain frameworks pre-loaded (Texas Pre-K Guidelines, NAEYC, Head Start ELOF, custom)
- Learning stories (rich narrative format)
- Portfolio timeline per student
- Daily report → portfolio bridge (promote entries with one tap)

### 8.4 — Developmental assessments (§27)
- Periodic assessment form (quarterly)
- Rate each domain with evidence links
- Progress reports (auto-generated PDF with charts)
- Parent portfolio view (entries with `parent` visibility)

**VERIFY:** Create lesson plan. Log activity completion. Create observation with photo + domain tags. Generate progress report PDF. Push to main.

---

## PHASE 9: Enrollment CRM + pipeline
**Estimated: 30–45 minutes**

### 9.1 — CRM migrations
- `0020_leads.sql` — enrollment_leads, lead_activities, lead_automations, tours

### 9.2 — Lead management (§28)
- Lead capture (auto from enrollment form, manual entry, walk-in)
- Kanban pipeline board (drag-and-drop)
- Lead detail with activity timeline
- Tour scheduling with calendar integration
- Automated follow-up email sequences
- Lead scoring (age match, availability, sibling, church, referral, geography)
- Conversion tracking and funnel reporting

### 9.3 — Enrollment pipeline (§15)
- Marketing form → enrollment_applications → admin review
- Triage scoring
- Approve → creates family + parent + student + classroom assignment
- Waitlist with position tracking
- Application fee collection (Stripe)
- Application → lead linkage (full journey visible)

**VERIFY:** Submit enrollment form on marketing site. Lead auto-created. Appears in pipeline. Approve → parent onboarding email sent. Push to main.

---

## PHASE 10: CACFP food program + expense tracking + subsidies
**Estimated: 45–60 minutes**

### 10.1 — Food program migrations
- `0021_food_program.sql` — meal_menus, meal_service_records, cacfp_claims, cacfp_claim_lines

### 10.2 — CACFP features (§25)
- Menu planner with USDA food component validation
- Allergy-aware meal recording
- Bulk meal recording (one-tap for whole classroom)
- CACFP claim generator (monthly report)
- Kitchen prep view
- Meal-to-daily-report sync

### 10.3 — Expense tracking migrations + features (§26)
- `0022_expenses.sql` — expense_categories, expenses, expense_receipts, accounting_exports
- Expense entry with receipt photo capture
- Recurring expenses
- Budget vs actual dashboard
- QuickBooks Online CSV export
- Xero CSV export
- Classroom P&L
- Financial dashboard

### 10.4 — Subsidy tracking (§32)
- `0023_subsidies.sql` — subsidy_agencies, family_subsidies, subsidy_attendance_records, subsidy_claims
- Agency management
- Student subsidy enrollment
- Attendance-to-subsidy sync
- Mixed-funding invoices
- Claim generation
- Reconciliation dashboard

**VERIFY:** Create menu, record meals, generate CACFP claim. Create expense, generate QuickBooks export. Configure subsidy, generate claim. Push to main.

---

## PHASE 11: Checklists + document vault + calendar
**Estimated: 45–60 minutes**

### 11.1 — Checklists (§34)
- `0024_checklists.sql` — checklist_templates, checklist_items, checklist_assignments, checklist_responses
- Template builder (onboarding, re-enrollment, field trip, staff hire)
- Auto-assignment on entity creation
- E-signature pad component
- Parent/staff checklist view
- Admin completion tracking dashboard
- Deadline enforcement with reminders

### 11.2 — Document vault (§35)
- `0025_documents.sql` — documents table with entity-scoping, versioning, expiry
- Entity-scoped storage (student, family, staff, school)
- Document types with metadata
- Version tracking
- Expiry dashboard
- E-signature collection
- Inspection prep mode
- Bulk download (zip)
- Checklist integration (uploads auto-file)

### 11.3 — Calendar + events (§36)
- `0026_calendar.sql` — calendar_events, event_rsvps, event_sign_ups
- School calendar (monthly/weekly/agenda views)
- Event types: closure, holiday, field trip, special event, chapel, parent night, staff meeting
- RSVP + volunteer sign-ups
- Field trip management (auto-generate permission slip checklists)
- Closure day management (suppress attendance expectations)
- Recurring events
- Billing integration (paid events charge to family invoice)

**VERIFY:** Create checklist, assign to family, complete items with e-signature. Upload document, verify expiry tracking. Create calendar event, RSVP. Push to main.

---

## PHASE 12: Surveys + drop-in + analytics
**Estimated: 45–60 minutes**

### 12.1 — Surveys (§29)
- `0027_surveys.sql` — surveys, survey_questions, survey_responses, survey_answers
- Survey builder (drag-and-drop questions)
- Question types: rating, NPS, multiple choice, free text, yes/no
- Targeted distribution
- Anonymous option
- NPS tracking over time
- Results dashboard with charts
- Action items from results

### 12.2 — Drop-in scheduling (§31)
- `0028_drop_in.sql` — drop_in_availability, drop_in_bookings
- Availability calendar (computed from capacity minus enrolled)
- Parent booking flow
- Capacity enforcement
- Cancellation policy
- Drop-in billing
- Recurring drop-ins

### 12.3 — Advanced analytics (§33)
- `0029_analytics.sql` — saved_reports, report_exports
- Executive dashboard (enrollment, revenue, expenses, attendance, ratio, staff hours)
- Revenue analytics (trend, by program, by classroom, per student, projected)
- Enrollment analytics (pipeline funnel, capacity utilization, churn analysis)
- Attendance analytics (rate by classroom, patterns, peak times)
- Staff analytics (labor cost, hours, overtime, cert status)
- Financial analytics (P&L by classroom, budget vs actual, cash flow, AR aging)
- Compliance scorecard
- Custom report builder
- Scheduled report delivery via email (Supabase Edge Function cron)

**VERIFY:** Create survey, distribute, submit response, verify NPS calculation. Book a drop-in day, verify capacity enforcement. Load analytics dashboard with test data. Push to main.

---

## PHASE 13: Hardware + emergency + compliance
**Estimated: 45–60 minutes**

### 13.1 — Door control (§14 of CCA_BUILD_BRIEF)
- `src/lib/hardware/door-control.ts` — adapter interface
- HTTP adapter for smart locks (August, Yale, Kisi, Brivo)
- Unlock from app, auto-lock timer, access log
- Role-based access rules enforced server-side
- Door access log table

### 13.2 — Camera feeds (§14)
- `src/lib/hardware/camera.ts` — adapter interface
- ONVIF-compliant IP camera adapter
- HLS.js stream display
- Snapshot, motion events, bookmarks
- Admin-only live feeds, staff see assigned classroom only

### 13.3 — Emergency system (§37)
- `0030_emergency.sql` — emergency_events, emergency_actions, reunification_records
- One-tap lockdown button (behind confirmation)
- Door auto-lock, camera auto-record, attendance snapshot
- All-channel broadcast (push + SMS + email)
- Real-time update timeline
- All-clear resolution
- Reunification mode (identity verification + child release logging)
- Drill mode (tagged as drill, required for Texas licensing)
- Post-incident report PDF

### 13.4 — Texas DFPS compliance (§39)
- `0031_compliance.sql` — compliance_standards, compliance_checks, inspection_records
- Chapter 746 ratio engine (age-specific tables pre-seeded)
- Minimum standards checklist (digitized Chapter 746)
- Inspection prep mode (readiness report across all categories)
- Deficiency tracker
- Auto-generated compliance reports

**VERIFY:** Door unlock command logs correctly. Camera stream renders via HLS.js. Emergency lockdown fires notification in under 60 seconds. Ratio check uses Texas-specific numbers. Push to main.

---

## PHASE 14: Marketing site (CCA as first tenant)
**Estimated: 60–90 minutes**

### 14.1 — Marketing pages (per CCA_MARKETING_BRIEF.md)
Build all marketing pages using tenant branding + CCA content:
- Homepage with hero, program cards, testimonials, CTA
- Programs page (Infants, Toddlers, 2s, 3s, Pre-K, Private Kinder)
- About page (mission, staff, facility)
- Contact page with form
- Enrollment wizard (multi-step form → enrollment_applications → triggers lead + application)

### 14.2 — Marketing components
- Hero section with video background (CCA videos from `CCA ASSETS/`)
- Program cards with animations
- Testimonial carousel
- FAQ accordion
- Newsletter signup (Resend)
- SEO metadata, sitemap, robots.txt, Open Graph images

### 14.3 — Enrollment form
- Multi-step wizard matching SuiteDash form fields: parent info, student info (name, DOB, class selection), parent goals/expectations
- Application fee collection (Stripe Payment Intent)
- Confirmation email (Resend)
- Auto-creates lead in CRM pipeline

**VERIFY:** Marketing site renders at tenant's domain. All pages responsive (375px, 768px, 1440px). Enrollment form submits, creates lead + application, collects fee. Lighthouse score > 90. Push to main.

---

## PHASE 15: PWA + push + kiosk + service worker
**Estimated: 30–45 minutes**

### 15.1 — PWA setup
- `public/manifest.webmanifest` — brand theme color from tenant config, icons from tenant branding
- Workbox service worker configuration
- Offline shell for check-in screen
- Background sync queue for check-ins, attendance, daily report entries
- iOS install prompt component

### 15.2 — Web Push (VAPID)
- Push subscription management
- Push notification delivery
- Notification preferences per user (which channels: push, email, SMS)

### 15.3 — Kiosk mode
- Full-screen check-in mode
- Auto-return to scan screen after 15s inactivity
- Admin toggle in settings

### 15.4 — Touch optimization
- 48px minimum touch targets everywhere
- Bottom action bar on phone
- Swipe gestures where appropriate

**VERIFY:** PWA installs on iOS and Android. Push notification received. Kiosk mode works on tablet. Offline check-in queues and syncs. Lighthouse PWA = 100. Push to main.

---

## PHASE 16: Migration + audit + polish
**Estimated: 45–60 minutes**

### 16.1 — SuiteDash migration scripts (§19)
- `scripts/import-suitedash/` with idempotent loaders
- Each loader: reads from `exports/suitedash/{entity}/{id}.json` → writes to new schema → records in `legacy_suitedash_ids`
- Run order: students → families → family_members → classrooms → classroom_assignments → staff → enrollment_history → billing_history
- `--dry-run` flag on every loader
- Migration dashboard at `/portal/admin/migration`

### 16.2 — Audit log viewer
- `src/app/(portal)/admin/audit-log/page.tsx`
- Filterable by: entity type, action, user, date range
- Immutable, append-only

### 16.3 — Accessibility pass
- WCAG 2.2 AA compliance
- `aria-live` regions for check-in confirmations, attendance changes
- Keyboard-only flows: check in, record attendance, publish daily report, make payment
- Screen-reader pass on critical flows
- Reduced motion respected

### 16.4 — i18n wiring
- All user-facing strings through `t()` helper
- Not translated yet (v2) but structure is in place
- Spanish is priority second language

### 16.5 — Security review
- No PHI beyond child safety requirements
- COPPA compliance (no data from children directly)
- Encryption at rest (Supabase AES-256), sensitive columns with pgcrypto
- TLS everywhere, HSTS
- 2FA for admin (WebAuthn optional), required for payroll export and bulk data export
- Rate limiting in proxy.ts
- Photo storage in private buckets with signed URLs

### 16.6 — Sentry integration
- Error tracking configured
- Synthetic error in preview deploy
- Performance monitoring

### 16.7 — Final Lighthouse pass
- Every page: mobile (375px), tablet (768px), desktop (1440px)
- PWA score = 100
- Performance > 90
- Accessibility > 90
- No console warnings, no hydration mismatches

**VERIFY:** Migration scripts run with `--dry-run` clean. Audit log captures all state changes. Lighthouse scores pass. `npm run build` zero warnings. `npm run lint` clean. Push to main.

---

## PHASE 17: End-to-end smoke test + deploy
**Estimated: 30 minutes**

### 17.1 — The complete journey test
Run through this entire flow without stopping:

1. Visit CCA marketing site → browse programs → click Apply
2. Fill enrollment form → pay application fee (Stripe test mode) → confirmation
3. Admin portal: see application in queue → approve → parent gets magic-link email
4. Parent: click magic link → complete onboarding checklist (emergency contacts, allergy info, authorized pickups, immunization upload, handbook e-signature)
5. Parent: check in child via QR → health screening → allergy ack → confirmed
6. Staff: see child on attendance board → record daily report entries (meal, nap, activity, photo)
7. Staff: publish daily report → parent gets push notification → parent views beautiful timeline
8. Parent: tap "I'm here" in carline → staff sees queue → releases child → check-out confirmed
9. Admin: view attendance analytics, ratio compliance, financial dashboard
10. Admin: initiate emergency drill → all notifications fire → resolve → post-incident report
11. Admin: generate CACFP claim → export expenses to QuickBooks → view P&L

### 17.2 — Deploy to production
- Vercel preview deploy → smoke test
- Configure custom domains: `crandallchristianacademy.com`, `portal.crandallchristianacademy.com`
- Production deploy
- Verify Stripe webhooks in production mode (but keep in test mode until go-live)
- Verify push notifications in production
- Verify Resend email delivery

### 17.3 — BUILD_LOG.md final entry
```md
### 2026-04-11 — PLATFORM COMPLETE: All 17 phases built
- **What:** Full Preschool Businesses Win platform shipped. Multi-tenant, 43 feature areas, CCA as first tenant.
- **Where:** Entire repo.
- **Grep anchors:** ALL @anchor: tags active.
```

---

## Timing summary

| Phase | Description | Est. time |
|---|---|---|
| 0 | Project init + multi-tenant infra | 30–45 min |
| 1 | Auth, roles, permissions, portal shell | 45–60 min |
| 2 | Students, families, classrooms | 60–90 min |
| 3 | Check-in / check-out (centerpiece) | 60–90 min |
| 4 | Attendance + daily reports + educator tools | 60–90 min |
| 5 | Staff management + time clock + PD | 45–60 min |
| 6 | Payments + billing | 90–120 min |
| 7 | Messaging + newsfeed + notifications | 45–60 min |
| 8 | Curriculum + portfolios + assessments | 45–60 min |
| 9 | Enrollment CRM + pipeline | 30–45 min |
| 10 | CACFP + expenses + subsidies | 45–60 min |
| 11 | Checklists + document vault + calendar | 45–60 min |
| 12 | Surveys + drop-in + analytics | 45–60 min |
| 13 | Hardware + emergency + compliance | 45–60 min |
| 14 | Marketing site (CCA) | 60–90 min |
| 15 | PWA + push + kiosk | 30–45 min |
| 16 | Migration + audit + polish | 45–60 min |
| 17 | End-to-end smoke test + deploy | 30 min |
| **TOTAL** | | **~14–18 hours** |

**Do not stop between phases. This is a continuous overnight build.**
