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

## PHASE 13: Custom fields + form builder (THE FORM EXPERIENCE)
**Estimated: 90–120 minutes**

> This phase builds two tightly coupled systems: a custom fields engine (§44) and a state-of-the-art form builder (§45). The form builder is Typeform-quality conversational UX + DocuSign-quality e-signatures + Stripe payment integration + dynamic data merge fields — all in one. It must be built before the marketing site (Phase 15) so the enrollment form can use it.

### 13.1 — Custom fields engine (§44 of CCA_BUILD_BRIEF)

**Migration:** `0044_custom_fields.sql`
- `custom_field_entity_types` — pre-seeded with: student, family, staff, classroom, enrollment_application, incident_report, checklist_item
- `custom_fields` — tenant-scoped field definitions with field_key slug, 18 field types, validation_rules jsonb, sort_order, section_label grouping
- `custom_field_options` — options for select/multi_select fields (label, value, color, icon, sort_order)
- `custom_field_values` — typed value storage (value_text, value_numeric, value_boolean, value_date, value_json, value_file_path), one row per entity per field
- RLS: all tables tenant-isolated. Custom field values visible to entity owner (parent sees their family's fields if `is_visible_to_parents = true`).
- Indexes: `(tenant_id, entity_type, entity_id)` on values, `(tenant_id, custom_field_id)` on values

**Admin UI:** `src/app/(portal)/admin/settings/custom-fields/page.tsx`
- List all custom fields grouped by entity type (tabs)
- Create/edit field: label, type, required, searchable, filterable, parent-visible, parent-editable, default value, validation rules, section label
- Drag-to-reorder within entity type
- Preview: shows how the field renders on the entity form
- Archive (soft-delete) with data preservation

**Entity form injection:**
- `src/components/custom-fields/CustomFieldsSection.tsx` — queries custom fields for an entity type and renders them using the standard form pipeline (react-hook-form + Zod)
- Inject at bottom of student, family, staff, classroom, enrollment_application, incident_report forms
- Grouped by `section_label` with collapsible headers
- File/image fields upload to `tenant-{id}-custom-fields/` storage bucket

**Search + filter integration:**
- Fields marked `is_searchable` indexed in universal search (§41)
- Fields marked `is_filterable` appear as filter options in list views (students, families, staff)

**VERIFY:** Create a custom field (text, select, file) on students. Fill value on a student. Verify value persists, displays on student detail, appears in CSV export. Verify searchable field returns in universal search. Verify parent can see/edit parent-visible fields. Push to main.

### 13.2 — Form builder data model (§45)

**Migration:** `0045_form_builder.sql`
- `forms` — tenant-scoped form definitions: title, slug, description, status (draft/published/archived), mode (conversational/document), theme_overrides jsonb, header_config jsonb, footer_config jsonb, background_config jsonb, access_control (public/authenticated/role_restricted/tokenized), custom_css, SEO config
- `form_fields` — field definitions per form: field_key, field_type (30+ types), label, description, placeholder, config jsonb (type-specific), validation_rules jsonb, logic_rules jsonb (visibility conditions + jump logic), prefill_source, sort_order, section_id, page_number
- `form_sections` — section/page grouping with title, description, sort_order, logic_rules
- `form_variables` — named calculated variables with formula and referenced_fields
- `form_responses` — submission records: respondent info, status (draft/in_progress/awaiting_signature/completed/expired), entity linking, IP/user-agent
- `form_response_values` — per-field values with typed columns + signature_data jsonb
- `form_response_drafts` — auto-save drafts for conversational mode resume (token-based)
- `form_signature_requests` — multi-signer workflow: signer_order, status, token, IP, content_hash, timestamps
- `form_submission_actions` — configurable post-submission actions: store, write_entity, create_entity, notify, webhook, stripe_charge, generate_pdf, assign_checklist, update_custom_field
- `form_templates` — platform-level + tenant-level templates (serialized form snapshots)
- RLS: forms owned by tenant. Public forms readable without auth. Responses scoped to tenant + respondent.

### 13.3 — Form builder UI

**Builder page:** `src/app/(portal)/admin/forms/new/page.tsx` and `[formId]/edit/page.tsx`
- Full-screen builder with three panels:
  - **Left:** Field palette (draggable field types organized by category: Text, Choice, Date/Time, Media, Layout, Advanced, Data, Signature)
  - **Center:** Form canvas (WYSIWYG — what you drag is what you see). Drag-to-reorder. Click field to select.
  - **Right:** Field settings panel (appears when field selected): label, placeholder, required, validation, logic rules, prefill source, field-type-specific config
- Mode toggle: Conversational ↔ Document (preserves all field config)
- Section management: create/reorder/delete sections, section-level logic rules
- Variable editor: create named variables with formulas referencing fields
- Theme panel: override tenant defaults (colors, fonts, border radius, field style, background image/video, header/footer config)
- Live preview pane: toggle between phone (375px), tablet (768px), desktop (1440px)
- Save as draft / publish toggle
- Duplicate form, save as template

**Field types to implement (all 30+):**
- Text: short_text, long_text, rich_text, email, phone, url, number, currency
- Choice: single_select_dropdown, single_select_radio, multi_select_checkbox, image_choice, button_group, rating, opinion_scale, nps, yes_no, legal_acceptance
- Date/Time: date, time, datetime, date_range, appointment_slot
- Media: file_upload, image_upload, video_embed, signature_pad
- Layout: section_header, description_block, divider, image_banner, video_banner, spacer
- Advanced: payment_stripe, calculator, hidden_field, address_autocomplete, matrix_grid, ranking, slider
- Data: entity_lookup, custom_field_value, dynamic_select

**Logic engine:**
- `src/lib/forms/logic-engine.ts` — evaluates visibility rules, jump conditions, calculated fields
- Operators: equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty, starts_with, ends_with
- AND/OR groups with nesting
- Jump logic (conversational mode): "If answer is X, skip to question Y"
- Calculated fields: arithmetic + conditionals + field references + aggregation
- Variable system: accumulate values across form, reference in labels/logic/payment amounts

### 13.4 — Form rendering engine

**Conversational mode renderer:** `src/components/forms/ConversationalForm.tsx`
- One question per screen, centered, large typography
- Auto-advance on selection (single_select, yes_no, rating, nps, image_choice, button_group)
- Enter key to advance on text fields
- Arrow keys for option navigation
- Configurable transitions between questions: slide-up (default), fade, zoom, flip. Use Motion library.
- Progress bar (percentage or step count)
- Back button to revisit previous questions
- Keyboard-first, touch-optimized
- Partial save: auto-save to `form_response_drafts` on every field completion

**Document mode renderer:** `src/components/forms/DocumentForm.tsx`
- Multi-section scrollable form
- Sections with headers, grouped fields
- Side-by-side fields on desktop (single column on phone)
- Inline validation on blur
- Sticky submit button on phone
- Section-level conditional show/hide

**Shared components:**
- `src/components/forms/fields/` — one component per field type, all using react-hook-form register/control
- `src/components/forms/FormHeader.tsx` — branded header (logo, title, description, cover image/video)
- `src/components/forms/FormFooter.tsx` — powered-by, legal links, custom content
- `src/components/forms/SignaturePad.tsx` — canvas-based draw pad + type-to-sign toggle. Captures: image data URL, typed name, IP, timestamp, browser fingerprint, content hash (SHA-256 of form data at sign time)
- `src/components/forms/PaymentStep.tsx` — Stripe Elements integration for one-time or calculated payment amounts via tenant's Stripe Connect account
- `src/components/forms/ImageChoice.tsx` — grid of image options with labels, selection animation (scale-bounce + check-mark draw)
- `src/components/forms/DynamicPlaceholders.tsx` — resolves `{{entity.field}}` and `{{custom.field}}` at render time

### 13.5 — Form access + embedding

**Standalone page:** `src/app/(forms)/[tenantSlug]/[formSlug]/page.tsx`
- Beautiful full-page render (no portal navigation chrome)
- Optional site header/footer (from form settings)
- SEO meta tags for shared forms
- Turnstile/reCAPTCHA for public forms

**Embed page:** `src/app/(forms)/[tenantSlug]/[formSlug]/embed/page.tsx`
- Minimal chrome, auto-resizing via postMessage to parent window
- Embed snippet generator in admin form settings

**Inline embed:** `src/components/forms/FormEmbed.tsx`
- React component for embedding forms inside portal pages (e.g., enrollment form in admin review)
- Props: `formId`, `prefillData`, `onSubmit` callback

**Access control middleware:**
- Public: no auth, turnstile spam protection
- Authenticated: redirect to login if not authenticated, capture respondent_user_id
- Role-restricted: check user role against form's `allowed_roles`
- Tokenized: decode signed JWT from URL, prefill fields, validate expiry

### 13.6 — Submission handling + actions

**On-submit pipeline:** `src/lib/forms/submission-handler.ts`
- Execute `form_submission_actions` in sort_order:
  1. **store** — always: write to `form_responses` + `form_response_values`
  2. **write_entity** — update existing entity fields (student, family, staff, etc.) from mapped form fields
  3. **create_entity** — create new enrollment_application, incident_report, etc. from mapped form fields
  4. **notify** — send email/SMS/push to configured recipients with `{{response.field}}` placeholders
  5. **webhook** — POST JSON to external URL with configurable payload mapping
  6. **stripe_charge** — process Stripe charge via tenant Connect account (amount from payment field or calculated variable)
  7. **generate_pdf** — render completed form as branded PDF with signatures, attach to response + optionally email to respondent
  8. **assign_checklist** — trigger checklist assignment (§34) for respondent or linked entity
  9. **update_custom_field** — write specific response values back to custom field values (§44)

**E-signature workflow:**
- Single signer: signature_pad field in form, audit data captured on submit
- Multi-signer sequential: on first signer submit, status → `awaiting_signer_2`, email sent to next signer with tokenized link. Each signer sees read-only form data + their signature field. Repeat until all signed.
- Multi-signer parallel: all signers emailed simultaneously. Form completes when all have signed.
- Audit certificate PDF: generated on completion, attached to response. Contains: all signer details, timestamps, IPs, content hash, sequential event log.

### 13.7 — Form templates + admin experience

**Seed platform-level templates:** 12 templates per §45 of CCA_BUILD_BRIEF (enrollment application, re-enrollment, medical authorization, photo release, field trip permission, incident report, parent survey, staff onboarding, tuition agreement, visitor sign-in, waitlist, contact us).
- Each template is a full form_snapshot (fields, sections, variables, logic, design) stored in `form_templates` with `tenant_id = null` (platform-level).

**Admin responses view:** `src/app/(portal)/admin/forms/[formId]/responses/page.tsx`
- TanStack Table: column per field, sortable, filterable, searchable
- Bulk export: CSV, PDF
- Individual response detail with all values, signature images, audit trail
- Response editing (admin can always edit; respondent can edit if `allow_response_edit` is true before deadline)

**Admin analytics:** `src/app/(portal)/admin/forms/[formId]/analytics/page.tsx`
- Total responses, completion rate, average time to complete
- Drop-off by question (conversational mode) — bar chart showing where users abandon
- Payment revenue collected (if payment field present)
- Response timeline chart

**VERIFY:** Create a conversational form with 10+ fields including image choice, logic jumps, calculated pricing, signature, and payment. Publish. Fill it out on phone — verify auto-advance, animations (60fps), and payment processes. Verify standalone page renders beautifully. Verify embed auto-resizes. Verify multi-signer sequential workflow (signer 1 → email → signer 2 → complete). Verify PDF generation with signatures. Verify custom field merge placeholders resolve. Verify partial save + resume works. Verify admin response table + analytics. Push to main.

---

## PHASE 13B: System enrollment form + application pipeline + appointment booking
**Estimated: 90–120 minutes**

> This phase uses the form builder from Phase 13 to create the platform's flagship system enrollment form, builds a multi-step application pipeline, and adds a Calendly-style appointment booking system. See `docs/prompts/ENROLLMENT_SYSTEM_PROMPT.md` for the full standalone prompt.

### 13B.1 — System form infrastructure (§46 of CCA_BUILD_BRIEF)

**Migration:** `0046_system_forms.sql`
- Add `is_system_form`, `system_form_key`, `parent_form_id`, `instance_label`, `fee_enabled`, `fee_amount_cents`, `fee_description` to `forms` table
- Add `is_locked`, `is_system_field` to `form_fields` table
- System form registry in `src/lib/forms/system-forms.ts`
- System form seeding logic (runs on tenant creation)
- Form instance spawning: deep-copy form with independent settings
- Admin UI: "Create Instance" button, fee toggle, instance management

### 13B.2 — Enrollment application system form (§46)

Build the 7-step wizard enrollment form as the first system form:
- Step 1: Welcome + Parent Info (name, email, phone, relationship, address)
- Step 2: Child Information with **repeater group** (1–5 children: name, DOB, gender, photo)
- Step 3: Program Selection per child (image choice grid with classroom photos)
- Step 4: Medical & Safety per child (conditional: allergies, conditions, dietary, medications, pediatrician)
- Step 5: Family & Background (how heard, referral, faith, sibling, goals, custom fields injection)
- Step 6: Agreement & Payment (legal acceptances, conditional Stripe Payment Elements)
- Step 7: Confirmation (confetti, timeline of next steps)

**New form field type:** `repeater_group` — renders a set of fields that can be duplicated (add/remove child). Stores values as JSON arrays. Downstream steps iterate over repeater items for per-child rendering.

**Submission actions:** store → create enrollment_application per child → create enrollment_lead → stripe_charge (if fee) → notify director → notify parent → generate PDF

### 13B.3 — Multi-step application pipeline (§47)

**Migration:** `0047_application_pipeline.sql`
- `application_pipeline_steps` table
- Pipeline columns on `enrollment_applications`
- Pipeline stages: form_submitted → under_review → interview_invited → interview_scheduled → interview_completed → offer_sent → offer_accepted → enrolled (+ waitlisted, rejected, withdrawn branches)

**Admin pipeline UI:**
- Pipeline stage column + filters on enrollment page
- Pipeline timeline view on application detail
- Action buttons: Accept & Send Interview, Request Info, Waitlist, Reject
- "Accept & Send Interview" sends email with tokenized appointment booking link
- Bulk actions for multiple applications

**Server actions:** `src/lib/actions/enrollment/pipeline-actions.ts`

### 13B.4 — Appointment booking system (§48)

**Migration:** `0048_appointments.sql`
- `appointment_types`, `staff_availability`, `staff_availability_overrides`, `calendar_connections`, `appointments` tables
- All with tenant_id + RLS

**New dependencies:**
```bash
npm i googleapis @microsoft/microsoft-graph-client ical.js
```
Justifications: Google Calendar API for booking sync, Microsoft Graph for Outlook sync, iCal parser for Apple Calendar sync.

**Booking widget:** `src/app/(forms)/[tenantSlug]/book/[appointmentTypeSlug]/page.tsx`
- Standalone page with tenant branding (outside portal chrome)
- Month calendar with available date dots
- Time slot picker (computed from availability − bookings − external calendar busy times)
- Booking form: name, email, phone, notes (pre-filled from application token)
- Confirmation screen with "Add to Calendar" buttons (Google, Outlook, Apple .ics)

**Staff availability:**
- Weekly recurring patterns (admin sets per staff member)
- Date-specific overrides (block vacation, open special hours)
- Calendar sync: OAuth for Google + Outlook, CalDAV URL for Apple
- Background sync every 15 minutes via Supabase Edge Function

**Admin UI:**
- Appointment type management (settings page)
- Staff availability editor (weekly grid + override calendar)
- Calendar connection management (OAuth flows)
- Appointments dashboard (calendar + list view, quick actions)

**Pipeline integration:**
- Booking from enrollment email auto-updates pipeline stage to `interview_scheduled`
- Creates `application_pipeline_steps` record
- Notifies assigned staff

### 13B.5 — Seed CCA data

- Seed "School Tour & Interview" appointment type (30 min, in-person, max 4/day)
- Seed enrollment application system form with all 7 steps
- Seed remaining system form templates (re-enrollment, medical auth, photo release, etc.)

**VERIFY:** Submit enrollment form with 2 children + fee on phone. Verify 2 application rows created. Admin accepts + sends interview invitation. Parent clicks booking link. Verify Calendly-style widget with tenant branding. Book appointment. Verify pipeline updates to "Interview Scheduled." Verify staff calendar shows booking. Verify .ics download works. Verify reminder email queued. Verify admin appointments dashboard shows booking. Toggle fee off on a spawned instance — verify no payment step. Push to main.

---

## PHASE 14: Hardware + emergency + compliance (was Phase 13)
**Estimated: 45–60 minutes**

### 14.1 — Door control (§14 of CCA_BUILD_BRIEF)
- `src/lib/hardware/door-control.ts` — adapter interface
- HTTP adapter for smart locks (August, Yale, Kisi, Brivo)
- Unlock from app, auto-lock timer, access log
- Role-based access rules enforced server-side
- Door access log table

### 14.2 — Camera feeds (§14)
- `src/lib/hardware/camera.ts` — adapter interface
- ONVIF-compliant IP camera adapter
- HLS.js stream display
- Snapshot, motion events, bookmarks
- Admin-only live feeds, staff see assigned classroom only

### 14.3 — Emergency system (§37)
- `0030_emergency.sql` — emergency_events, emergency_actions, reunification_records
- One-tap lockdown button (behind confirmation)
- Door auto-lock, camera auto-record, attendance snapshot
- All-channel broadcast (push + SMS + email)
- Real-time update timeline
- All-clear resolution
- Reunification mode (identity verification + child release logging)
- Drill mode (tagged as drill, required for Texas licensing)
- Post-incident report PDF

### 14.4 — Texas DFPS compliance (§39)
- `0031_compliance.sql` — compliance_standards, compliance_checks, inspection_records
- Chapter 746 ratio engine (age-specific tables pre-seeded)
- Minimum standards checklist (digitized Chapter 746)
- Inspection prep mode (readiness report across all categories)
- Deficiency tracker
- Auto-generated compliance reports

**VERIFY:** Door unlock command logs correctly. Camera stream renders via HLS.js. Emergency lockdown fires notification in under 60 seconds. Ratio check uses Texas-specific numbers. Push to main.

---

## PHASE 15: Marketing site (CCA as first tenant)
**Estimated: 60–90 minutes**

### 15.1 — Marketing pages (per CCA_MARKETING_BRIEF.md)
Build all marketing pages using tenant branding + CCA content:
- Homepage with hero, program cards, testimonials, CTA
- Programs page (Infants, Toddlers, 2s, 3s, Pre-K, Private Kinder)
- About page (mission, staff, facility)
- Contact page with form
- Enrollment wizard (multi-step form → enrollment_applications → triggers lead + application)

### 15.2 — Marketing components
- Hero section with video background (CCA videos from `CCA ASSETS/`)
- Program cards with animations
- Testimonial carousel
- FAQ accordion
- Newsletter signup (Resend)
- SEO metadata, sitemap, robots.txt, Open Graph images

### 15.3 — Enrollment form (use the form builder from Phase 13)
- Multi-step wizard matching SuiteDash form fields: parent info, student info (name, DOB, class selection), parent goals/expectations
- Application fee collection (Stripe Payment Intent)
- Confirmation email (Resend)
- Auto-creates lead in CRM pipeline

**VERIFY:** Marketing site renders at tenant's domain. All pages responsive (375px, 768px, 1440px). Enrollment form submits, creates lead + application, collects fee. Lighthouse score > 90. Push to main.

---

## PHASE 16: PWA + push + kiosk + service worker
**Estimated: 30–45 minutes**

### 16.1 — PWA setup
- `public/manifest.webmanifest` — brand theme color from tenant config, icons from tenant branding
- Workbox service worker configuration
- Offline shell for check-in screen
- Background sync queue for check-ins, attendance, daily report entries
- iOS install prompt component

### 16.2 — Web Push (VAPID)
- Push subscription management
- Push notification delivery
- Notification preferences per user (which channels: push, email, SMS)

### 16.3 — Kiosk mode
- Full-screen check-in mode
- Auto-return to scan screen after 15s inactivity
- Admin toggle in settings

### 16.4 — Touch optimization
- 48px minimum touch targets everywhere
- Bottom action bar on phone
- Swipe gestures where appropriate

**VERIFY:** PWA installs on iOS and Android. Push notification received. Kiosk mode works on tablet. Offline check-in queues and syncs. Lighthouse PWA = 100. Push to main.

---

## PHASE 17: Migration + audit + polish
**Estimated: 45–60 minutes**

### 17.1 — SuiteDash migration scripts (§19)
- `scripts/import-suitedash/` with idempotent loaders
- Each loader: reads from `exports/suitedash/{entity}/{id}.json` → writes to new schema → records in `legacy_suitedash_ids`
- Run order: students → families → family_members → classrooms → classroom_assignments → staff → enrollment_history → billing_history
- `--dry-run` flag on every loader
- Migration dashboard at `/portal/admin/migration`

### 17.2 — Audit log viewer
- `src/app/(portal)/admin/audit-log/page.tsx`
- Filterable by: entity type, action, user, date range
- Immutable, append-only

### 17.3 — Accessibility pass
- WCAG 2.2 AA compliance
- `aria-live` regions for check-in confirmations, attendance changes
- Keyboard-only flows: check in, record attendance, publish daily report, make payment
- Screen-reader pass on critical flows
- Reduced motion respected

### 17.4 — i18n wiring
- All user-facing strings through `t()` helper
- Not translated yet (v2) but structure is in place
- Spanish is priority second language

### 17.5 — Security review
- No PHI beyond child safety requirements
- COPPA compliance (no data from children directly)
- Encryption at rest (Supabase AES-256), sensitive columns with pgcrypto
- TLS everywhere, HSTS
- 2FA for admin (WebAuthn optional), required for payroll export and bulk data export
- Rate limiting in proxy.ts
- Photo storage in private buckets with signed URLs

### 17.6 — Sentry integration
- Error tracking configured
- Synthetic error in preview deploy
- Performance monitoring

### 17.7 — Final Lighthouse pass
- Every page: mobile (375px), tablet (768px), desktop (1440px)
- PWA score = 100
- Performance > 90
- Accessibility > 90
- No console warnings, no hydration mismatches

**VERIFY:** Migration scripts run with `--dry-run` clean. Audit log captures all state changes. Lighthouse scores pass. `npm run build` zero warnings. `npm run lint` clean. Push to main.

---

## PHASE 18: End-to-end smoke test + deploy
**Estimated: 30 minutes**

### 18.1 — The complete journey test
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

### 18.2 — Deploy to production
- Vercel preview deploy → smoke test
- Configure custom domains: `crandallchristianacademy.com`, `portal.crandallchristianacademy.com`
- Production deploy
- Verify Stripe webhooks in production mode (but keep in test mode until go-live)
- Verify push notifications in production
- Verify Resend email delivery

### 18.3 — BUILD_LOG.md final entry
```md
### 2026-04-11 — PLATFORM COMPLETE: All 19 phases built (0–18 + 13B)
- **What:** Full Preschool Businesses Win platform shipped. Multi-tenant, 48 feature areas, CCA as first tenant.
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
| 13 | **Custom fields + form builder** | **90–120 min** |
| 13B | **System enrollment form + pipeline + appointment booking** | **90–120 min** |
| 14 | Hardware + emergency + compliance | 45–60 min |
| 15 | Marketing site (CCA) | 60–90 min |
| 16 | PWA + push + kiosk | 30–45 min |
| 17 | Migration + audit + polish | 45–60 min |
| 18 | End-to-end smoke test + deploy | 30 min |
| **TOTAL** | | **~18–22 hours** |

**Do not stop between phases. This is a continuous overnight build.**
