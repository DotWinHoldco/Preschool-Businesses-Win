# Preschool Businesses Win — Platform Build Brief
**For: Claude Code**
**Last updated: 2026-04-10**
**Status:** v3.1 — Multi-tenant platform architecture. CCA is the first tenant. Expanded spec after competitive gap analysis against Brightwheel, Procare, Lillio, Kangarootime, Playground, Famly, Sandbox, and LineLeader. 48 feature areas. Added system forms (§46), application pipeline (§47), and appointment booking (§48). SuiteDash audit appendix to be added after read-only walkthrough.

> ⚠️ **THIS IS A MULTI-TENANT PLATFORM.** Read `PLATFORM_ARCHITECTURE.md` first. Every table in this spec has an implicit `tenant_id uuid not null references tenants(id)` column. Every RLS policy includes `tenant_id = current_setting('app.tenant_id')::uuid` as the first predicate. Every component uses CSS variables (`var(--color-primary)`) for theming — never hardcoded colors. CCA-specific content (copy, logos, faith components) is tenant configuration, not hardcoded values.

> Read this in full before writing code. Read alongside `PLATFORM_ARCHITECTURE.md`, `CCA_MARKETING_BRIEF.md`, `BRAND.md`, and `COPY.md` — same repo, same stack, same design system. The portal is **not** a separate project.

> ⚠️ **Next.js 16 — read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` before touching any route file.** Async `params`/`searchParams`, async `headers()`/`cookies()`, `proxy.ts` (not `middleware.ts`), Turbopack default. See `CCA_MARKETING_BRIEF.md` §10.

---

## 1. Goal

Build a **multi-tenant white-label preschool management SaaS platform** at `preschool.businesses.win` that is:

1. **The best preschool management platform in the market.** Not a SuiteDash clone. Not a Brightwheel clone. Phone-app simplicity, Apple-grade polish, zero feature gaps vs. modern competitors. Each tenant can customize branding, features, and domain.
2. **Three-sided per tenant:** parents manage enrollment, payments, check-in, and receive daily reports; staff manage classrooms, attendance, curriculum, and time tracking; admin orchestrates everything including billing, compliance, door access, and camera oversight.
3. **Phone-first PWA** that installs to a home screen, sends push notifications, and works for a parent holding a toddler with one free hand.
4. **One Next.js repo** with four surfaces: platform site (`preschool.businesses.win`), tenant marketing sites (custom domains), tenant staff portal (`portal.{domain}`), tenant parent portal (role-switched on same portal URL). See `PLATFORM_ARCHITECTURE.md` §4-§5 for domain resolution and app shell architecture.
5. **Auditable, child-safety-first, and migration-safe.** Every action logged. Every check-in/check-out attributed to a real user. Soft deletes by default. Allergy information surfaced at every critical touchpoint.
6. **Multi-tenant from day one.** Shared Supabase project with `tenant_id` on every table. RLS enforces tenant isolation. CSS variables drive per-tenant theming. Feature flags gate per-tenant feature availability. See `PLATFORM_ARCHITECTURE.md` for the complete architecture.

**First tenant:** Crandall Christian Academy (CCA) — `crandallchristianacademy.com` + `portal.crandallchristianacademy.com`. Faith-based features (devotional content, Bible stories, chapel schedules) are tenant configuration, not platform features.

---

## 2. The thesis (read this before writing a single line)

SuiteDash forced CCA to model students as "contacts" and classrooms as "projects." That's wrong, and it's the single biggest reason the existing tooling can't scale. The new platform models the actual world:

- A **Student** is a first-class entity (not a contact). Each child has their own enrollment record, medical profile, classroom assignment, attendance history, and developmental timeline.
- A **Family** is a first-class entity that groups parents/guardians with students across potentially complex household structures. **Blended families, shared custody, split billing, and multiple authorized pickups are all first-class concerns**, not edge cases bolted on later.
- A **Classroom** is a first-class entity (not a project or a tag). It has capacity limits, age ranges, ratio requirements (per Texas DFPS licensing), a lead teacher, assigned aides, and a daily schedule.
- A **Staff Member** is a first-class entity with certifications, background check status, clock-in/out history, classroom assignments, and a payroll profile.
- A **CCA Admin** is the school director/owner — global access, full configuration authority, with audit-logged impersonation for support.

If a feature requires bending one of these into another's shape, the model is wrong. Stop and rethink.

**Hard rules baked into the schema:**
- Never allow check-out to a person not on the authorized pickup list for that student on that day.
- Never show one family's billing to another family, even if they share a student.
- Always surface allergy/medical alerts when a child is checked in, assigned to an activity, or included in a meal plan.
- Never hard-delete a student record. 7-year soft-delete retention for licensing compliance.
- Attendance records are append-only once finalized. Corrections create amendment rows, not overwrites.

---

## 3. Stack (on top of what the marketing site installs)

| Layer | Choice | Why |
|---|---|---|
| Auth | **Supabase Auth** (email/password + magic link + optional WebAuthn for admin) with RLS | Shared Supabase project. `user_tenant_memberships` tracks cross-tenant access. RLS enforces tenant + family + classroom scoping. See `PLATFORM_ARCHITECTURE.md` §9. |
| Authorization | **RLS policies + a `permissions` helper** in `lib/auth/permissions.ts` | Single source of truth for who-can-do-what. |
| Realtime | **Supabase Realtime** channels for attendance changes, check-in events, messaging, daily report updates | No extra infra. |
| Background jobs | **Supabase Edge Functions** for heavy reporting queries and scheduled jobs + **Vercel Cron** for nightly jobs (attendance finalization, billing runs, cert expiry alerts, ratio checks, CACFP claim prep, subsidy expiry, document expiry, training hours, lead follow-ups, email digests, scheduled messages) | Edge Functions preferred for connection-pooled DB work; Vercel Cron for lightweight triggers. |
| Payments | **Stripe Connect** (per-tenant connected accounts for tuition subscriptions + one-off invoices) | Platform Stripe account charges tenants (SaaS subscription). Each tenant's Stripe Connect account charges parents (tuition, fees). ACH for lower fees. Card as fallback. See `PLATFORM_ARCHITECTURE.md` §10. |
| Storage | **Supabase Storage** (tenant-isolated buckets: `tenant-{id}-photos/`, `tenant-{id}-documents/`, `tenant-{id}-reports/`) | Student photos, staff credentials, daily report photos, immunization records, incident reports. Bucket-per-tenant for full isolation. See `PLATFORM_ARCHITECTURE.md` §7. |
| Search | Postgres full-text on `students`, `families`, `staff` | No external search infra. |
| Email | **Resend** | Transactional + templated notifications. |
| SMS | **Twilio** | Urgent alerts (unauthorized pickup attempt, emergency broadcast, late pickup). |
| Push | **Web Push** (VAPID) for PWA | Daily report published, check-in confirmation, payment receipt. |
| QR Codes | **`qrcode`** (npm) for generating student check-in QR codes | Printed on parent's phone or laminated card. |
| Calendar UI | **Built-in** (custom calendar component) or **`@fullcalendar/react`** if needed for staff scheduling | Keep lean unless scheduling complexity demands it. |
| State (client) | **React 19 + Server Components first.** Zustand for the few genuinely global UI states (sidebar, toasts, active-classroom context). | Don't reach for Redux. |
| Forms | **react-hook-form + Zod resolver** | Same Zod schemas server actions use. |
| Tables | **TanStack Table v8** (headless) | Composes with our own Tailwind primitives. |
| Date/time | **`@internationalized/date` + `date-fns`** | Timezone correctness for scheduling and attendance. |
| Tests | **Vitest + Playwright** | Unit + e2e. |
| Observability | **Sentry** + **Vercel Analytics** + **Supabase logs** | Traces, errors, user funnels. |
| Feature flags | **`tenant_features` table** + `hasTenantFeature()` helper | Per-tenant feature toggling (25 features). Replaces `@vercel/flags` for tenant-level gating. See `PLATFORM_ARCHITECTURE.md` §3.4. |
| Door control | **Custom abstraction layer** in `lib/hardware/door-control.ts` | Hardware-agnostic interface. See §14. |
| Camera feeds | **Custom abstraction layer** in `lib/hardware/camera.ts` | ONVIF/RTSP compatible. See §14. |

**Do not install:** Prisma, Drizzle, Remix loaders, Recoil, MUI, Ant Design, Chakra, tRPC, shadcn/ui, Radix. We use Supabase generated types + Server Actions + the existing Tailwind v4 design system.

---

## 4. Roles & permissions (the spine of the app)

> **Multi-tenant note:** All roles below are **tenant-scoped** via `user_tenant_memberships` and `user_roles.tenant_id`. A user can have different roles in different tenants. The `platform_admin` role (platform-level, not tenant-level) is defined in `PLATFORM_ARCHITECTURE.md` §9.

There are exactly **four role families** and **one impersonation mechanism**.

### 4.1 Roles

| Role | Who | Scope | Highlights |
|---|---|---|---|
| `cca_owner` | School owner/director | Global | All-powerful. Can impersonate anyone. Single-digit count. |
| `cca_admin` | Office/administrative staff | Global | Manage all students, families, staff, billing, enrollment, compliance. Can impersonate parents and staff with justification. |
| `lead_teacher` | Classroom lead teacher | Classroom-scoped | Manage their classroom's students, take attendance, write daily reports, view allergy info, message parents of their students. Can view (not edit) other classrooms. |
| `teacher` | Assistant teacher | Classroom-scoped | Same as lead teacher minus the ability to edit classroom settings or reassign students. |
| `aide` | Classroom aide / floater | Classroom-scoped (or multi) | Take attendance, log activities, view allergy info. Cannot edit student records or message parents directly (goes through lead teacher). |
| `parent` | Parent/guardian with full access | Family-scoped | Manage own family profile, check in/out their children, view daily reports, make payments, message teachers/admin. |
| `guardian` | Authorized guardian with limited access | Family-scoped (limited) | Check in/out authorized children, view daily reports. Cannot edit family profile or make payments unless explicitly granted. |
| `applicant_parent` | Pre-enrolled parent | Self-scoped (limited) | Can complete enrollment application but cannot access the full portal until approved. |

> **There is no generic "admin" or "staff" role.** Always say which kind. RLS depends on it.

### 4.2 Multi-classroom support
- A staff member can be assigned to multiple classrooms (floater aides).
- `classroom_staff_assignments` join table: `(classroom_id, user_id, role, assigned_from, assigned_to, is_primary)`.
- A user's "active classroom" is a session-level UI choice surfaced as a switcher in the top bar.

### 4.3 Dual-role users
- A staff member can also be a parent (their own child attends CCA). They see a role switcher after login.
- The system tracks both personas via `user_roles` join table: `(user_id, role, scope_type, scope_id)`.

### 4.4 Impersonation
- `cca_owner` and `cca_admin` can impersonate any parent or staff member for support.
- Impersonation requires a **typed justification** (one sentence minimum), writes to `audit_log`.
- Red banner when impersonating: "Acting as `Jane Doe (parent)` — Exit".
- Impersonation never extends to **payment actions** (making payments, issuing refunds) — those require the real account.

### 4.5 RLS pattern

> **Multi-tenant rule:** Every RLS policy starts with tenant isolation. See `PLATFORM_ARCHITECTURE.md` §3 for the `set_tenant_context()` RPC and the `current_setting('app.tenant_id')` pattern.

Every table that contains family-scoped data has:
```sql
create policy family_access on <table>
  for select using (
    -- Tenant isolation (always first)
    tenant_id = current_setting('app.tenant_id')::uuid
    and (
      -- Family scope
      auth.uid() in (
        select user_id from family_members
        where family_id = <table>.family_id
          and tenant_id = current_setting('app.tenant_id')::uuid
      )
      -- Admin override (tenant-scoped)
      or exists (
        select 1 from user_roles
        where user_id = auth.uid()
          and tenant_id = current_setting('app.tenant_id')::uuid
          and role in ('cca_owner','cca_admin')
      )
    )
  );
```
Classroom-scoped tables gate by `classroom_staff_assignments` (also tenant-scoped). Writes are gated by role helper functions. **Every policy must include `tenant_id` as the outermost predicate.**

---

## 5. Data model (high-level — full DDL goes in `supabase/migrations/`)

> **Multi-tenant column convention:** All tables below have an implicit `tenant_id uuid not null references tenants(id)` column. This is not repeated in every listing to keep the spec readable, but it **must** be present in every migration. Tenant infrastructure tables (`tenants`, `tenant_domains`, `tenant_branding`, `tenant_features`, `user_tenant_memberships`, `platform_subscriptions`) are defined in `PLATFORM_ARCHITECTURE.md` §3 and created in migrations 0001–0004. Feature-level tables start at migration 0005+.

> All tables: `id uuid pk default gen_random_uuid()`, `tenant_id uuid not null references tenants(id)`, `created_at`, `updated_at` (trigger), `deleted_at` (soft delete), `created_by`, `updated_by`. RLS enabled. Generated TS types in `src/lib/database.types.ts`.

### 5.1 Identity & access
- `users` (extends `auth.users`) — first/last name, phone, avatar_path, default_role, locale, timezone.
- `user_roles` — `(tenant_id, user_id, role, scope_type [global/classroom/family], scope_id, granted_by, granted_at, revoked_at)`. Tenant-scoped — a user may hold different roles in different tenants.
- `audit_log` — `(tenant_id, actor_id, impersonating_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, user_agent, created_at)`. Append-only. Never deleted. Tenant-scoped.

### 5.2 Students
- `students` — `(first_name, last_name, preferred_name, date_of_birth, gender, enrollment_status [applied/enrolled/active/withdrawn/graduated/waitlisted], enrollment_date, withdrawal_date, withdrawal_reason, photo_path, notes_internal)`.
- `student_medical_profiles` — `(student_id, blood_type, primary_physician_name, primary_physician_phone, insurance_provider, insurance_policy_number, special_needs_notes, emergency_action_plan_path)`.
- `student_allergies` — `(student_id, allergen, severity [mild/moderate/severe/life_threatening], reaction_description, treatment_protocol, medication_name, medication_location, epipen_on_site boolean, notes, verified_by, verified_at)`. **Life-threatening allergies surface a red banner on every check-in and every daily-report meal entry.**
- `student_medications` — `(student_id, medication_name, dosage, frequency, administration_time, administration_instructions, prescribing_physician, start_date, end_date, requires_refrigeration, administered_by_log jsonb)`.
- `student_immunizations` — `(student_id, vaccine_name, dose_number, administered_date, provider, document_path, verified_by, verified_at, expiry_date)`.
- `student_emergency_contacts` — `(student_id, name, relationship, phone_primary, phone_secondary, priority_order, can_pickup boolean, notes)`.
- `student_developmental_milestones` — `(student_id, milestone_category, milestone_name, observed_date, observed_by, notes, evidence_path)`.

### 5.3 Families & guardians
- `families` — `(family_name, mailing_address_*, billing_email, billing_phone, stripe_customer_id, auto_pay_enabled, payment_method_id, notes_internal)`.
- `family_members` — `(family_id, user_id, relationship_type [mother/father/stepmother/stepfather/grandparent/nanny/other], relationship_label, is_primary_contact, is_billing_responsible, can_pickup_default, lives_in_household boolean, custody_notes)`.
- `student_family_links` — `(student_id, family_id, custody_schedule jsonb, billing_split_pct numeric, is_primary_family boolean, notes)`. The `custody_schedule` is a JSON object describing which days/weeks each family has custody: `{ "type": "alternating_weeks" | "specific_days" | "full" | "custom", "days": [...], "notes": "..." }`.
- `authorized_pickups` — `(student_id, family_id, person_name, relationship, phone, photo_path, photo_verified boolean, government_id_type, government_id_verified_at, valid_from, valid_to, added_by, notes)`. Every non-parent pickup requires photo ID verification by staff.

### 5.4 Classrooms
- `classrooms` — `(name, slug, age_range_min_months, age_range_max_months, capacity, current_enrollment_count (computed), ratio_required numeric, room_number, description, daily_schedule_template jsonb, status [active/inactive/summer_only])`.
- `classroom_staff_assignments` — `(classroom_id, user_id, role, is_primary boolean, assigned_from, assigned_to)`. Primary = lead teacher.
- `student_classroom_assignments` — `(student_id, classroom_id, assigned_from, assigned_to, program_type [full_day/half_day_am/half_day_pm/before_care/after_care/summer])`.

### 5.5 Attendance & check-in/out
- `check_ins` — `(student_id, checked_in_by_user_id, checked_in_at, method [qr_scan/pin/staff_manual/kiosk], temperature_f, health_screening_passed boolean, health_notes, allergy_acknowledged boolean, photo_verified boolean, notes)`. Health screening = "Does the child have fever/rash/symptoms?" toggle at check-in.
- `check_outs` — `(student_id, checked_out_by_user_id, checked_out_at, method, pickup_person_name, pickup_person_relationship, pickup_authorized boolean, photo_match_verified boolean, staff_override boolean, staff_override_reason, notes)`. If `pickup_authorized = false`, the system **blocks the check-out** and alerts admin immediately.
- `attendance_records` — `(student_id, classroom_id, date, status [present/absent/late/early_pickup/excused_absent/sick], check_in_id, check_out_id, hours_present, notes, finalized_at, finalized_by)`. Finalized = can't be edited without an amendment.
- `attendance_amendments` — `(attendance_record_id, amended_by, reason, before jsonb, after jsonb, amended_at)`. Corrections don't overwrite; they amend.
- `student_qr_codes` — `(student_id, family_id, qr_token, generated_at, expires_at, revoked_at)`. QR rotates monthly for security. One per student per family (mom's phone has a different QR than dad's — we know who dropped off).

### 5.6 Daily reports
- `daily_reports` — `(student_id, classroom_id, date, status [draft/published], published_at, published_by)`.
- `daily_report_entries` — `(report_id, entry_type [meal/nap/diaper/activity/mood/milestone/note/photo], timestamp, data jsonb, entered_by, entered_at)`. The `data` field is typed per `entry_type`:
  - **meal:** `{ meal_type: "breakfast"|"lunch"|"snack", items_offered: string[], amount_eaten: "all"|"most"|"some"|"none", notes: string }`
  - **nap:** `{ started_at: timestamp, ended_at: timestamp, quality: "restful"|"restless"|"refused" }`
  - **diaper:** `{ type: "wet"|"dry"|"bm", notes: string }`
  - **activity:** `{ activity_name: string, description: string, engagement_level: "high"|"medium"|"low", photo_paths: string[] }`
  - **mood:** `{ overall: "happy"|"calm"|"fussy"|"upset"|"tired", notes: string }`
  - **milestone:** `{ category: string, milestone: string, notes: string, evidence_path: string }`
  - **note:** `{ text: string, visibility: "parent"|"staff_only" }`
  - **photo:** `{ path: string, caption: string, visibility: "parent"|"staff_only" }`

### 5.7 Staff & payroll
- `staff_profiles` — `(user_id, employee_id, hire_date, employment_type [full_time/part_time/substitute], hourly_rate, salary, pay_frequency [weekly/biweekly/monthly], tax_filing_status, direct_deposit_info_encrypted, emergency_contact_name, emergency_contact_phone, notes_internal)`.
- `staff_certifications` — `(user_id, cert_type [cpr/first_aid/ece_credential/food_handler/other], cert_name, issuing_body, issued_date, expiry_date, document_path, verified_by, verified_at)`. Cron job alerts admin 30 days before expiry.
- `staff_background_checks` — `(user_id, check_type [criminal/sex_offender_registry/fingerprint/reference], provider, status [pending/cleared/flagged/expired], completed_at, expiry_date, document_path, notes)`.
- `staff_schedules` — `(user_id, day_of_week, start_time, end_time, classroom_id, effective_from, effective_to)`.
- `time_entries` — `(user_id, clock_in_at, clock_out_at, clock_in_method [app/kiosk/manual], break_start_at, break_end_at, total_hours, overtime_hours, status [active/completed/edited/approved], approved_by, approved_at, notes)`.
- `pto_balances` — `(user_id, pto_type [vacation/sick/personal], balance_hours, accrual_rate_per_pay_period, used_ytd, year)`.
- `pto_requests` — `(user_id, pto_type, start_date, end_date, hours_requested, status [pending/approved/denied], decided_by, decided_at, notes)`.
- `payroll_runs` — `(period_start, period_end, status [draft/approved/exported/paid], total_gross, total_net, exported_at, exported_format, run_by, approved_by)`.
- `payroll_line_items` — `(payroll_run_id, user_id, regular_hours, overtime_hours, regular_pay, overtime_pay, pto_hours, pto_pay, gross_pay, deductions jsonb, net_pay)`.

### 5.8 Payments & billing
- `billing_plans` — `(name, description, amount_cents, frequency [weekly/monthly/annually], program_type, age_group, registration_fee_cents, supply_fee_cents, late_fee_cents, late_fee_grace_days, sibling_discount_pct, staff_discount_pct, military_discount_pct, church_member_discount_pct)`.
- `family_billing_enrollments` — `(family_id, student_id, billing_plan_id, start_date, end_date, custom_amount_cents, discount_type, discount_pct, stripe_subscription_id, status [active/paused/cancelled])`.
- `invoices` — `(family_id, period_start, period_end, line_items jsonb, subtotal_cents, discounts_cents, tax_cents, total_cents, status [draft/sent/paid/overdue/voided/refunded], stripe_invoice_id, sent_at, due_date, paid_at, voided_at, invoice_number)`.
- `invoice_lines` — `(invoice_id, description, quantity, unit_amount_cents, total_cents, category [tuition/registration/supplies/late_fee/field_trip/other], student_id)`.
- `payments` — `(family_id, invoice_id, amount_cents, method [card/ach/cash/check/other], stripe_payment_intent_id, status [succeeded/pending/failed/refunded], paid_at, notes)`.
- `payment_receipts` — `(payment_id, family_id, receipt_number, generated_at, pdf_path)`.
- `annual_tax_statements` — `(family_id, tax_year, total_paid_cents, ein, school_name, school_address, generated_at, pdf_path)`. For dependent-care FSA / tax credit claims.

### 5.9 Messaging
- `conversations` — `(type [direct/classroom/broadcast/staff_only], classroom_id nullable, title, created_by)`.
- `conversation_members` — `(conversation_id, user_id, role [sender/recipient/admin], muted boolean, last_read_at)`.
- `messages` — `(conversation_id, sender_id, body, message_type [text/photo/file/system], file_path, urgent boolean, edited_at, deleted_at)`.
- `message_read_receipts` — `(message_id, user_id, read_at)`.

### 5.10 Curriculum & lesson plans
- `curriculum_standards` — `(name, category, age_group, description, source [state/naeyc/faith_based/custom])`.
- `lesson_plans` — `(classroom_id, week_start_date, title, theme, objectives, materials, faith_component, created_by, status [draft/published], published_at)`.
- `lesson_plan_activities` — `(lesson_plan_id, day_of_week, time_slot, activity_name, description, standards_addressed uuid[], materials_needed, duration_minutes, completed boolean, completed_at, completed_by, notes)`.
- `activity_library` — `(name, description, category, age_group_min_months, age_group_max_months, duration_minutes, materials, learning_areas, faith_integrated boolean, created_by)`.

### 5.11 Door control
- `door_locks` — `(name, location, hardware_type, hardware_id, api_endpoint, api_key_encrypted, status [online/offline/locked/unlocked/error], last_heartbeat_at)`.
- `door_access_rules` — `(door_lock_id, role, time_window_start, time_window_end, days_of_week, requires_active_shift boolean)`. Staff can only unlock during their shift. Admin always. Parents only during check-in window hours.
- `door_access_log` — `(door_lock_id, user_id, action [unlock/lock/denied/auto_lock], method [app/auto/manual], timestamp, notes)`. Append-only.

### 5.12 Camera feeds
- `cameras` — `(name, location, hardware_type, stream_url_encrypted, thumbnail_url, status [online/offline/error], last_frame_at, recording_enabled boolean)`.
- `camera_bookmarks` — `(camera_id, bookmarked_by, timestamp, duration_seconds, label, notes)`.
- `camera_motion_events` — `(camera_id, started_at, ended_at, confidence, thumbnail_path)`.

### 5.13 Enrollment pipeline
- `enrollment_applications` — `(parent_first_name, parent_last_name, parent_email, parent_phone, student_first_name, student_last_name, student_dob, desired_start_date, program_type, how_heard, faith_community, notes, triage_status [new/reviewing/waitlisted/approved/rejected/enrolled], triage_score, triage_assigned_to, triage_notes, approved_at, approved_by, converted_to_student_id, converted_to_family_id, converted_at, utm_source, utm_medium, utm_campaign, user_agent, created_at)`.

### 5.14 Compliance & operations
- `incident_reports` — `(student_id, classroom_id, reported_by, incident_type [injury/behavior/health/safety/other], severity [minor/moderate/serious], description, action_taken, parent_notified_at, parent_notified_by, witness_names, follow_up_required boolean, follow_up_notes, follow_up_completed_at, document_paths)`.
- `licensing_documents` — `(document_type [fire_inspection/health_inspection/dfps_license/insurance/other], document_path, issued_date, expiry_date, notes)`.
- `ratio_compliance_log` — `(classroom_id, checked_at, students_present, staff_present, ratio_actual, ratio_required, compliant boolean, notes)`. Auto-computed every 15 minutes by cron. Non-compliance alerts admin immediately.

### 5.15 Notifications & comms
- `notification_preferences` — per user, per channel (email/sms/push/in-app).
- `notifications` — in-app feed.
- `notification_deliveries` — append-only log of every send (channel, status, provider_id, error).

### 5.16 Migration
- `legacy_suitedash_ids` — `(entity_type, new_id, suitedash_id, migrated_at)` for idempotent re-import.

---

## 6. File tree (target)

> **Multi-tenant file structure:** The full multi-tenant file tree (including `(platform)/` routes, tenant resolution, theming, and feature flags) is defined in `PLATFORM_ARCHITECTURE.md` §8. Below is the feature-level tree that extends that base. All routes below live inside the tenant-aware app shell.

```
src/
  app/
    (platform)/                 # DotWin platform site — see PLATFORM_ARCHITECTURE.md §8
    (marketing)/
      layout.tsx
      page.tsx                  # Home (tenant marketing site)
      programs/page.tsx         # Programs offered
      about/page.tsx            # About the school
      enroll/page.tsx           # Enrollment funnel
      contact/page.tsx
      faith/page.tsx            # Faith & mission
    (portal)/
      layout.tsx                # AppShell with role-aware nav
      page.tsx                  # Smart redirect by role
      login/
        page.tsx
        callback/route.ts
      onboarding/
        parent/page.tsx         # Parent onboarding wizard
        staff/page.tsx          # Staff onboarding wizard
      admin/
        layout.tsx
        page.tsx                # Admin dashboard
        students/
          page.tsx              # All students list
          [studentId]/page.tsx  # Student detail
          [studentId]/medical/page.tsx
          new/page.tsx
        families/
          page.tsx
          [familyId]/page.tsx
          [familyId]/billing/page.tsx
          new/page.tsx
        classrooms/
          page.tsx
          [classroomId]/page.tsx
          [classroomId]/roster/page.tsx
          [classroomId]/schedule/page.tsx
          new/page.tsx
        staff/
          page.tsx
          [staffId]/page.tsx
          scheduling/page.tsx
          payroll/
            page.tsx
            run/page.tsx
        enrollment/
          page.tsx              # Application queue
          waitlist/page.tsx
        billing/
          page.tsx
          invoices/[id]/page.tsx
          plans/page.tsx
          tax-statements/page.tsx
        attendance/
          page.tsx              # School-wide attendance
          reports/page.tsx
        compliance/
          page.tsx              # Licensing, ratio checks, cert expiry
          incidents/page.tsx
          incidents/[id]/page.tsx
        doors/page.tsx          # Door control panel
        cameras/page.tsx        # Camera feed viewer
        messaging/page.tsx
        calendar/page.tsx       # School calendar + events
        surveys/
          page.tsx              # Survey list
          [surveyId]/page.tsx   # Survey detail + results
          new/page.tsx          # Survey builder
        leads/
          page.tsx              # Enrollment CRM pipeline board
          [leadId]/page.tsx     # Lead detail
        analytics/
          page.tsx              # Executive dashboard
          revenue/page.tsx
          enrollment/page.tsx
          attendance/page.tsx
          staff/page.tsx
          financial/page.tsx
          compliance/page.tsx
          reports/page.tsx      # Custom report builder
        food-program/
          page.tsx              # CACFP dashboard
          menus/page.tsx        # Menu planner
          claims/page.tsx       # CACFP claim reports
        expenses/
          page.tsx              # Expense list + entry
          categories/page.tsx
          budgets/page.tsx
          exports/page.tsx      # QuickBooks/Xero export
        subsidies/
          page.tsx              # Subsidy overview
          agencies/page.tsx
          claims/page.tsx
        checklists/
          page.tsx              # Checklist templates
          [templateId]/page.tsx
          tracking/page.tsx     # Assignment tracking
        documents/
          page.tsx              # Document vault
          [entityType]/[entityId]/page.tsx
          inspection-prep/page.tsx
        training/
          page.tsx              # Staff PD overview
          [staffId]/page.tsx
        dfps-compliance/
          page.tsx              # Texas DFPS compliance dashboard
          standards/page.tsx    # Minimum standards checklist
          inspections/page.tsx  # Inspection history
          deficiencies/page.tsx
        emergency/
          page.tsx              # Emergency controls + history
        audit-log/page.tsx
        settings/
          page.tsx
          branding/page.tsx
          notifications/page.tsx
          integrations/page.tsx
          billing-config/page.tsx  # Fee config, processing fees, late fee rules
          drop-in/page.tsx         # Drop-in availability + rates config
          custom-fields/page.tsx   # Custom fields manager (§44)
        forms/
          page.tsx                 # All forms list
          new/page.tsx             # Form builder (create)
          [formId]/
            edit/page.tsx          # Form builder (edit)
            responses/page.tsx     # Response table view
            responses/[responseId]/page.tsx  # Single response detail
            analytics/page.tsx     # Form analytics
            settings/page.tsx      # Form settings + submission actions
    (forms)/                        # Public/embedded form rendering (outside portal chrome)
      [tenantSlug]/
        [formSlug]/
          page.tsx                 # Standalone form page (public or authenticated)
          embed/page.tsx           # Embeddable iframe version (no site chrome)
      staff/
        layout.tsx
        page.tsx                # Staff dashboard (my classrooms today)
        classroom/
          [classroomId]/
            page.tsx            # Classroom view — attendance + daily reports
            attendance/page.tsx
            daily-reports/page.tsx
            daily-reports/[studentId]/page.tsx
            curriculum/page.tsx
        check-in/page.tsx       # Check-in station mode
        carline/page.tsx        # Carline queue board
        food-program/
          page.tsx              # Meal recording for classroom
        my-schedule/page.tsx
        time-clock/page.tsx
        training/page.tsx       # My PD hours + log
        messaging/page.tsx
        calendar/page.tsx       # My events + classroom calendar
      parent/
        layout.tsx
        page.tsx                # Parent dashboard (my children)
        children/
          [studentId]/page.tsx  # Child detail
          [studentId]/daily-reports/page.tsx
          [studentId]/medical/page.tsx
        check-in/page.tsx       # Parent QR check-in screen
        billing/
          page.tsx
          invoices/[id]/page.tsx
          payment-methods/page.tsx
          subscriptions/page.tsx  # View/manage active subscriptions
          tax-statements/page.tsx
        messaging/page.tsx
        calendar/page.tsx         # School calendar + my events
        drop-in/page.tsx          # Book drop-in days
        checklists/page.tsx       # My outstanding checklist items
        documents/page.tsx        # My uploaded documents
        surveys/[surveyId]/page.tsx  # Take a survey
        family/
          page.tsx              # Family profile + authorized pickups
          pickups/page.tsx
      api/
        webhooks/
          stripe/route.ts
        cron/
          attendance-finalize/route.ts
          ratio-check/route.ts
          cert-expiry/route.ts
          billing-run/route.ts
          late-pickup-alert/route.ts
          training-hours-check/route.ts
          subsidy-expiry-alert/route.ts
          document-expiry-check/route.ts
          cacfp-claim-reminder/route.ts
          survey-distribution/route.ts
          scheduled-messages/route.ts
          email-digest/route.ts
        push/
          subscribe/route.ts
          unsubscribe/route.ts
  components/
    portal/
      app-shell.tsx
      sidebar.tsx
      top-bar.tsx
      role-switcher.tsx
      classroom-switcher.tsx
      impersonation-banner.tsx
      check-in/
        qr-scanner.tsx
        pin-pad.tsx
        health-screening.tsx
        allergy-banner.tsx
        check-in-confirmation.tsx
        check-out-flow.tsx
        pickup-verification.tsx
      attendance/
        who-is-here-board.tsx
        attendance-grid.tsx
        ratio-indicator.tsx
      daily-reports/
        report-builder.tsx
        entry-card.tsx
        meal-entry.tsx
        nap-entry.tsx
        activity-entry.tsx
        photo-entry.tsx
        mood-selector.tsx
        report-timeline.tsx     # Parent view
      students/
        student-card.tsx
        medical-profile.tsx
        allergy-badge.tsx
        immunization-tracker.tsx
        milestone-timeline.tsx
      families/
        family-tree-view.tsx
        custody-schedule-editor.tsx
        billing-split-editor.tsx
        authorized-pickup-list.tsx
      classrooms/
        classroom-card.tsx
        roster-grid.tsx
        capacity-gauge.tsx
        ratio-badge.tsx
        daily-schedule-editor.tsx
      staff/
        schedule-grid.tsx
        time-clock-widget.tsx
        cert-status-badge.tsx
        payroll-table.tsx
      billing/
        invoice-list.tsx
        invoice-detail.tsx
        payment-form.tsx
        plan-selector.tsx
        tax-statement.tsx
      messaging/
        conversation-list.tsx
        message-thread.tsx
        compose-modal.tsx
        broadcast-composer.tsx
      curriculum/
        lesson-plan-editor.tsx
        activity-card.tsx
        standards-picker.tsx
        week-view.tsx
      hardware/
        door-control-panel.tsx
        door-status-indicator.tsx
        camera-feed-viewer.tsx
        camera-grid.tsx
      enrollment/
        application-queue.tsx
        application-detail.tsx
        waitlist-manager.tsx
        lead-pipeline.tsx
        lead-detail.tsx
        tour-scheduler.tsx
      food-program/
        menu-planner.tsx
        meal-recorder.tsx
        allergy-meal-badge.tsx
        cacfp-claim-report.tsx
        kitchen-prep-view.tsx
      expenses/
        expense-entry.tsx
        receipt-capture.tsx
        budget-vs-actual.tsx
        financial-dashboard.tsx
        accounting-export.tsx
      portfolios/
        observation-entry.tsx
        learning-story-editor.tsx
        portfolio-timeline.tsx
        domain-picker.tsx
        assessment-form.tsx
        progress-report.tsx
      surveys/
        survey-builder.tsx
        survey-response-form.tsx
        nps-gauge.tsx
        results-dashboard.tsx
      carline/
        parent-arrival.tsx
        queue-board.tsx
        release-control.tsx
      drop-in/
        availability-calendar.tsx
        booking-flow.tsx
      subsidies/
        subsidy-enrollment.tsx
        mixed-funding-invoice.tsx
        claim-generator.tsx
        reconciliation-board.tsx
      analytics/
        executive-dashboard.tsx
        revenue-chart.tsx
        enrollment-funnel.tsx
        attendance-heatmap.tsx
        compliance-scorecard.tsx
        custom-report-builder.tsx
      checklists/
        template-builder.tsx
        checklist-progress.tsx
        parent-checklist-view.tsx
        staff-checklist-view.tsx
        e-signature-pad.tsx
      documents/
        document-vault.tsx
        document-uploader.tsx
        expiry-dashboard.tsx
        inspection-prep-report.tsx
      calendar/
        school-calendar.tsx
        event-detail.tsx
        rsvp-manager.tsx
        field-trip-wizard.tsx
      emergency/
        lockdown-button.tsx
        emergency-timeline.tsx
        reunification-board.tsx
        drill-log.tsx
      training/
        pd-hours-tracker.tsx
        training-log-entry.tsx
        team-compliance-board.tsx
      compliance/
        dfps-ratio-engine.tsx
        standards-checklist.tsx
        inspection-history.tsx
        deficiency-tracker.tsx
      newsfeed/
        post-composer.tsx
        feed-timeline.tsx
        reaction-bar.tsx
      ui-extras/
        allergy-alert-strip.tsx
        ratio-warning.tsx
        universal-search.tsx
        student-quick-card.tsx
        entity-notes.tsx
  lib/
    auth/
      session.ts
      permissions.ts
      impersonation.ts
    actions/
      student/
        create-student.ts
        update-student.ts
        manage-allergies.ts
        manage-immunizations.ts
      family/
        create-family.ts
        manage-members.ts
        manage-pickups.ts
        manage-custody.ts
      classroom/
        create-classroom.ts
        manage-roster.ts
        manage-staff.ts
      check-in/
        check-in.ts
        check-out.ts
        verify-pickup.ts
      attendance/
        record-attendance.ts
        finalize-attendance.ts
        amend-attendance.ts
      daily-report/
        create-entry.ts
        publish-report.ts
      staff/
        manage-schedule.ts
        clock-in-out.ts
        manage-certifications.ts
        run-payroll.ts
      billing/
        generate-invoices.ts
        process-payment.ts
        manage-subscriptions.ts
        generate-tax-statement.ts
      enrollment/
        process-application.ts
        manage-waitlist.ts
      messaging/
        send-message.ts
        broadcast.ts
        schedule-message.ts
      food-program/
        manage-menus.ts
        record-meals.ts
        generate-cacfp-claim.ts
      expenses/
        create-expense.ts
        manage-budgets.ts
        export-accounting.ts
      portfolios/
        create-observation.ts
        create-learning-story.ts
        run-assessment.ts
        generate-progress-report.ts
      leads/
        manage-lead.ts
        schedule-tour.ts
        send-follow-up.ts
      surveys/
        create-survey.ts
        submit-response.ts
        generate-results.ts
      carline/
        manage-queue.ts
        process-arrival.ts
        release-child.ts
      drop-in/
        manage-availability.ts
        book-drop-in.ts
        cancel-booking.ts
      subsidies/
        manage-subsidy.ts
        generate-claim.ts
        reconcile-payments.ts
      checklists/
        manage-templates.ts
        assign-checklist.ts
        complete-item.ts
      documents/
        upload-document.ts
        manage-versions.ts
        generate-inspection-report.ts
      calendar/
        manage-events.ts
        process-rsvp.ts
        manage-sign-ups.ts
      emergency/
        initiate-emergency.ts
        resolve-emergency.ts
        record-reunification.ts
      training/
        log-training.ts
        set-goals.ts
        generate-compliance-report.ts
      compliance/
        run-standards-check.ts
        manage-inspections.ts
        track-deficiencies.ts
      analytics/
        generate-report.ts
        schedule-report.ts
      newsfeed/
        create-post.ts
        manage-reactions.ts
      hardware/
        unlock-door.ts
        camera-snapshot.ts
    schemas/
      student.ts
      family.ts
      classroom.ts
      check-in.ts
      attendance.ts
      daily-report.ts
      staff.ts
      billing.ts
      enrollment.ts
      messaging.ts
      food-program.ts
      expense.ts
      portfolio.ts
      lead.ts
      survey.ts
      carline.ts
      drop-in.ts
      subsidy.ts
      checklist.ts
      document.ts
      calendar-event.ts
      emergency.ts
      training.ts
      compliance.ts
      newsfeed.ts
    notifications/
      send.ts
      templates/
        check-in-confirmation.tsx
        daily-report-published.tsx
        payment-receipt.tsx
        late-pickup-alert.tsx
        unauthorized-pickup.tsx
        cert-expiry-warning.tsx
        ratio-violation.tsx
        enrollment-approved.tsx
        emergency-lockdown.tsx
        emergency-all-clear.tsx
        carline-arrival.tsx
        drop-in-confirmed.tsx
        subsidy-expiring.tsx
        checklist-overdue.tsx
        document-expiring.tsx
        survey-available.tsx
        training-behind-pace.tsx
        tour-scheduled.tsx
        lead-follow-up.tsx
        event-reminder.tsx
        field-trip-permission.tsx
        newsfeed-post.tsx
        budget-warning.tsx
    hardware/
      door-control.ts           # Abstract interface
      camera.ts                 # Abstract interface
      adapters/
        generic-maglock.ts      # Default adapter — HTTP unlock/lock
        onvif-camera.ts         # ONVIF/RTSP adapter
    stripe/
      client.ts
      subscriptions.ts
      invoicing.ts
      webhooks.ts
    storage/
      upload.ts
      signed-url.ts
    supabase/
      server.ts
      browser.ts
      ssr.ts
    pwa/
      manifest.ts
      sw.ts
      push.ts
  types/
    portal.ts
supabase/
  migrations/
    # Platform infra (0001-0004) — see PLATFORM_ARCHITECTURE.md §3
    0001_tenants.sql              # tenants, tenant_domains tables
    0002_tenant_branding.sql      # tenant_branding table
    0003_tenant_features.sql      # tenant_features table + seed flags
    0004_users_with_tenant.sql    # user_tenant_memberships, platform_subscriptions
    # Feature migrations (0005+) — all include tenant_id
    0005_extensions.sql
    0006_users_and_roles.sql
    0007_students.sql
    0008_families.sql
    0009_classrooms.sql
    0010_check_in_attendance.sql
    0011_daily_reports.sql
    0012_staff_payroll.sql
    0013_billing.sql
    0014_messaging.sql
    0015_curriculum.sql
    0016_door_control.sql
    0017_cameras.sql
    0018_enrollment.sql
    0019_compliance.sql
    0020_notifications.sql
    0021_audit.sql
    0022_legacy_map.sql
    0023_rls_policies.sql
    0024_role_helpers.sql
    0025_food_program.sql
    0026_expenses.sql
    0027_portfolios.sql
    0028_leads_crm.sql
    0029_surveys.sql
    0030_carline.sql
    0031_drop_in.sql
    0032_subsidies.sql
    0033_checklists.sql
    0034_documents.sql
    0035_calendar_events.sql
    0036_emergency.sql
    0037_training.sql
    0038_dfps_compliance.sql
    0039_analytics.sql
    0040_newsfeed.sql
    0041_enhanced_billing.sql
    0042_entity_notes.sql
    0043_rls_policies_v2.sql
    0044_custom_fields.sql
    0045_form_builder.sql
    0046_system_forms.sql
    0047_application_pipeline.sql
    0048_appointments.sql
    0099_seed_cca.sql             # CCA tenant seed data
public/
  pwa/
    icon-192.png
    icon-512.png
    apple-touch-icon.png
  manifest.webmanifest
docs/
  CCA_BUILD_BRIEF.md            # this file
```

---

## 7. The check-in / check-out system (most critical feature — build like Apple would)

This is the centerpiece of the parent experience. A parent arriving at 7:15 AM holding a toddler and a coffee must be able to check in their child in **under 10 seconds**.

### Check-in flow
1. **Parent opens PWA** → auto-navigates to `/portal/parent/check-in` if it detects they're at the school (optional geofence) or they tap "Check in" from dashboard.
2. **QR scan** — staff member at the door scans the parent's phone screen (which shows a large QR code per child). OR the parent taps a kiosk tablet that reads the QR. OR the parent enters a 6-digit PIN.
3. **Health screening** — quick toggle: "Does [Child's Name] have fever, rash, vomiting, or diarrhea?" Yes = flagged for teacher review. No = proceed.
4. **Allergy acknowledgment** — if the child has **any** allergy flagged `severe` or `life_threatening`, a red banner appears: "Reminder: [Child's Name] has a life-threatening allergy to [allergen]. EpiPen is in [location]." Staff must tap "Acknowledged" before check-in completes.
5. **Confirmation** — "Sophia is checked in to the Butterfly Room. Have a great day!" with a checkmark animation. Auto-notification to the classroom's lead teacher.

### Check-out flow
1. Parent (or authorized pickup) arrives and taps "Check out" or staff initiates from the classroom view.
2. **Pickup verification** — system checks `authorized_pickups` for that student + that day (custody-schedule-aware).
   - If the pickup person is the checked-in parent → one-tap checkout.
   - If the pickup person is an authorized non-parent → photo ID check by staff + photo match against stored photo. Staff toggles "ID verified."
   - If the pickup person is **not authorized** → **SYSTEM BLOCKS CHECKOUT**. Red alert screen. Admin notified immediately via push + SMS. Incident logged.
3. **Confirmation** — "[Child] checked out at [time] by [Person]. See you tomorrow!"
4. Auto-notification to parent (if pickup was by non-parent): "[Person] picked up [Child] at [time]."

### Acceptance criteria
- [ ] Check-in completes in <10 seconds from QR scan to confirmation.
- [ ] Allergy banner appears for every child with severe/life-threatening allergies, every single time, no exceptions.
- [ ] Unauthorized pickup attempt is blocked and admin is alerted within 30 seconds.
- [ ] QR codes rotate monthly. Old codes are rejected with a friendly "please refresh your QR code" message.
- [ ] Check-in works offline (queues and syncs when connection returns).
- [ ] Custody schedule is respected — if today is dad's day, mom's QR check-out triggers a staff verification step.
- [ ] Every check-in and check-out writes to `audit_log`.

---

## 8. Classroom management

### Roster
- Each classroom has a max capacity set by licensing. The system enforces it — you cannot assign a 21st student to a 20-capacity room.
- Age range enforcement: a 4-year-old cannot be assigned to the infant room. Warnings (not hard blocks) when a child is within 30 days of aging out of their current classroom's range.
- Ratio indicator is always visible: "12 students / 2 staff = 6:1 ratio (required: 10:1) ✅" or "⚠️ 11 students / 1 staff = 11:1 (required: 10:1 — NEED AIDE)".

### Daily schedule
- Each classroom has a template: `8:00 Arrival → 8:30 Circle Time → 9:00 Centers → 9:45 Snack → 10:15 Outdoor → 11:00 Story → 11:30 Lunch → 12:00 Nap → 2:00 Wake/Snack → 2:30 Afternoon Activities → 3:30 Pickup begins`.
- Staff log actual vs planned (drag to reorder, tap to mark complete).
- Daily schedule is visible to parents in the daily report.

### Who-is-here board
- Real-time view of every student currently checked in per classroom.
- Shows: student photo, name, allergy badges, check-in time, who dropped off.
- Absent students shown in a dimmed row with "Absent — [no check-in today]" and an optional "Mark excused" action.
- Pull-to-refresh on mobile. Realtime via Supabase channel.

---

## 9. Staff management

### Time clock
- Staff clock in/out from the app (with optional geofence verification).
- Break tracking: staff tap "Start break" / "End break" — enforces minimum break duration per state law.
- Overtime calculated automatically based on configured rules (>40 hrs/week, or >8 hrs/day if configured).
- Admin dashboard shows who's clocked in, who's late, who's approaching overtime.

### Scheduling
- Weekly schedule grid per staff member.
- Drag-and-drop classroom assignment per time block.
- Conflict detection: can't schedule same person in two classrooms at the same time.
- Ratio preview: as you build the schedule, the system shows which classrooms will be under-ratio and when.

### Certifications & background checks
- Dashboard of all staff certs with expiry dates.
- 60-day, 30-day, 7-day automated alerts before expiry.
- Expired cert = staff member is flagged (cannot be counted toward ratio until renewed, at admin's discretion).
- Background check status tracked per staff member.

### Payroll prep
- Weekly or biweekly payroll run wizard:
  1. Select period.
  2. Review time entries (approve/edit).
  3. Calculate gross: regular hours × rate + overtime × 1.5 × rate + PTO hours × rate.
  4. Preview deductions (configured per employee — admin enters withholding info, not computed by us).
  5. Export CSV in ADP, Gusto, or QuickBooks format.
  6. Mark as exported.
- PTO tracking: accrual, usage, balance, requests with approval flow.

---

## 10. Daily reports (the feature parents will love)

### Staff experience
- From the classroom view, staff tap a student's card → "Add to daily report."
- Quick-entry buttons: Meal, Nap, Diaper, Activity, Mood, Photo, Note.
- Each entry is timestamped and attributed to the staff member.
- At end of day, lead teacher taps "Publish" → report becomes visible to parents.
- Bulk actions: "All students had lunch" → pre-fills meal entries for every checked-in student.

### Parent experience
- Push notification: "Sophia's daily report is ready!"
- Beautiful timeline view of the day: meals with portions, nap duration with sleep quality, activities with photos, mood indicators, milestone celebrations.
- Parents can "heart" entries (optional engagement signal for staff).
- Past reports browsable by date. Search by entry type.

### Acceptance criteria
- [ ] Staff can add a daily report entry in under 15 seconds on a phone.
- [ ] Bulk meal entry covers all checked-in students in under 30 seconds.
- [ ] Published report reaches parent's phone via push within 60 seconds.
- [ ] Photos in daily reports are stored in private Supabase Storage bucket with signed URLs (expire after 24 hours for shares, persistent for the family).
- [ ] Reports cannot be un-published once parents have viewed them (edits create amendments visible to parents as "Updated at [time]").

---

## 11. Messaging

### Channel types
1. **Direct** — parent ↔ teacher, parent ↔ admin, teacher ↔ admin.
2. **Classroom** — all parents in a classroom + the classroom's staff. Used for announcements like "Wear pajamas Friday!"
3. **Broadcast** — admin to all parents, or admin to all staff. One-way with optional replies.
4. **Staff-only** — internal channels. Parents never see these.

### Features
- Text, photo, and file messages.
- "Urgent" flag: bypasses quiet hours, push + SMS for the recipient.
- Read receipts (admin can see who's read a broadcast).
- Message search.
- Mute per conversation.

### Rules
- Parents cannot message other parents through the system (privacy).
- Aides cannot initiate parent conversations (goes through lead teacher).
- All messages are retained for 3 years (licensing requirement).

---

## 12. Payments architecture

### Tuition billing (Stripe Subscriptions)
- Each student's enrollment maps to a Stripe Subscription on the family's Stripe Customer.
- Monthly/weekly billing depending on the plan.
- Sibling discounts, staff discounts, military discounts, church member discounts — all configurable per billing plan.
- Billing splits: if Student A is 60% Family 1 / 40% Family 2, two separate invoices are generated with proportional amounts.

### Ad-hoc charges (Stripe Invoicing)
- Field trips, supply fees, late pickup fees, registration fees.
- Admin creates charge → attached to next invoice or sent immediately.

### Payment methods
- ACH (preferred, lower fees).
- Credit/debit card (Stripe).
- Cash/check (recorded manually by admin for reconciliation).

### Late fees
- Configurable grace period per plan (default 5 days).
- Auto-applied after grace period.
- Admin can waive with a reason (audit-logged).

### Tax statements
- Annual statement for dependent-care FSA / child-care tax credit.
- Includes school EIN, address, total paid per child per calendar year.
- Parent downloads from portal; admin can bulk-generate.

### Acceptance criteria
- [ ] Parent can set up auto-pay in under 2 minutes.
- [ ] Split billing generates correct proportional invoices for shared-custody students.
- [ ] Late fees auto-apply correctly after grace period.
- [ ] Annual tax statement is accurate to the penny.
- [ ] Failed payment retries per Stripe Smart Retries; after 3 failures, admin is notified and family account is flagged.

---

## 13. Notifications

Single dispatcher in `lib/notifications/send.ts`:
```ts
sendNotification({
  to: userId,
  template: 'check_in_confirmation',
  payload: {...},
  channels: ['in_app','push','email'],
  urgency: 'normal',
})
```
- The dispatcher reads `notification_preferences` and writes one row per channel attempt to `notification_deliveries`.
- Templates are React components for email/in-app, plain strings for SMS.
- Quiet hours per user (default 9p–6a) suppress non-urgent SMS/push.
- **Urgent notifications (unauthorized pickup, ratio violation, emergency) bypass all quiet hours and preference settings.**

### Key notification templates
| Event | Recipient | Channels | Urgency |
|---|---|---|---|
| Child checked in | Parent (if not the one who checked in) | push, in-app | normal |
| Child checked out by non-parent | Parent | push, sms, in-app | high |
| Unauthorized pickup attempt | Admin + parent | push, sms, email, in-app | critical |
| Daily report published | Parent | push, in-app | normal |
| Payment received | Parent | email, in-app | normal |
| Payment failed | Parent + admin | email, push, in-app | high |
| Invoice generated | Parent | email, in-app | normal |
| Late pickup (15 min after close) | Parent + admin | sms, push | high |
| Ratio violation | Admin | push, sms, in-app | critical |
| Staff cert expiring (30 days) | Admin + staff member | email, in-app | normal |
| Enrollment application received | Admin | push, in-app | normal |
| Enrollment approved | Parent | email, push, in-app | normal |
| Incident report filed | Parent + admin | email, push, in-app | high |
| Emergency broadcast | All parents + all staff | push, sms, email, in-app | critical |
| Emergency lockdown initiated | All parents + all staff | push, sms, email, in-app | critical |
| Emergency all-clear | All parents + all staff | push, sms, in-app | critical |
| Carline — parent arrived | Classroom teacher | push, in-app | normal |
| Drop-in booking confirmed | Parent | push, email, in-app | normal |
| Drop-in booking cancelled | Parent + admin | in-app | normal |
| Subsidy authorization expiring (30 days) | Admin + parent | email, in-app | normal |
| Checklist item overdue | Parent or staff | push, email, in-app | high |
| Document expiring (60/30/7 days) | Admin + entity owner | email, in-app | normal |
| Survey available | Target audience | push, email, in-app | normal |
| CACFP claim ready for review | Admin | in-app | normal |
| Training hours behind pace | Staff member + admin | email, in-app | normal |
| Tour scheduled | Admin + lead | email, in-app | normal |
| Lead follow-up due | Admin | push, in-app | normal |
| Calendar event reminder (24hr) | Relevant audience | push, in-app | normal |
| Field trip permission slip due | Parent | push, email, in-app | high |
| Newsfeed post (classroom) | Classroom parents | push, in-app | normal |
| Budget category at 90%+ | Admin | push, in-app | high |
| DFPS ratio violation | Admin | push, sms, in-app | critical |

---

## 14. Hardware abstraction layer

### Door control interface
```ts
// lib/hardware/door-control.ts
interface DoorController {
  unlock(doorId: string, userId: string, reason: string): Promise<{ success: boolean; error?: string }>
  lock(doorId: string, userId: string): Promise<{ success: boolean; error?: string }>
  getStatus(doorId: string): Promise<'locked' | 'unlocked' | 'error' | 'offline'>
  onStatusChange(doorId: string, callback: (status: string) => void): () => void
}
```
- Default adapter: HTTP POST to a configurable endpoint with bearer token auth. Covers most smart lock APIs (August, Yale, Kisi, Brivo, etc.).
- Auto-lock timer: configurable per door (default 10 seconds after unlock).
- Access rules enforced server-side before any unlock command.
- Every unlock/lock/denied event logged to `door_access_log`.

### Camera feed interface
```ts
// lib/hardware/camera.ts
interface CameraFeed {
  getStreamUrl(cameraId: string): Promise<string>  // Returns signed RTSP/HLS URL
  getSnapshot(cameraId: string): Promise<Buffer>
  getMotionEvents(cameraId: string, from: Date, to: Date): Promise<MotionEvent[]>
  bookmark(cameraId: string, timestamp: Date, label: string): Promise<void>
}
```
- Default adapter: ONVIF-compliant IP cameras. Most commercial cameras support ONVIF.
- Stream displayed via HLS.js in the browser (camera system transcodes RTSP → HLS).
- Admin-only access to live feeds. Staff see only their assigned classroom's camera.
- No recording storage in our system — that lives on the camera system's NVR. We just display and bookmark.

---

## 15. Enrollment pipeline (marketing → portal)

Same architecture as Yes Mamms application queue:

```
Marketing site enrollment form
   ↓ (Server Action with Zod validation)
Supabase table: enrollment_applications
   ↓ (Realtime channel)
Portal page: /portal/admin/enrollment
   ↓ (Approve action — Server Action)
Creates: family + parent user + student + classroom assignment
   ↓ (Resend email)
Parent onboarding begins
```

### Triage scoring (auto-computed trigger)
- Age match to available classroom capacity (40 pts)
- Program type match to openings (20 pts)
- Sibling already enrolled (15 pts)
- Church member (10 pts)
- Referral from current family (10 pts)
- Geographic proximity (5 pts)

### Approval flow
1. **Approve** → creates family, parent user, student with `enrollment_status = enrolled`. Sends magic-link onboarding email.
2. **Waitlist** → sets status, notifies parent with position number.
3. **Reject** → sets status, sends polite decline email.
4. **Request info** → templated email asking for missing information.

---

## 16. PWA & mobile-perfection

- `public/manifest.webmanifest` with portrait and landscape, brand theme color.
- Workbox-generated service worker.
- Offline shell: check-in screen caches student QR data so check-in works during brief outages (queues and syncs).
- Background sync queue for check-ins, attendance entries, and daily report entries.
- Web Push (VAPID).
- iOS install prompt component.

**Touch targets:** 48px minimum. Bottom action bar on phone for primary actions (Check in / Add entry / Clock in).

**Check-in kiosk mode:** full-screen, auto-return to scan screen after 15 seconds of inactivity. Accessible from admin settings.

---

## 17. Accessibility & i18n

- Full WCAG 2.2 AA compliance.
- `aria-live` regions for check-in confirmations and attendance changes.
- Keyboard-only flows verified for: check in a child, record attendance, publish a daily report, make a payment.
- Screen-reader pass on the check-in flow, the daily report timeline, and the billing page.
- i18n is **out of scope for v1** but every user-facing string goes through a `t()` helper. Wires to `next-intl` in phase 2 (Spanish is the priority second language for CCA's community).

---

## 18. Security & compliance

- **No PHI storage** beyond what's required for child safety (allergies, medications, emergency protocols, immunization records for licensing). No medical record numbers, no SSNs for children.
- **COPPA compliance:** no data collected directly from children. All data entered by parents or staff.
- **Encryption at rest:** Supabase default (AES-256). Sensitive columns (direct deposit info, tax IDs) wrapped with `pgcrypto`.
- **Encryption in transit:** TLS everywhere; HSTS.
- **Secrets:** server-only via `process.env`; never in client bundles.
- **2FA:** WebAuthn optional for admin. Always required for payroll export and bulk student data export.
- **Audit log:** immutable, append-only.
- **Data retention:** student records soft-deleted, 7-year retention. Attendance records retained per state requirements. Messages retained 3 years.
- **Rate limiting:** via `proxy.ts` edge middleware.
- **Photo storage:** all child photos in private Supabase Storage buckets. Signed URLs with expiry. Never served from a public CDN.

---

## 19. Migration from SuiteDash

Ground rules (same as Yes Mamms):

- **Never write to SuiteDash.** Read-only export only. Every action in SuiteDash may trigger a real parent email.
- Build `scripts/import-suitedash/` of idempotent loaders.
- Each loader writes a row to `legacy_suitedash_ids`.
- Run order: students → families → family members → classrooms → classroom assignments → staff → enrollment history → billing history.
- Keep SuiteDash live in parallel for at least 30 days.
- Provide a migration dashboard at `/portal/admin/migration`.

### Phase 0 — Data export (read-only)
Use **Claude in Chrome** to navigate SuiteDash. Each adapter:
- Navigates to a list view, paginates, scrapes IDs, opens each detail view, captures structured fields + attachments.
- **Never** clicks save, send, delete, archive, or any mutation button.
- Writes to `exports/suitedash/{entity}/{id}.json` plus a `manifest.csv`.
- Idempotent — re-running updates manifest, skips unchanged records.

### Phase 1 — Mapping
- Reconcile student/family data.
- Map SuiteDash contacts to parents vs. students vs. staff.
- Parse any structured data from free-text fields.

### Phase 2 — Idempotent loaders
- Each takes JSON export → writes to new schema → records in `legacy_suitedash_ids`.
- Every loader has `--dry-run`.

### Phase 3 — Cutover
- Stand up portal in production behind feature flag.
- Walk admin through the data in a screenshare.
- Flip the flag.
- Do not delete SuiteDash data for 30 days.

---

## 20. Acceptance criteria

**Per page:**
- [ ] Mobile (375px), tablet (768px), desktop (1440px) all work.
- [ ] Lighthouse PWA score = 100 on production build.
- [ ] No console warnings, no hydration mismatches.
- [ ] Server Components by default; `'use client'` only where genuinely needed.
- [ ] Every form validates with Zod server-side.
- [ ] Loading and error states implemented (brand skeleton, not raw spinners).

**Per feature:**
- [ ] RLS policy verified by attempting an unauthorized read/write in a test.
- [ ] Audit log entry written for every state change.
- [ ] Notification fired (or explicitly suppressed with a comment) for every state change.
- [ ] Reduced motion respected.
- [ ] Keyboard navigation complete.

**Per data model change:**
- [ ] Migration is reversible or explicitly marked irreversible with reason.
- [ ] `database.types.ts` regenerated.
- [ ] Seed file updated.

**Project-wide:**
- [ ] `npm run build` zero warnings.
- [ ] `npm run lint` clean.
- [ ] `npm run test` (Vitest) and `npm run e2e` (Playwright) green.
- [ ] PWA installs on iOS and Android, push notifications received.
- [ ] Stripe test-mode end-to-end: enroll student → generate invoice → parent pays → receipt issued.
- [ ] Sentry receives a synthetic error in preview deploy.
- [ ] Check-in end-to-end: QR scan → health screening → allergy ack → confirmation in <10 seconds.

---

## 20A. CCA vs SuiteDash — gap analysis

### Modeling
- ✅ Students are first-class (not "contacts")
- ✅ Families are first-class with blended family support
- ✅ Classrooms are first-class (not "projects" or "tags")
- ✅ Staff are first-class with credentials, certs, and payroll
- ✅ Custody schedules are modeled and enforced at check-out
- ✅ Authorized pickup lists are per-student, per-family, photo-verified

### Check-in / check-out
- ✅ QR scan + PIN + staff manual — under 10 seconds
- ✅ Health screening at check-in
- ✅ Allergy banner on every check-in for severe/life-threatening
- ✅ Authorized pickup enforcement (hard block, not soft warning)
- ✅ Custody-schedule-aware check-out
- ✅ Photo verification for non-parent pickup
- ✅ Offline check-in capability (queue and sync)
- ✅ Kiosk mode for lobby tablet

### Attendance
- ✅ Real-time who-is-here board per classroom
- ✅ Ratio compliance indicator (auto-computed every 15 min)
- ✅ Absent/late alerts to parents
- ✅ Attendance records are append-only; corrections are amendments
- ✅ Daily attendance reports for state licensing

### Daily reports
- ✅ Per-child timeline: meals, naps, diapers, activities, mood, milestones, photos
- ✅ Staff enter on phone throughout the day — under 15 seconds per entry
- ✅ Bulk entries (all students had lunch)
- ✅ Push notification when published
- ✅ Beautiful parent-facing timeline view with photos

### Billing
- ✅ Stripe subscriptions for recurring tuition
- ✅ Split billing across households (blended families)
- ✅ Sibling/staff/military/church discounts
- ✅ Late fee automation with configurable grace period
- ✅ Annual tax statements for dependent-care FSA
- ✅ ACH preferred, card fallback, cash/check manual recording
- ✅ Failed payment retries + admin notification

### Staff management
- ✅ Time clock with break tracking
- ✅ Overtime calculation
- ✅ Payroll export (ADP/Gusto/QuickBooks CSV)
- ✅ PTO tracking with request/approval flow
- ✅ Certification tracking with auto-expiry alerts
- ✅ Background check status tracking
- ✅ Schedule builder with ratio preview

### Messaging
- ✅ Direct, classroom, broadcast, staff-only channels
- ✅ Photo/file sharing
- ✅ Urgent flag with push override
- ✅ Read receipts
- ✅ Parents cannot message other parents (privacy)
- ✅ 3-year retention

### Curriculum
- ✅ Weekly lesson plan editor per classroom
- ✅ Faith component field
- ✅ Activity library with learning standards alignment
- ✅ Staff log which activities were actually completed
- ✅ Optional parent visibility

### Hardware
- ✅ Door control abstraction — unlock from app, access log, role-based, auto-lock
- ✅ Camera feed abstraction — live view, snapshots, motion events, bookmarks
- ✅ Both are hardware-agnostic with adapter pattern

### Compliance
- ✅ Ratio compliance auto-checks every 15 minutes
- ✅ Licensing document tracker with expiry alerts
- ✅ Incident report system with parent notification
- ✅ Staff cert/background check dashboard
- ✅ 7-year student record retention
- ✅ Append-only audit log

### Enrollment
- ✅ Marketing site form → application queue → admin review
- ✅ Auto-scored, sortable
- ✅ Waitlist management
- ✅ One-tap approve → parent onboarding begins
- ✅ Same Supabase tables — no second database, no manual re-entry

### PWA / mobile
- ✅ Installs to home screen
- ✅ Offline check-in with queue-and-sync
- ✅ Web Push notifications
- ✅ Bottom action bar on phone
- ✅ Kiosk mode for check-in tablet

### Things SuiteDash forces but we throw away
- ❌ Contacts as students → first-class student entity with medical profile
- ❌ Projects as classrooms → first-class classroom with ratio enforcement
- ❌ Free-text tasks → typed attendance records with amendments
- ❌ Generic forms → structured check-in with health screening + allergy ack
- ❌ Manual "your child is here" messages → automated check-in confirmations
- ❌ Generic invoicing → tuition subscriptions with split billing
- ❌ No custody model → custody schedules enforced at check-out

---

## 21. Out of scope (v1)

- Multi-language UI (wired with `t()` but not translated).
- Bus/transportation tracking.
- Native mobile apps (PWA only — Capacitor wrap is phase 2).
- Video conferencing for parent-teacher conferences.
- ~~White-label / multi-school (CCA is the only tenant).~~ **MOVED IN SCOPE** — platform is multi-tenant from day one. See `PLATFORM_ARCHITECTURE.md`.

---

## 22. Build sequence (suggested — v3.0 updated)

> **Canonical build plan:** See `OVERNIGHT_BUILD_PLAN.md` for the complete 17-phase continuous build plan (Phases 0–17). That document supersedes the summary below for execution order. The list below is retained as a quick reference.
>
> v3.0: Multi-tenant infrastructure (Phase 0 in the build plan) comes first. v2.0 feature areas are layered in at logical points.

1. **Foundations:** route group `(portal)`, Supabase Auth wired, role helpers, RLS policies.
2. **Identity & onboarding:** login, role chooser, parent onboarding wizard, staff invite flow.
3. **Student CRUD + medical profiles + allergies + immunizations + authorized pickups.** Include student notes, quick-card, student timeline, universal search (§41).
4. **Family CRUD + blended family support + custody schedules + billing splits.** Include family dashboard, relationship visualization, family notes (§41).
5. **Classroom CRUD + capacity + Texas DFPS ratio engine (§39) + roster management.**
6. **Check-in / check-out system (the centerpiece).** Include carline / pickup queue (§30).
7. **Attendance dashboard + ratio compliance (Texas-specific §39).**
8. **Daily reports (staff entry + parent view).** Include daily itinerary / teacher "My Day" view, batch operations, end-of-day review, parent prep checklists (§42).
9. **Staff management + time clock + scheduling.**
10. **Payroll prep + PTO + professional development tracker (§38).**
11. **Payments: Stripe subscriptions + invoicing + split billing + tax statements + application fees + registration fees + credits + tuition agreements + subscription management (§40).**
12. **Messaging system + newsfeed + scheduled messages + templates (§43).**
13. **Curriculum & lesson planning + child development portfolios + learning stories + assessments (§27).**
14. **Door control + camera feed abstraction layers.**
15. **Enrollment pipeline (marketing → portal) + enrollment CRM + lead management + tour scheduling + automated follow-ups (§28).**
16. **Notifications dispatcher + templates.**
17. **CACFP food program: menu planner + meal recording + CACFP claims (§25).**
18. **Expense tracking + accounting integration + QuickBooks/Xero export + financial dashboard (§26).**
19. **Subsidy tracking + agency management + mixed-funding invoices + claims (§32).**
20. **Checklists: template builder + auto-assignment + e-signatures + onboarding flows (§34).**
21. **Document vault: entity-scoped storage + versioning + expiry + inspection prep (§35).**
22. **Calendar + events: school calendar + field trips + RSVPs + closure days (§36).**
23. **Parent satisfaction surveys: builder + NPS + distribution + reporting (§29).**
24. **Drop-in / flex scheduling: availability + booking + capacity-aware billing (§31).**
25. **Advanced analytics dashboard + custom reports + scheduled delivery (§33).**
26. **Texas DFPS compliance module: standards checklist + inspection prep + deficiency tracker (§39).**
27. **Emergency broadcast + lockdown mode + reunification (§37).**
28. **Custom fields system: entity-scoped custom fields engine, admin UI, search/filter integration (§44).**
29. **Form builder: conversational + document mode, 30+ field types, logic engine, e-signatures, payment, embedding, templates (§45).**
30. **System enrollment form: 7-step wizard, multi-child repeater, fee toggle, form instance spawning (§46).**
31. **Application pipeline: multi-step enrollment flow, interview invitation, pipeline tracking (§47).**
32. **Appointment booking: Calendly-style widget, staff availability, Google/Outlook/iCal sync (§48).**
33. **PWA + push + kiosk mode.**
34. **Audit log viewer + impersonation.**
35. **Migration scripts (after SuiteDash audit).**
36. **Lighthouse pass, accessibility pass, security review.**
37. **Vercel preview → Skylar smoke test → production cutover.**

---

## 23. When in doubt

- **Ask: "Would Apple ship this?"** If the answer is no, redo it.
- **Ask: "Will a parent holding a toddler and a coffee succeed one-handed?"** If not, simplify.
- **Ask: "Is this a SuiteDash habit, or what the real world looks like?"** If it's the former, throw it out and remodel.
- **Ask: "Does this protect the children?"** If there's any doubt, lock it down tighter.
- **Ask: "Is this hardcoded or tenant-configurable?"** If it's hardcoded, you're breaking multi-tenancy.
- **Ask: "Does this RLS policy include `tenant_id`?"** If not, you have a data leak.
- **Beauty wins ties.**
- **No new dependencies without a one-line justification.**
- **Every server action validates with Zod. Every. Single. One.**

---

---

## 24. Competitive gap analysis — CCA vs. the industry (v2.0 addition)

> This section was added after a comprehensive audit of Brightwheel, Procare, Lillio (HiMama), Kangarootime, Playground, Famly, Sandbox, LineLeader/ChildcareCRM, and MyKidReports. Every gap identified below is now IN SCOPE for v1. The goal is not feature parity — it's category dominance. CCA should be the platform that makes directors at other preschools say "I wish we had that."

### What competitors do that our v1.0 spec already matched or exceeded
- Check-in/check-out (QR, PIN, kiosk) — we exceed with custody enforcement, photo-verify, offline, allergy ack
- Daily reports with photos — we match with richer typed entries (mood, milestones, diapers, naps)
- Attendance tracking + ratio monitoring — we exceed with append-only amendments and 15-min auto-checks
- Billing + auto-pay + late fees — we match with split billing that no competitor handles well
- Staff time clock + scheduling — we match
- Messaging with urgency flags — we exceed with SMS override and read receipts
- Curriculum / lesson planning — we match
- Enrollment pipeline — we match with auto-scoring that most competitors lack

### Gaps our v1.0 spec did NOT cover — now added

| # | Feature | Who has it | Why we need it | New section |
|---|---|---|---|---|
| 1 | **CACFP food program management** | Brightwheel, Playground, Procare | Federal reimbursement $$. Meal planning, food component tracking, attendance-linked claiming, USDA compliance reporting. | §25 |
| 2 | **Expense tracking + accounting integration** | Brightwheel (expense tracking), Procare (QuickBooks sync) | Centers run on thin margins. Expense categorization, receipt capture, P&L by classroom, QuickBooks Online export. | §26 |
| 3 | **Child development portfolios** | Lillio, LineLeader, Procare | Parents want developmental evidence, not just daily snapshots. Photo/video observations tagged to learning domains, portfolio PDF export, developmental progress reports. | §27 |
| 4 | **Enrollment CRM + lead management** | LineLeader, Playground, Brightwheel | Enrollment is revenue. Lead capture from multiple sources, automated follow-up sequences, tour scheduling, conversion tracking, pipeline dashboard. | §28 |
| 5 | **Parent satisfaction surveys** | Lillio, Famly | Feedback loop. Configurable survey builder, scheduled distribution, anonymous option, aggregate reporting, NPS tracking. | §29 |
| 6 | **Carline / pickup queue management** | Playground, Carline app | Dismissal is chaos. Digital queue, parent arrival notification to classroom, ordered release, carline status board. | §30 |
| 7 | **Drop-in / flex scheduling** | Kangarootime, ChildPilot | Revenue optimization. Parents book ad-hoc days, real-time availability by classroom, drop-in billing, capacity-aware. | §31 |
| 8 | **Subsidy tracking + state reporting** | Procare, Brightwheel, Playground | Many families receive CCDF vouchers. Track subsidy amounts, co-pays, agency billing formats, reconciliation, mixed-funding invoices. | §32 |
| 9 | **Advanced reporting + analytics dashboard** | Procare, Kangarootime, Famly | Directors need business intelligence. Revenue forecasting, enrollment trends, attendance patterns, staff cost analysis, classroom utilization, ratio compliance trends. | §33 |
| 10 | **Parent & staff checklists** | Playground, Brightwheel | Onboarding and daily ops. Configurable checklist templates, assignment by role/family, completion tracking, deadline alerts. | §34 |
| 11 | **Document management vault** | Procare, Brightwheel | Licensing requires document retention. Organized by entity (student, staff, family, school), version tracking, expiry alerts, e-signature collection, bulk download. | §35 |
| 12 | **Calendar + events system** | Brightwheel, Famly | School calendar, field trips, closures, sign-up forms, RSVP tracking, automatic schedule adjustments on closure days. | §36 |
| 13 | **Emergency broadcast + lockdown mode** | None do this well | CCA-differentiator. One-tap lockdown, all-channel blast, door auto-lock, camera auto-record, parent reunification checklist, incident timeline. | §37 |
| 14 | **Staff professional development + training tracker** | Lillio (Lillio Academy) | Cert tracking is not enough. Training hour logging, required annual hours by state, PD goal setting, course completion records. | §38 |
| 15 | **Texas DFPS compliance module** | None — all are generic | CCA-differentiator. Texas-specific ratio tables baked in, minimum standards checklist, inspection prep mode, deficiency tracker, auto-generated compliance reports. | §39 |

---

## 25. CACFP food program management

> Brightwheel charges extra for this. Playground makes it a headline feature. We build it in.

### Why
The Child and Adult Care Food Program (CACFP) provides federal reimbursement for meals and snacks served to children in care. Most Texas preschools participate. Proper tracking can reimburse $3–5 per child per day. For a 60-child center, that's $900–1,500/month in recovered revenue.

### Data model additions

```
- `meal_menus` — `(id, classroom_id nullable, date, meal_type [breakfast/am_snack/lunch/pm_snack/supper], items jsonb, food_components jsonb, meets_cacfp_pattern boolean, created_by, notes)`.
  - `food_components`: `{ grains: boolean, meat_alt: boolean, vegetable: boolean, fruit: boolean, milk: boolean }` per USDA meal pattern.
- `meal_service_records` — `(id, student_id, meal_menu_id, date, meal_type, served boolean, amount_eaten [all/most/some/none], substitution_reason, allergy_substitution boolean, notes, recorded_by, recorded_at)`.
- `cacfp_claims` — `(id, claim_month, claim_year, status [draft/submitted/paid/rejected], total_meals_claimed, total_reimbursement_cents, submitted_at, submitted_by, paid_at, paid_amount_cents, notes)`.
- `cacfp_claim_lines` — `(id, claim_id, meal_type, eligible_count, claimed_count, rate_cents, subtotal_cents)`.
```

### Features
- **Menu planner** — weekly menu builder with USDA food component checklist. Warns if a meal is missing a required component. Copies menus week-to-week.
- **Allergy-aware meal service** — when recording meals, students with food allergies are flagged with red badges. Substitution tracking for allergic children.
- **Bulk meal recording** — "All checked-in students served lunch" one-tap, then mark exceptions. Links to attendance (only checked-in students are claimable).
- **CACFP claim generator** — monthly report: eligible meal counts by type, reimbursement calculation at current federal rates. Exportable as PDF or CSV for submission to sponsoring agency.
- **Meal-to-daily-report sync** — meal entries auto-populate the daily report for parents (what was served, how much eaten).
- **Kitchen view** — daily prep screen: today's menu, headcount by classroom (from attendance), allergy list for today's checked-in children.

### Acceptance criteria
- [ ] Menu planner validates USDA food components per meal type.
- [ ] Bulk meal recording only includes students with active check-in for that day.
- [ ] CACFP claim report matches manual calculation to the penny.
- [ ] Allergy students are visually flagged during meal service recording.
- [ ] Meal records sync to daily reports without duplicate entry.

---

## 26. Expense tracking + accounting integration

> Brightwheel has basic expense tracking. Procare has QuickBooks sync. Neither does both well. We do.

### Why
Childcare is a thin-margin business. Directors need to see P&L by classroom, track supply costs, and get data into their accountant's system without re-keying. The #1 complaint about Brightwheel's accounting: "manually pulling expenses into QuickBooks drains hours each month."

### Data model additions

```
- `expense_categories` — `(id, name, parent_category_id, gl_code, description, is_active)`. Seed with: Classroom Supplies, Food & Kitchen, Facility, Insurance, Licensing Fees, Marketing, Office, Payroll (link only), Professional Development, Technology, Transportation, Utilities, Other.
- `expenses` — `(id, category_id, amount_cents, date, vendor, description, receipt_path, payment_method [card/check/cash/ach/auto], classroom_id nullable, recurring boolean, recurring_frequency, approved_by, approved_at, created_by, notes)`.
- `expense_receipts` — `(id, expense_id, file_path, uploaded_at, uploaded_by)`.
- `accounting_exports` — `(id, export_type [quickbooks_csv/xero_csv/general_ledger], period_start, period_end, generated_at, generated_by, file_path, row_count)`.
```

### Features
- **Expense entry** — quick-add with category, amount, vendor, optional receipt photo (phone camera). Classroom-assignable for per-classroom P&L.
- **Receipt capture** — photo upload from phone. OCR extraction of amount/vendor/date is a nice-to-have (v2) but the upload + manual entry is v1.
- **Recurring expenses** — rent, insurance, subscriptions auto-generate monthly entries.
- **Budget vs actual** — set monthly budgets per category. Dashboard shows spend vs. budget with color-coded variance.
- **Revenue integration** — tuition payments (from Stripe) auto-populate the revenue side. Combine with expenses for true P&L.
- **QuickBooks Online export** — CSV in QBO import format. Maps expense categories to GL codes. One-click export per period.
- **Xero export** — CSV in Xero import format. Same mapping.
- **General ledger report** — for accountants who don't use QBO/Xero. Standard double-entry format.
- **Classroom P&L** — break down revenue (tuition from students assigned to classroom) and expenses (tagged to classroom) per classroom per month.
- **Financial dashboard** — revenue, expenses, net income, accounts receivable (outstanding invoices), cash flow trend. Monthly/quarterly/annual views.

### Acceptance criteria
- [ ] Expense entry completes in under 30 seconds on phone (photo + category + amount).
- [ ] QuickBooks CSV imports cleanly into QBO without manual data manipulation.
- [ ] Classroom P&L correctly attributes tuition revenue and tagged expenses.
- [ ] Budget vs actual alerts admin when a category exceeds 90% of monthly budget.
- [ ] Financial dashboard loads in under 2 seconds.

---

## 27. Child development portfolios

> Lillio's crown jewel. LineLeader charges premium for it. We build it as a natural extension of daily reports.

### Why
Parents don't just want to know what their child ate for lunch. They want evidence that their child is growing, learning, and hitting milestones. State licensing and accreditation bodies (NAEYC, Texas Rising Star) increasingly require developmental documentation. A portfolio turns daily observations into a developmental narrative.

### Data model additions

```
- `portfolio_entries` — `(id, student_id, entry_type [observation/work_sample/photo/video/learning_story/milestone], title, narrative, learning_domains uuid[], created_by, created_at, visibility [parent/staff_only], linked_daily_report_entry_id nullable)`.
- `portfolio_media` — `(id, entry_id, file_path, media_type [photo/video/document], caption, uploaded_at)`.
- `learning_domains` — `(id, framework [texas_prek_guidelines/naeyc/head_start_elof/cca_faith/custom], domain_name, subdomain_name, indicator, age_group, description, sort_order)`.
- `developmental_assessments` — `(id, student_id, assessment_period_start, assessment_period_end, assessor_id, status [in_progress/completed/shared_with_parent], completed_at, shared_at)`.
- `assessment_ratings` — `(id, assessment_id, learning_domain_id, rating [not_yet/emerging/developing/proficient/exceeding], evidence_notes, linked_portfolio_entry_ids uuid[])`.
```

### Features
- **Observation capture** — from classroom view, tap student → "Add observation." Photo/video + narrative + tag learning domains. Under 30 seconds.
- **Learning domain tagging** — pre-loaded with Texas Pre-K Guidelines, NAEYC standards, Head Start ELOF, and CCA faith-based domains. Multi-select. Custom domains configurable by admin.
- **Learning stories** — rich narrative format (what happened → what learning occurred → what's next). Templates available. Photos embedded.
- **Portfolio timeline** — chronological view of all entries per student. Filterable by domain, entry type, date range.
- **Developmental assessment** — periodic (quarterly recommended) structured assessment against learning domains. Teachers rate each domain with evidence links to portfolio entries.
- **Progress reports** — auto-generated from assessment data. Visual progress chart per domain over time. PDF export for parent-teacher conferences.
- **Parent portfolio view** — parents see their child's portfolio in the app (entries marked `parent` visibility). Can "heart" and comment.
- **Portfolio PDF export** — beautiful formatted PDF of a child's portfolio. Includes photos, narratives, developmental progress. Usable for kindergarten transition.
- **Daily report → portfolio bridge** — milestone and activity entries from daily reports can be promoted to portfolio entries with one tap, avoiding duplicate work.

### Acceptance criteria
- [ ] Observation entry completes in under 30 seconds on phone.
- [ ] Learning domains pre-loaded with Texas Pre-K Guidelines (all domains and indicators).
- [ ] Developmental assessment links to specific portfolio evidence.
- [ ] Progress report PDF renders correctly with charts and photos.
- [ ] Parent portfolio view shows only entries with `parent` visibility.

---

## 28. Enrollment CRM + lead management

> LineLeader (ChildcareCRM) charges $200+/month just for this. Playground includes basic lead tracking. We build a real pipeline.

### Why
Enrollment is revenue. A center that loses track of an inquiry loses $800–1,200/month in tuition. The enrollment pipeline in v1.0 handles applications well, but it starts too late — it doesn't capture the initial inquiry, the tour, the follow-up, or the conversion. Directors need to see: how many leads this month, where they came from, how many converted, and which ones fell through.

### Data model additions

```
- `enrollment_leads` — `(id, source [website/phone/walk_in/referral/facebook/google/event/other], source_detail, parent_first_name, parent_last_name, parent_email, parent_phone, child_name, child_age_months, program_interest, status [new/contacted/tour_scheduled/tour_completed/application_sent/application_received/enrolled/lost], assigned_to, priority [hot/warm/cold], lost_reason, notes, utm_source, utm_medium, utm_campaign, created_at, updated_at)`.
- `lead_activities` — `(id, lead_id, activity_type [email_sent/call_made/call_received/tour_scheduled/tour_completed/application_sent/note_added/status_changed], description, performed_by, performed_at)`.
- `lead_automations` — `(id, trigger_event, delay_hours, action_type [email/sms/task], template_id, is_active)`.
  - Example: lead created → wait 1 hour → send welcome email. Lead tour_completed → wait 24 hours → send follow-up email.
- `tours` — `(id, lead_id, scheduled_at, completed_at, conducted_by, parent_attended boolean, notes, follow_up_sent boolean)`.
```

### Features
- **Lead capture** — auto-creates lead from: enrollment form submission, contact form submission, manual entry by admin, inbound call/walk-in logging.
- **Pipeline board** — Kanban-style drag-and-drop: New → Contacted → Tour Scheduled → Tour Completed → Application Sent → Application Received → Enrolled. Also a "Lost" column.
- **Lead detail** — full activity timeline, communication history, child info, notes. One-click actions: send email, schedule tour, send application link, mark lost.
- **Tour scheduling** — schedule tours with calendar integration. Confirmation email to parent. Reminder 24 hours before. Tour completion form (notes, impressions, follow-up items).
- **Automated follow-up sequences** — configurable email/SMS sequences triggered by status changes. Example: new lead gets welcome email in 1 hour, follow-up in 3 days if no response, second follow-up in 7 days.
- **Conversion tracking** — lead → application → enrollment funnel with conversion rates at each stage. UTM attribution for marketing spend ROI.
- **Lead scoring** — auto-scored like enrollment applications: age match, program availability, sibling, church member, referral, geography.
- **Reporting** — leads by source, conversion rate by source, average time to enroll, pipeline value (leads × average tuition), lost lead reasons analysis.
- **Application bridge** — when a lead submits an enrollment application, the lead record links to the application record. No data re-entry. Full journey visible.

### Acceptance criteria
- [ ] Lead auto-created from enrollment and contact form submissions.
- [ ] Pipeline board renders correctly on phone (swipeable columns).
- [ ] Automated follow-up emails fire at configured intervals.
- [ ] Conversion funnel report accurately tracks lead → enrolled journey.
- [ ] Tour scheduling sends confirmation and reminder emails.

---

## 29. Parent satisfaction surveys

> Lillio offers basic surveys. Famly has feedback loops. Nobody does this well. We make it effortless.

### Data model additions

```
- `surveys` — `(id, title, description, target_audience [all_parents/classroom/staff/custom], classroom_id nullable, status [draft/active/closed], anonymous boolean, created_by, opens_at, closes_at)`.
- `survey_questions` — `(id, survey_id, question_text, question_type [rating_1_5/rating_1_10/multiple_choice/text/nps/yes_no], options jsonb, required boolean, sort_order)`.
- `survey_responses` — `(id, survey_id, respondent_id nullable (null if anonymous), submitted_at)`.
- `survey_answers` — `(id, response_id, question_id, answer_value, answer_text)`.
```

### Features
- **Survey builder** — drag-and-drop question builder. Question types: 1-5 star rating, 1-10 scale, NPS (0-10), multiple choice, free text, yes/no.
- **Targeted distribution** — send to all parents, specific classroom parents, all staff, or custom list. Delivered via in-app notification + email.
- **Anonymous option** — when enabled, responses are not linked to respondent. Encourages honest feedback.
- **NPS tracking** — Net Promoter Score calculated and trended over time. "How likely are you to recommend CCA to a friend?"
- **Results dashboard** — real-time aggregate results with charts. Filter by classroom, date range. Exportable.
- **Scheduled surveys** — quarterly parent satisfaction survey auto-deploys on a schedule.
- **Action items** — admin can create follow-up action items from survey results, assigned to staff with due dates.

### Acceptance criteria
- [ ] Survey creation and distribution completes in under 5 minutes.
- [ ] Anonymous surveys cannot be traced back to respondent even by admin.
- [ ] NPS score calculated correctly and trended over time.
- [ ] Results export to PDF with charts.

---

## 30. Carline / pickup queue management

> Playground has this. The dedicated Carline app charges per-school. Nobody integrates it with check-out. We do.

### Why
Dismissal at a preschool is controlled chaos. Parents arrive in a staggered line. Staff need to know who's in the parking lot, match them to the right child, and release children in order — all while keeping the line moving and keeping children safe. A digital carline turns 20 minutes of clipboard chaos into an ordered, safe process.

### Data model additions

```
- `carline_sessions` — `(id, date, status [not_started/active/completed], started_at, completed_at, started_by)`.
- `carline_queue_entries` — `(id, session_id, family_id, pickup_person_user_id nullable, pickup_person_name, arrival_method [app_checkin/staff_manual/geofence_auto], arrived_at, students_requested uuid[], status [waiting/called/released/cancelled], called_at, released_at, released_by, position_number, notes)`.
```

### Features
- **Parent arrival** — parent taps "I'm here" in the app (or geofence auto-detects arrival within configurable radius). Enters the digital queue.
- **Staff queue board** — real-time queue on classroom/lobby display: who's here, which children to get ready, ordered by arrival time.
- **Classroom notification** — when parent arrives, the child's classroom teacher gets a push: "[Parent] is here for [Child]." Teacher prepares child.
- **Ordered release** — staff taps "Release" on each child as they're walked to the car. Auto-triggers check-out record. Links to authorized pickup verification.
- **Carline status for parents** — parent sees their position in the queue and estimated wait time.
- **Multi-child families** — one queue entry covers all children in the family. All classrooms notified simultaneously.
- **Integration with check-out** — carline release = check-out. No double-entry. Same pickup authorization enforcement applies.

### Acceptance criteria
- [ ] Parent "I'm here" to child release completes in under 3 minutes in normal flow.
- [ ] Queue board updates in real-time (Supabase Realtime channel).
- [ ] Multi-child families are handled in a single queue entry.
- [ ] Carline release triggers check-out record with full audit trail.
- [ ] Unauthorized pickup person blocked at carline release same as manual check-out.

---

## 31. Drop-in / flex scheduling

> Kangarootime's drop-in feature is a revenue driver. ChildPilot specializes in it. We build it as a natural extension of classroom capacity management.

### Why
Many preschools offer drop-in days for part-time families or occasional care. It's incremental revenue with near-zero marginal cost (the classroom and staff are already there). The system needs to manage real-time availability, prevent over-capacity booking, and bill appropriately.

### Data model additions

```
- `drop_in_availability` — `(id, classroom_id, date, slots_total, slots_booked (computed), slots_remaining (computed), rate_cents, half_day_rate_cents, status [open/full/closed])`. Auto-generated from classroom capacity minus enrolled students for that day.
- `drop_in_bookings` — `(id, student_id, family_id, classroom_id, date, booking_type [full_day/half_day_am/half_day_pm], status [confirmed/cancelled/completed/no_show], booked_at, booked_by, cancelled_at, cancel_reason, rate_charged_cents, invoice_id nullable, notes)`.
```

### Features
- **Availability calendar** — parents see a calendar of available drop-in days per classroom (only classrooms their child's age qualifies for). Green = open, yellow = few spots, red = full.
- **Instant booking** — parent taps a day → confirms → spot reserved. Confirmation push notification + email.
- **Capacity enforcement** — booking blocked if classroom would exceed licensed capacity. Factors in enrolled students + already-booked drop-ins for that day.
- **Cancellation policy** — configurable: free cancellation before X hours, late cancel fee after. No-show fee.
- **Drop-in billing** — charges added to the family's next invoice or charged immediately (admin-configurable). Per-day or per-half-day rates.
- **Staff visibility** — classroom roster for the day shows enrolled students + drop-in students clearly distinguished. Allergy/medical info displays same as enrolled.
- **Recurring drop-ins** — parents can book a recurring drop-in (e.g., every Wednesday) for a set period.

### Acceptance criteria
- [ ] Availability correctly computed from classroom capacity minus enrolled + booked.
- [ ] Double-booking prevented at the database level (unique constraint on student + date + classroom).
- [ ] Drop-in students appear on classroom roster with allergy/medical info.
- [ ] Drop-in charges appear on family invoice correctly.
- [ ] Cancellation within policy window does not generate a charge.

---

## 32. Subsidy tracking + state reporting

> Procare is the gold standard here. Brightwheel added it recently. We build it right the first time.

### Why
Many CCA families may receive Child Care and Development Fund (CCDF) subsidies or state vouchers. These require tracking the subsidy amount, the family co-pay, the agency billing format, and reconciliation of what was billed vs. what was paid. Getting this wrong means delayed payments or denied claims.

### Data model additions

```
- `subsidy_agencies` — `(id, name, state, county, contact_email, contact_phone, billing_format [standard_csv/custom], payment_terms_days, notes)`.
- `family_subsidies` — `(id, family_id, student_id, agency_id, case_number, authorization_start, authorization_end, authorized_days_per_week, authorized_hours_per_day, subsidy_rate_cents_per_day, family_copay_cents_per_week, status [active/expired/pending_renewal/terminated], notes)`.
- `subsidy_attendance_records` — `(id, family_subsidy_id, date, attended boolean, hours_present, billable boolean, notes)`. Populated from attendance records for subsidy-eligible students.
- `subsidy_claims` — `(id, agency_id, claim_period_start, claim_period_end, status [draft/submitted/paid/partially_paid/denied], total_claimed_cents, total_paid_cents, submitted_at, paid_at, denial_reason, notes)`.
- `subsidy_claim_lines` — `(id, claim_id, family_subsidy_id, student_id, days_claimed, amount_claimed_cents, amount_paid_cents, adjustment_reason)`.
```

### Features
- **Agency management** — admin configures subsidy agencies with billing formats and payment terms.
- **Student subsidy enrollment** — link a student's enrollment to a subsidy authorization. Track authorization dates, eligible days/hours, rates, family co-pay.
- **Attendance-to-subsidy sync** — attendance records automatically populate subsidy attendance tracking. Only billable days (checked in, within authorized hours) are claimable.
- **Mixed-funding invoices** — family invoice shows: total tuition, subsidy-covered portion, family co-pay, private-pay balance. Single invoice, clear breakdown.
- **Claim generation** — monthly claim report per agency in the agency's required format. Admin reviews, adjusts, submits.
- **Reconciliation** — track what was claimed vs. what was paid. Flag underpayments for follow-up. Dashboard shows outstanding subsidy receivables.
- **Authorization expiry alerts** — 30-day and 7-day alerts before a subsidy authorization expires. Prompts admin to follow up with family for renewal.

### Acceptance criteria
- [ ] Subsidy attendance auto-populated from check-in/check-out records.
- [ ] Mixed-funding invoice correctly splits tuition into subsidy + co-pay + private-pay.
- [ ] Claim generation matches manual calculation.
- [ ] Authorization expiry alerts fire at configured intervals.
- [ ] Reconciliation dashboard shows outstanding subsidy receivables accurately.

---

## 33. Advanced reporting + analytics dashboard

> Procare and Kangarootime lead here. Brightwheel is basic. Famly has revenue forecasting. We build a director's cockpit.

### Features (all in `/portal/admin/analytics`)

- **Executive dashboard** — single-screen overview: current enrollment count vs capacity, revenue MTD, expenses MTD, net income, outstanding AR, attendance rate, ratio compliance score, staff hours this week, pending applications.
- **Revenue analytics** — monthly revenue trend, revenue by program type, revenue by classroom, revenue per student, projected revenue (based on enrolled subscriptions), payment method breakdown (ACH/card/cash/check), subsidy revenue vs private-pay.
- **Enrollment analytics** — enrollment over time, enrollments by program, capacity utilization by classroom, waitlist depth, lead conversion funnel, average days from inquiry to enrollment, churn (withdrawals) with reason analysis.
- **Attendance analytics** — daily/weekly/monthly attendance rate by classroom, absent patterns (which children are frequently absent), peak check-in/check-out times, average hours per child per day.
- **Staff analytics** — labor cost as % of revenue, hours worked by staff member, overtime trends, staff-to-student ratio history, certification status overview, PTO utilization.
- **Financial analytics** — P&L by classroom, expense trends by category, budget vs. actual by category, cash flow projection (upcoming tuition minus upcoming expenses), accounts receivable aging (current/30/60/90 days).
- **Compliance scorecard** — ratio compliance percentage over time, licensing document status, staff cert expiry timeline, incident reports trend, inspection readiness score.
- **Custom reports** — admin can build simple reports by selecting entity + columns + filters + date range. Export to CSV/PDF.
- **Scheduled report delivery** — configure reports to auto-generate and email weekly/monthly. Example: "Email me the weekly attendance summary every Friday at 5 PM."

### Data model additions

```
- `saved_reports` — `(id, name, entity_type, columns jsonb, filters jsonb, sort jsonb, created_by, is_scheduled boolean, schedule_frequency, schedule_recipients, last_run_at)`.
- `report_exports` — `(id, report_id, format [csv/pdf], file_path, generated_at, generated_by)`.
```

### Implementation notes
- Heavy reporting queries should run on Supabase Edge Functions (not API routes) for connection pooling and timeouts.
- For real-time dashboard, use materialized views or Supabase functions that pre-aggregate data. Refresh on a schedule (every 15 min for most metrics, real-time for attendance/ratio).
- Charts rendered with Recharts (already in the stack pattern from Yes Mamms) or native SVG for the most performance-critical widgets.

### Acceptance criteria
- [ ] Executive dashboard loads in under 3 seconds with 200 students and 12 months of data.
- [ ] Revenue report matches Stripe dashboard totals to the penny.
- [ ] Classroom P&L correctly attributes all revenue and tagged expenses.
- [ ] Scheduled reports deliver on time via email.
- [ ] Custom report builder supports all core entities (students, families, staff, attendance, billing).

---

## 34. Parent & staff checklists

> Playground and Brightwheel have basic versions. Nobody makes them great. We do.

### Why
Onboarding a new family requires collecting: emergency contacts, authorized pickups, allergy info, immunization records, signed handbook acknowledgment, photo consent, media release, field trip permission, custody documents. Tracking which families have completed which items is currently a spreadsheet nightmare. Same for staff: background check, CPR cert, transcripts, I-9, W-4, handbook acknowledgment.

### Data model additions

```
- `checklist_templates` — `(id, name, target_type [parent/staff/student], description, created_by, is_active, sort_order)`.
- `checklist_items` — `(id, template_id, title, description, item_type [document_upload/signature/acknowledgment/form_field/custom], required boolean, sort_order, deadline_days_from_assignment)`.
- `checklist_assignments` — `(id, template_id, assigned_to_user_id, assigned_to_entity_type [family/student/staff], assigned_to_entity_id, assigned_by, assigned_at, due_date, status [pending/in_progress/completed/overdue], completed_at)`.
- `checklist_responses` — `(id, assignment_id, item_id, status [pending/completed], response_value, file_path nullable, signed_at, completed_at, completed_by)`.
```

### Features
- **Template builder** — admin creates checklist templates for different scenarios: new parent onboarding, new student enrollment, new staff hire, annual re-enrollment, field trip permission, etc.
- **Item types** — document upload (immunization records, custody docs), e-signature (handbook acknowledgment, photo consent), acknowledgment (read and agreed), form field (dietary preferences, t-shirt size), custom.
- **Auto-assignment** — checklists auto-assigned when: new family created (onboarding checklist), new staff hired (employment checklist), new school year (re-enrollment checklist), field trip created (permission slip per student).
- **Parent view** — parents see their outstanding checklist items on dashboard. Clear progress bar. Tap to complete each item. Mobile-friendly file upload and e-signature.
- **Staff view** — staff see their HR checklist items. Same UX.
- **Admin tracking** — dashboard: which families/staff have completed onboarding, who's missing items, overdue items sorted by urgency. Bulk reminder email.
- **Deadline enforcement** — configurable deadlines per item. Automatic reminders at 7 days, 3 days, 1 day before due. Overdue items flagged red.
- **Annual re-enrollment** — admin triggers annual re-enrollment checklist for all active families. Tracks completion. Flags families who haven't re-enrolled by deadline.

### Acceptance criteria
- [ ] Parent can complete a checklist item (including document upload and e-signature) on phone in under 60 seconds per item.
- [ ] Admin can see overall onboarding completion percentage per family.
- [ ] Auto-assignment triggers correctly on family/student/staff creation.
- [ ] Overdue reminders fire at configured intervals.
- [ ] E-signatures stored with timestamp and IP for legal validity.

---

## 35. Document management vault

> Procare and Brightwheel have basic document storage. Nobody organizes it well. We build a vault.

### Why
Licensing inspections require specific documents to be on file and current. Parents upload immunization records, custody orders, and signed forms. Staff have certifications, background checks, and employment documents. These need to be organized, versioned, expiry-tracked, and instantly retrievable during an inspection.

### Data model additions

```
- `documents` — `(id, entity_type [student/family/staff/school/classroom], entity_id, document_type [immunization/custody_order/birth_certificate/photo_consent/medical_action_plan/handbook_ack/insurance_card/background_check/certification/license/inspection/policy/other], title, description, file_path, file_size_bytes, mime_type, version, previous_version_id nullable, uploaded_by, uploaded_at, expiry_date nullable, verified_by nullable, verified_at nullable, status [active/expired/superseded/archived], tags jsonb, checklist_response_id nullable)`.
```

### Features
- **Entity-scoped storage** — documents organized by entity: each student, family, staff member, classroom, and school-level. Clear folder structure in UI.
- **Document types** — pre-defined types with appropriate metadata: immunization (vaccine name, dose, date), certification (type, issuing body, expiry), custody order (effective date, expiry), etc.
- **Version tracking** — uploading a new version of a document supersedes the old one but preserves history. Always viewable which version was active at any point in time.
- **Expiry tracking** — documents with expiry dates (certs, background checks, immunizations, insurance) tracked in a centralized expiry dashboard. Alerts at 60/30/7 days.
- **E-signature collection** — send a document for signature (handbook, consent form, policy acknowledgment). Parent/staff signs on phone. Signed copy stored with timestamp.
- **Quick retrieval** — search across all documents by type, entity, date, expiry status. "Show me all expired immunization records" = one query.
- **Inspection mode** — admin activates "inspection prep" mode. Pre-flight checklist shows: all required documents by type, which are current, which are missing or expired. Print/PDF bundle for inspector.
- **Bulk download** — export all documents for an entity (student's complete file) as a zip. Useful for transfers and records requests.
- **Checklist integration** — documents uploaded via checklists (§34) automatically file into the vault with correct entity and type tagging.

### Acceptance criteria
- [ ] Document upload from phone (camera capture of physical document) works reliably.
- [ ] Expiry dashboard accurately shows all expiring/expired documents across all entity types.
- [ ] Inspection prep mode generates a complete compliance checklist with document status.
- [ ] Version history preservable and viewable for any document.
- [ ] Bulk download generates a correctly structured zip file.

---

## 36. Calendar + events system

> Brightwheel has calendar + event sign-ups. Famly has a family-facing calendar. We build both.

### Data model additions

```
- `calendar_events` — `(id, title, description, event_type [closure/holiday/field_trip/special_event/parent_night/chapel/staff_meeting/other], start_at, end_at, all_day boolean, recurrence_rule jsonb, location, scope [school_wide/classroom/staff_only], classroom_id nullable, created_by, requires_rsvp boolean, requires_permission_slip boolean, max_participants nullable, cost_per_child_cents nullable, notes)`.
- `event_rsvps` — `(id, event_id, family_id, student_id nullable, response [yes/no/maybe], responded_by, responded_at, notes)`.
- `event_sign_ups` — `(id, event_id, title, description, slots_total, slots_filled (computed))`. For volunteer sign-ups: "We need 3 parents to bring snacks."
- `event_sign_up_entries` — `(id, sign_up_id, family_id, user_id, signed_up_at, notes)`.
```

### Features
- **School calendar** — all events in one view. Color-coded by type. Monthly/weekly/agenda views. Filter by: school-wide, my classroom, staff-only.
- **Parent calendar view** — parents see relevant events (school-wide + their child's classroom). Closure days prominently highlighted.
- **Closure day management** — admin marks closure days. System auto-adjusts: attendance not expected, billing unaffected (tuition is flat), daily reports not required.
- **Field trip management** — create field trip event → auto-generate permission slip checklist item (§34) for each enrolled student → track which families have signed → generate chaperone volunteer sign-up.
- **RSVP + sign-ups** — parents RSVP for events and sign up for volunteer slots from the app. Real-time count visible.
- **Recurring events** — weekly chapel, monthly parent nights, etc. Standard recurrence rules (daily/weekly/monthly/custom).
- **Notification integration** — event created → notification to relevant audience. Event reminder 24 hours before. RSVP deadline reminder.
- **Billing integration** — field trips with a cost auto-generate a charge on the family's next invoice for RSVPed students.

### Acceptance criteria
- [ ] Calendar renders correctly on phone (touch-friendly month/agenda views).
- [ ] Closure days suppress attendance expectations for that date.
- [ ] Field trip permission slip auto-assigned to all enrolled students in the relevant classroom(s).
- [ ] RSVP counts update in real-time.
- [ ] Event costs correctly added to family invoices.

---

## 37. Emergency broadcast + lockdown mode

> **No competitor does this.** This is a CCA differentiator and a child-safety imperative.

### Why
Active shooter drills, severe weather, gas leaks, medical emergencies — preschools need a lockdown protocol that doesn't depend on someone remembering a phone tree. One tap should: lock every door, blast every parent and staff member, start recording on cameras, and provide a reunification workflow.

### Data model additions

```
- `emergency_events` — `(id, event_type [lockdown/shelter_in_place/evacuation/medical/weather/drill/other], severity [drill/advisory/critical], title, description, initiated_by, initiated_at, resolved_by, resolved_at, status [active/resolved], all_clear_message, notes)`.
- `emergency_actions` — `(id, emergency_event_id, action_type [door_lock_all/broadcast_parent/broadcast_staff/camera_record/attendance_snapshot/reunification_start], executed_at, executed_by, status [success/failed/pending], error_message)`.
- `reunification_records` — `(id, emergency_event_id, student_id, released_to_user_id, released_to_name, verified_by, verified_method [photo_id/known_parent/authorized_pickup], released_at, notes)`.
```

### Features
- **One-tap lockdown** — admin taps emergency button (prominent, behind a confirmation) → system executes all configured actions simultaneously:
  - All connected doors lock immediately
  - All cameras start recording (bookmark the timestamp)
  - Push + SMS + email blast to all parents: "[Event type] at CCA. All children are safe. [Instructions]. Do not come to the school. We will update you."
  - Push to all staff: "[Event type]. [Specific instructions]."
  - Attendance snapshot: freeze current who-is-here board as the official record of who's in the building.
- **Shelter-in-place / evacuation** — different protocols with different messages and actions.
- **Real-time updates** — admin can push follow-up messages to the same emergency thread. Parents see a timeline of updates.
- **All-clear** — admin resolves the event. All-clear message pushed to everyone. Doors return to normal access rules. Cameras stop forced recording.
- **Reunification mode** — after an emergency requiring evacuation: parent arrives → staff verifies identity (photo ID or known) → checks child out against the attendance snapshot → child released → logged. Ensures every child is accounted for.
- **Drill mode** — same workflow but tagged as a drill. Drill messages say "THIS IS A DRILL." Drill records kept for licensing compliance (required in Texas).
- **Post-incident report** — auto-generated timeline of all actions, messages, attendance snapshot, and reunification records. PDF export for licensing/insurance.

### Acceptance criteria
- [ ] Lockdown initiated to first parent notification delivered in under 60 seconds.
- [ ] All connected doors lock within 10 seconds of lockdown initiation.
- [ ] Attendance snapshot freezes accurately at moment of initiation.
- [ ] Reunification mode tracks every child release with verification.
- [ ] Drill records stored separately from real emergencies.
- [ ] Post-incident report generates complete timeline PDF.

---

## 38. Staff professional development + training tracker

> Lillio has "Lillio Academy." Nobody else tracks PD hours. We build a tracker that matters for licensing.

### Why
Texas DFPS requires childcare staff to complete a minimum number of training hours annually (24 hours for caregivers, 30 for directors). Tracking this on paper is error-prone. During inspections, directors scramble to prove compliance. A digital tracker with document proof makes inspections trivial.

### Data model additions

```
- `training_requirements` — `(id, role, annual_hours_required, description, regulatory_reference)`. Seed with Texas DFPS minimums.
- `training_records` — `(id, user_id, training_name, provider, training_type [online/in_person/conference/workshop/self_study], topic_category [child_development/health_safety/nutrition/special_needs/professionalism/faith_formation/other], hours, completed_date, certificate_path, verified_by, verified_at, year, notes)`.
- `training_goals` — `(id, user_id, year, target_hours, target_topics, notes, set_by)`.
```

### Features
- **Training log** — staff log their own training hours (name, provider, type, hours, date, certificate upload). Admin can also log on behalf of staff.
- **Annual hours tracker** — dashboard per staff member: hours completed this year vs. requirement. Progress bar. Months remaining. Pace indicator ("on track" / "behind").
- **Topic distribution** — Texas requires hours in specific topic areas. Track distribution across categories. Flag if a staff member has 20 hours but zero in health/safety.
- **Team overview** — admin dashboard: all staff, their hours completed vs. required, who's on track, who's behind, who's at risk of non-compliance.
- **PD goals** — admin sets annual goals per staff member beyond minimums (e.g., "Complete infant CPR recertification" or "Attend 2 faith-formation workshops").
- **Certificate storage** — training certificates stored in document vault (§35) with auto-linking.
- **Inspection report** — one-click generate: all staff, their roles, their required hours, their completed hours, certificate proof links. Ready for DFPS inspector.

### Acceptance criteria
- [ ] Training hours accurately tallied per year per staff member.
- [ ] Hours by topic category tracked and compared to Texas requirements.
- [ ] Admin can generate inspection-ready compliance report in one click.
- [ ] Staff receive alerts when they're behind pace for annual hour requirements.
- [ ] Certificate uploads auto-linked to document vault.

---

## 39. Texas DFPS compliance module

> **No competitor has state-specific compliance baked in.** They're all generic. We're built for Texas.

### Why
CCA operates under Texas Health and Human Services (HHS) Child Care Regulation, Chapter 746 Minimum Standards for Child-Care Centers. Compliance isn't optional — violations can result in fines, corrective action, or license revocation. Building Texas-specific compliance into the platform means CCA is always inspection-ready.

### Data model additions

```
- `dfps_ratio_requirements` — `(id, age_group_label, age_min_months, age_max_months, max_children_per_caregiver, max_group_size, notes)`. Seed with Chapter 746 ratios:
  - 0–11 months: 4:1, max group 10
  - 12–17 months: 5:1, max group 13
  - 18–23 months: 9:1, max group 18
  - 24–35 months: 11:1, max group 22
  - 36–47 months: 15:1, max group 30
  - 48–59 months: 18:1, max group 35
  - 60–71 months: 22:1, max group 35
  - 72+ months: 26:1, max group 35
- `compliance_standards` — `(id, standard_number, category [staffing/health_safety/nutrition/activities/physical_environment/record_keeping/other], title, description, evidence_type [document/ratio/checklist/observation], is_critical boolean)`.
- `compliance_checks` — `(id, standard_id, checked_by, checked_at, status [compliant/non_compliant/needs_attention/not_applicable], evidence_notes, corrective_action, corrected_at, corrected_by)`.
- `inspection_records` — `(id, inspection_date, inspector_name, inspection_type [annual/complaint/follow_up/self_assessment], findings jsonb, corrective_actions_required jsonb, corrective_actions_completed_at, overall_result [compliant/non_compliant/corrective_action_required], document_path, notes)`.
```

### Features
- **Texas ratio engine** — classroom ratio checks use the actual Chapter 746 table (seeded above), not a generic configurable number. Age of each student computed from DOB. Mixed-age classrooms use the strictest applicable ratio. 15-minute auto-check uses these real numbers.
- **Minimum standards checklist** — full Chapter 746 standards digitized into a self-assessment checklist. Admin works through it periodically. Status tracked per standard: compliant, needs attention, non-compliant.
- **Inspection prep mode** — triggered before an expected inspection. Generates a comprehensive readiness report:
  - Staff credentials (all current? background checks cleared?)
  - Training hours (all staff meeting annual minimums?)
  - Ratio compliance history (last 90 days)
  - Document status (immunization records, emergency contacts, incident reports all current?)
  - Fire drill records (monthly as required)
  - Physical environment checklist (safety covers, locked cabinets, posted evacuation routes)
- **Deficiency tracker** — when a non-compliance is found (self-assessment or inspection), track the deficiency, corrective action plan, deadline, and resolution. Ensure nothing falls through.
- **Inspection history** — log of all inspections with findings, corrective actions, and outcomes. Pattern analysis over time.
- **Auto-generated compliance reports** — attendance records in the format Texas HHS expects, ratio compliance logs, training hour summaries, incident report summaries. All exportable for inspector review.

### Acceptance criteria
- [ ] Ratio checks use Texas Chapter 746 age-specific ratios, not generic numbers.
- [ ] Mixed-age classroom ratio correctly defaults to the most restrictive applicable ratio.
- [ ] Inspection prep report covers all major Chapter 746 categories.
- [ ] Deficiency tracker shows open items with days until deadline.
- [ ] Self-assessment checklist covers at minimum the critical standards from Chapter 746.

---

## 40. Enhanced billing + financial operations (v2.0 expansion)

> Expanding §12 to cover everything Brightwheel, Procare, and Playground offer — plus what they don't.

### Additional features beyond v1.0 spec

- **Application fees** — configurable fee collected during enrollment application submission (via Stripe Payment Intent). Non-refundable. Tracked separately from tuition.
- **Registration fees** — one-time fee charged upon enrollment approval. Can be waived by admin (audit-logged). Separate from first tuition payment.
- **Supply fees** — annual or per-semester fees for classroom supplies, added to first invoice of the period.
- **Subscription management portal (parent)** — parents can view their active subscriptions, see upcoming charges, update payment method, switch between ACH and card, view payment history. All from `/portal/parent/billing`.
- **Admin subscription editing** — admin can modify a family's billing: change plan, add/remove discounts, pause subscription, adjust amount, all with audit log and optional parent notification.
- **Payment plan / installment support** — for families who can't pay monthly tuition in full: split a month's tuition into weekly payments. Stripe manages the schedule.
- **Credit + debit management** — admin can apply credits (overpayment, referral bonus, scholarship) to a family account. Credits auto-apply to the next invoice.
- **Refund processing** — admin initiates refunds through the portal. Refund goes back to original payment method (Stripe handles). Audit-logged with reason.
- **Failed payment workflow** — Stripe Smart Retries for first 3 attempts. After final failure: family account flagged "past due" → admin notified → parent gets escalating email sequence (friendly reminder → past due notice → final notice with late fee). Configurable.
- **Deposit / registration hold** — collect a deposit to hold a spot (waitlist converts). Deposit applies to first tuition invoice.
- **Tuition agreements / contracts** — digital tuition contract with terms, pricing, discounts, policies. Parent signs electronically. Stored in document vault. Brightwheel has this — we match.
- **Pass-through processing fees** — admin can optionally pass Stripe processing fees to parents (2.9% + $0.30 for card, lower for ACH). Configurable per payment method. Clearly disclosed on payment screen.
- **Revenue recognition** — tuition recognized in the month of service, not the month of payment. Deferred revenue tracked for prepayments. Important for accrual accounting.

### Additional data model

```
- `application_fees` — `(id, enrollment_application_id, amount_cents, stripe_payment_intent_id, status [pending/paid/failed/refunded], paid_at)`.
- `account_credits` — `(id, family_id, amount_cents, reason, credit_type [overpayment/referral/scholarship/adjustment/deposit], applied_to_invoice_id nullable, created_by, created_at, expires_at nullable)`.
- `tuition_agreements` — `(id, family_id, student_id, plan_id, terms_text, custom_terms, amount_cents, discount_type, discount_pct, start_date, end_date, signed_by, signed_at, signature_ip, document_path, status [draft/sent/signed/expired/cancelled])`.
- `payment_reminders` — `(id, family_id, invoice_id, reminder_type [upcoming/past_due/final_notice], sent_at, channel, delivery_status)`.
```

### Acceptance criteria
- [ ] Application fee collected during enrollment wizard submission and tracked separately.
- [ ] Parent can switch payment method (card ↔ ACH) from portal without admin help.
- [ ] Admin subscription edits audit-logged and optionally notify parent.
- [ ] Credits auto-apply to next invoice. Remaining credit rolls forward.
- [ ] Failed payment escalation sequence fires automatically per configured schedule.
- [ ] Tuition agreements sent, signed, and stored — all from within the platform.
- [ ] Processing fee pass-through clearly displayed to parent before payment confirmation.

---

## 41. Enhanced student + family management (v2.0 expansion)

> Expanding §5.2 and §5.3 with the features that make staff say "I can find anything in 10 seconds."

### Student quick-lookup
- **Universal search bar** — type any part of a student's name, family name, or classroom. Fuzzy search. Results show: student name, classroom, age, photo, allergy badges.
- **Student quick-card** — hovering/tapping a student name anywhere in the system pops a quick-card: photo, age, classroom, allergies, emergency contacts, authorized pickups, last check-in time, family contact. No page navigation needed.
- **Student file view** — single page per student with tabbed sections: Profile, Medical, Immunizations, Allergies, Authorized Pickups, Attendance History, Daily Reports, Portfolio, Documents, Family Links, Notes, Billing. Everything about this child in one place.
- **Student notes** — timestamped notes per student. Can be staff-only or shared with parent. Categories: general, behavioral, developmental, medical, administrative.
- **Student timeline** — chronological view of all events for a student: enrollment, classroom changes, check-ins, incidents, daily reports, milestone achievements, medical updates. The complete story.

### Family quick-lookup
- **Family dashboard** — per-family view: all children, all members, billing overview, outstanding balance, document status, message history. Admin uses this as the "family file."
- **Family notes** — same as student notes but scoped to the family.
- **Relationship visualization** — for complex/blended families, a simple tree diagram showing which parents/guardians are connected to which students across which households.

### Additional data model

```
- `entity_notes` — `(id, entity_type [student/family/staff/classroom], entity_id, note_type [general/behavioral/developmental/medical/administrative], content, visibility [staff_only/parent_visible], created_by, created_at, updated_at, pinned boolean)`.
```

### Acceptance criteria
- [ ] Universal search returns results in under 500ms for a 200-student database.
- [ ] Student quick-card renders without page navigation from any context (attendance board, classroom view, daily report, billing).
- [ ] Student file view loads all tabs without multiple page loads.
- [ ] Family relationship visualization correctly handles blended families with shared children.

---

## 42. Enhanced daily itinerary + educator tools (v2.0 expansion)

> Expanding §8 and §10 with the features that make teachers' days smooth.

### Daily itinerary (teacher's day-view)
- **My day** — teacher opens app → sees their complete day: which classroom(s) they're assigned to, the classroom's daily schedule, which students are expected today (from enrollment), who's checked in, who's absent, who has allergies (with badges), any events/field trips, any checklists due.
- **Schedule timeline** — visual timeline of the day's blocks (Circle Time → Centers → Snack → ...). Tap a block to: mark started, mark completed, log what actually happened, attach photos.
- **Activity completion tracking** — from lesson plan: today's planned activities shown as a checklist. Teacher marks each as done, skipped (with reason), or modified. Feeds into curriculum reporting.
- **Quick-entry toolbar** — floating action bar at bottom of screen (phone): +Meal, +Nap, +Diaper, +Activity, +Photo, +Note, +Incident. Always one tap away.
- **Batch operations** — "Everybody napped 12:00–2:00" → creates nap entries for all checked-in students with one tap. Same for meals, activities. Teachers only tap exceptions.
- **End-of-day review** — before publishing daily reports, teacher sees a checklist per student: which report fields are populated, which are empty. Ensures no child is missed.

### Parent checklist + daily prep
- **Morning prep checklist** — parents see a daily checklist on their dashboard: "Sophia needs: sunscreen, change of clothes, show-and-tell item, signed field trip form." Configured per classroom by the teacher.
- **Parent action items** — outstanding items that need parent attention: unsigned forms, missing immunization records, unpaid invoices, upcoming re-enrollment deadline. All in one place on the parent dashboard.

### Additional data model

```
- `daily_schedule_entries` — `(id, classroom_id, date, time_block_start, time_block_end, activity_name, activity_description, lesson_plan_activity_id nullable, status [planned/in_progress/completed/skipped], actual_start, actual_end, notes, completed_by, skip_reason)`.
- `parent_prep_checklists` — `(id, classroom_id, date nullable, recurring_days_of_week jsonb, title, items jsonb, created_by, is_active)`.
```

### Acceptance criteria
- [ ] Teacher "My Day" screen loads in under 2 seconds with all relevant data.
- [ ] Quick-entry toolbar is always visible on phone without scrolling to find it.
- [ ] Batch nap/meal entry covers all checked-in students in under 10 seconds.
- [ ] End-of-day review catches students with empty daily reports before publishing.
- [ ] Parent prep checklist visible on parent dashboard for the current/next day.

---

## 43. Enhanced messaging + communication (v2.0 expansion)

> Expanding §11 to match Brightwheel's calendar integration and Famly's newsfeed, while keeping our urgency/safety advantage.

### Additional features

- **Newsfeed / activity stream** — school-wide or per-classroom feed of posts (announcements, photos, events, shout-outs). Replaces email newsletters for day-to-day communication. Parents see a social-media-style feed of their child's classroom happenings.
- **Scheduled messages** — compose a message now, schedule delivery for later. Useful for Monday morning announcements composed on Sunday night.
- **Template library** — pre-written message templates for common communications: weather closure, early pickup reminder, photo day, upcoming event, fee reminder. Admin creates, staff use.
- **Translation preview** — since i18n is wired with `t()`, messages can have a "preview in Spanish" toggle (v2), but the template structure supports it from v1.
- **Email digest** — parents who don't check the app get a daily email digest of unread messages and newsfeed posts. Configurable per parent.
- **Threaded replies** — messages support threaded replies so classroom announcements don't become an unmanageable list.

### Additional data model

```
- `newsfeed_posts` — `(id, scope [school_wide/classroom], classroom_id nullable, author_id, content, media_paths jsonb, post_type [announcement/photo/shoutout/event_recap/reminder], pinned boolean, created_at, updated_at)`.
- `newsfeed_reactions` — `(id, post_id, user_id, reaction_type [heart/celebrate/thanks], created_at)`.
- `message_templates` — `(id, name, category, subject, body, created_by, is_active)`.
- `message_schedules` — `(id, conversation_id, message_body, scheduled_for, sent_at, created_by, status [scheduled/sent/cancelled])`.
```

### Acceptance criteria
- [ ] Newsfeed loads last 20 posts in under 1 second.
- [ ] Scheduled messages send within 60 seconds of scheduled time (Supabase Edge Function cron).
- [ ] Email digest correctly aggregates unread messages and posts from the past 24 hours.
- [ ] Template insertion auto-fills message body with one tap.

---

## 44. Custom fields system (v3.0 addition)

> SuiteDash has basic custom fields. Brightwheel and Procare have none. Every growing school eventually needs fields that don't exist in the schema. Instead of bloating the core tables, we build a first-class custom fields engine that extends any entity type without schema changes.

### Philosophy

Custom fields are **tenant-scoped** — each school defines their own fields for their own entity types. The platform ships with zero custom fields by default. Admins create them from Settings → Custom Fields. Field values are stored in a dedicated table, not as JSONB blobs on entity tables, so they can be indexed, filtered, searched, and used in form builder logic.

### Supported entity types

Custom fields can be attached to: `student`, `family`, `staff`, `classroom`, `enrollment_application`, `incident_report`, `checklist_item`. New entity types can be added by inserting a row into `custom_field_entity_types` — no code changes needed.

### Field types

| Type | Rendered as | Stored as | Notes |
|---|---|---|---|
| `text` | Single-line input | `text` | Max 500 chars |
| `textarea` | Multi-line textarea | `text` | Max 5000 chars |
| `number` | Numeric input | `numeric` | Min/max/step configurable |
| `currency` | Currency input with symbol | `numeric` | Symbol from tenant locale |
| `date` | Date picker | `date` | |
| `datetime` | Date + time picker | `timestamptz` | |
| `boolean` | Toggle switch | `boolean` | |
| `select` | Dropdown | `text` | Options defined in `custom_field_options` |
| `multi_select` | Multi-select chips | `text[]` (jsonb) | Options defined in `custom_field_options` |
| `email` | Email input with validation | `text` | |
| `phone` | Phone input with formatting | `text` | |
| `url` | URL input with validation | `text` | |
| `file` | File upload | `text` (storage path) | Uses tenant storage bucket |
| `image` | Image upload with preview | `text` (storage path) | Uses tenant storage bucket |
| `rating` | Star rating (1–5 or 1–10) | `integer` | Scale configurable |
| `color` | Color picker | `text` (hex) | |
| `json` | JSON editor (admin only) | `jsonb` | For advanced integrations |

### Data model additions

```
- `custom_field_entity_types` — `(id, tenant_id, entity_type text unique per tenant, label, icon, enabled boolean)`.
  Pre-seeded with: student, family, staff, classroom, enrollment_application, incident_report, checklist_item.

- `custom_fields` — `(id, tenant_id, entity_type, field_key slug, label, description, field_type, is_required boolean, is_searchable boolean, is_filterable boolean, is_visible_to_parents boolean, default_value jsonb, validation_rules jsonb, sort_order integer, section_label text, created_by, created_at, updated_at, deleted_at)`.
  `field_key` is a slug (e.g., "shirt_size") auto-generated from label, unique per (tenant_id, entity_type).
  `validation_rules` — JSON with optional keys: `{ min, max, step, pattern, min_length, max_length, options_source }`.
  `section_label` — groups fields visually under a header (e.g., "Church Information", "Transportation").

- `custom_field_options` — `(id, custom_field_id, label, value, sort_order, color text nullable, icon text nullable)`.
  For select and multi_select field types.

- `custom_field_values` — `(id, tenant_id, custom_field_id, entity_type, entity_id uuid, value_text, value_numeric, value_boolean, value_date, value_json jsonb, value_file_path, created_at, updated_at)`.
  One row per entity per field. Uses the typed column matching `field_type`. Only one value column is non-null per row.
  Indexed: `(tenant_id, entity_type, entity_id)` and `(tenant_id, custom_field_id)`.
```

### Features

- **Admin UI:** Settings → Custom Fields. List all fields grouped by entity type. Drag-to-reorder. Create/edit/archive fields. Preview how the field renders on the entity form.
- **Entity form injection:** When rendering a student/family/staff/etc. form, query `custom_fields` for that entity type and inject the fields into the form at the bottom (or grouped by `section_label`). Use the same react-hook-form + Zod pipeline as core fields.
- **Search + filter integration:** Fields marked `is_searchable` appear in the universal search index. Fields marked `is_filterable` appear as filter options in list views (students, families, staff, etc.).
- **Form builder integration (§45):** Custom fields are available as dynamic data placeholders in the form builder. Forms can write values back to custom field values on submission.
- **Parent visibility:** Fields marked `is_visible_to_parents` render on the parent portal for that entity. Parents can edit their own family's custom field values if the field is also marked `is_parent_editable`.
- **Import/export:** Custom field values included in CSV exports. Bulk import via CSV with column mapping to field keys.
- **Audit:** All custom field value changes written to `audit_log`.

### Acceptance criteria
- [ ] Admin creates a custom field and it appears on the entity form within the same page load (no deploy needed).
- [ ] Custom field values persist, display on entity detail, and export in CSV.
- [ ] Searchable fields return results in universal search.
- [ ] Filterable fields appear in list view filter dropdowns.
- [ ] Deleting a field soft-deletes it and hides values (does not destroy data).
- [ ] Custom field values available as merge variables in form builder (§45).
- [ ] File/image fields upload to tenant-isolated storage bucket.

---

## 45. Form builder (v3.0 addition — THE FORM EXPERIENCE)

> Typeform pioneered conversational forms with auto-advance. JotForm has 100+ field widgets. DocuSign owns legally-binding e-signatures. Tally has Notion-like freeform layout. **Nobody combines all of these.** We do. This is the most powerful form builder in the preschool management space — and competitive with standalone form products.

### Two builder modes

1. **Conversational mode (Typeform-style):** One question per screen. Auto-advance on selection. Smooth slide/fade/zoom transitions between questions. Progress bar. Keyboard navigation (Enter to advance, arrow keys for options). Ideal for parent-facing enrollment forms, surveys, and applications. Highest completion rates.

2. **Document mode (traditional):** Multi-section scrollable form. Field groups with headers. Side-by-side columns. Inline validation. Ideal for staff data-entry forms, incident reports, checklists, and DocuSign-style signing workflows.

Both modes use the same underlying form schema. A form can be switched between modes without losing configuration.

### Field types (30+)

| Category | Fields |
|---|---|
| **Text** | Short text, long text, rich text (Markdown), email, phone, URL, number, currency |
| **Choice** | Single select (dropdown), single select (radio), multi-select (checkboxes), image choice (grid of images with labels), button group, rating (stars), opinion scale (1–10), NPS (0–10), yes/no toggle, legal acceptance (checkbox with terms link) |
| **Date/Time** | Date picker, time picker, date + time, date range, appointment slot picker (calendar widget) |
| **Media** | File upload (any type), image upload (with preview + crop), video embed (YouTube/Vimeo URL), signature pad (draw-to-sign with timestamp + IP logging) |
| **Layout** | Section header, description block (Markdown), divider, image banner, video banner, spacer |
| **Advanced** | Payment (Stripe checkout — one-time, subscription, or calculated amount), calculator (hidden field with formula referencing other fields), hidden field (for UTM params, prefill, or tracking), address (auto-complete + structured), matrix/grid (rows × columns rating), ranking (drag-to-reorder options), slider (numeric range with labels) |
| **Data** | Entity lookup (search students/families/staff by name, returns entity_id), custom field value (pulls from §44 custom fields), dynamic select (options populated from a database query or API) |
| **Signature** | E-signature block with full audit trail: signer name, email, IP, timestamp, browser fingerprint, hash of signed content. Rendered as a signature pad (draw or type). Legally sufficient for school permission slips, enrollment agreements, and tuition contracts under ESIGN/UETA. Multiple signers supported (sequential or parallel). |

### Logic engine

- **Conditional show/hide:** Any field can have visibility rules: "Show this field if [Field X] [equals/contains/is greater than/is not empty] [value]". Multiple conditions with AND/OR. Nested groups.
- **Conditional jump (conversational mode):** After answering Question A, jump to Question C (skipping B) based on answer value. Branching endpoints — different thank-you screens based on path.
- **Calculated fields:** Formula engine supporting arithmetic (`+`, `-`, `*`, `/`), conditionals (`if/then/else`), field references (`{{field_key}}`), and aggregation (`sum`, `count`, `avg` across matrix/ranking fields). Results can drive payment amounts, display as live-updating totals, or be stored as hidden values.
- **Variable system:** Named variables that accumulate across the form (e.g., `total_fees = application_fee + supply_fee + tuition_deposit`). Variables can be referenced in any subsequent field's logic, labels, or description text.
- **Page/section logic:** In document mode, entire sections can be conditionally shown/hidden. In conversational mode, groups of questions can be skipped via jump logic.
- **Validation rules:** Per-field: required, min/max length, min/max value, regex pattern, file type/size, custom error messages. Cross-field: "End date must be after start date", "At least one phone number required if email is empty".

### Design system

- **Per-form theming:** Forms inherit the tenant's CSS variable theme by default, but each form can override: primary color, background color/image/gradient, font family, border radius, button style, field style (underline/outline/filled), progress bar style.
- **Animations (conversational mode):** Configurable transition between questions: slide-up (default), fade, zoom, flip. Easing curves from the platform motion system. Entrance animations on field focus. Micro-interactions on selection (ripple, scale-bounce, check-mark draw).
- **Responsive:** Every form renders perfectly on phone, tablet, and desktop. Conversational mode is phone-native. Document mode reflows to single-column on phone.
- **Header/footer:** Optional branded header (logo, title, description, cover image or video) and footer (powered-by, legal links, custom HTML). Header can be sticky or scroll-away.
- **Custom CSS:** Advanced users (platform admin) can inject custom CSS per form.
- **Dark mode:** Forms respect `prefers-color-scheme` and can be forced to light/dark via form settings.
- **Background media:** Full-bleed background image or video behind the form (with overlay opacity control).

### Embedding + access control

- **Standalone page:** Every form gets a URL: `{tenant_domain}/forms/{form_slug}`. Beautiful full-page render with optional site header/footer.
- **Embedded iframe:** `<iframe src="{tenant_domain}/forms/{form_slug}/embed">`. Auto-resizing. Post-message communication with parent page.
- **Popup/modal:** JavaScript snippet that opens the form in a centered modal triggered by button click, timer, or scroll depth.
- **Inline embed:** React component `<FormEmbed formId="..." />` for in-portal embedding (e.g., enrollment form embedded in the admin applicant review page).
- **Access control:**
  - **Public:** No authentication required. Anyone with the link can fill it out. Spam protection via turnstile/recaptcha.
  - **Authenticated (any role):** Requires portal login. Respondent identity auto-captured.
  - **Role-restricted:** Only specific roles can access (e.g., only parents, only staff, only admins).
  - **Pre-filled + tokenized:** URL contains a signed token that pre-fills fields from entity data (e.g., parent receives email link with their name, child's name, and family ID pre-filled). Token expires after configurable period.
  - **Single-use:** Form can only be submitted once per user (or once per entity). Useful for annual re-enrollment forms.

### Dynamic data placeholders (merge fields)

Forms can pull live data from the database to pre-fill fields or display personalized content:

- **Entity fields:** `{{student.first_name}}`, `{{family.billing_email}}`, `{{staff.certification_expiry}}`, `{{classroom.name}}`
- **Custom fields (§44):** `{{student.custom.shirt_size}}`, `{{family.custom.church_name}}`
- **Calculated values:** `{{tuition_agreement.monthly_amount}}`, `{{account.balance_due}}`
- **System fields:** `{{current_date}}`, `{{tenant.name}}`, `{{tenant.phone}}`, `{{form.submission_count}}`
- **Respondent fields:** `{{respondent.name}}`, `{{respondent.email}}`, `{{respondent.role}}`

Placeholders resolve at form-load time (for display/prefill) and at submission time (for stored values). Unresolved placeholders render as blank with a subtle "missing data" indicator (never show raw `{{...}}` to end users).

### Submission handling

- **On-submit actions (configurable per form, multiple allowed):**
  1. **Store response** — always on. Writes to `form_responses` + `form_response_values`.
  2. **Write to entity** — update fields on an existing entity (student, family, staff). Maps form fields → entity columns or custom fields. Useful for "update your info" forms.
  3. **Create entity** — create a new student, family member, enrollment application, incident report, etc. Maps form fields → entity creation payload.
  4. **Send notification** — email/SMS/push to configurable recipients (form creator, admin, respondent, specific users). Template with `{{response.field_key}}` placeholders.
  5. **Trigger webhook** — POST JSON payload to external URL. Configurable headers and payload mapping.
  6. **Create Stripe charge** — if form includes a payment field, process the charge on submission via the tenant's Stripe Connect account.
  7. **Generate PDF** — render the completed form as a branded PDF (with signatures if present) and attach to the response record + optionally email to respondent.
  8. **Assign checklist** — trigger a checklist assignment (§34) for the respondent or a linked entity.
  9. **Update custom field** — write specific response values back to custom field values on an entity.

- **Thank-you screen:** Configurable per form (or per logic branch). Options: message + redirect URL, message + next-form link, message + PDF download, confetti animation.
- **Response editing:** Optionally allow respondents to edit their submission before a deadline. Admin can always edit responses.
- **Partial saves:** In conversational mode, progress is auto-saved to `form_response_drafts` so users can resume later (requires auth or token).

### E-signature workflow

- **Single signer:** One signature field in the form. Signer draws or types their signature. Captured with: timestamp, IP address, browser user-agent, content hash (SHA-256 of the form data at signing time).
- **Multi-signer sequential:** Form is filled by Person A, then routed to Person B for review + signature, then optionally Person C. Each signer gets an email with a tokenized link. Status tracked: `pending → in_progress → awaiting_signer_2 → completed`.
- **Multi-signer parallel:** Multiple signers receive links simultaneously. Form completes when all have signed.
- **Audit certificate:** Every signed form generates a PDF audit certificate: all signer details, timestamps, IP addresses, content hash, and a tamper-evident seal. Attached to the response record.
- **Preschool use cases:** Enrollment agreements, photo/media release forms, field trip permission slips, medical authorization forms, custody acknowledgment forms, tuition contracts, incident report parent acknowledgments.

### Form templates (tenant-level)

Pre-built form templates that ship with the platform and are cloneable by any tenant:

1. **Enrollment application** — multi-step: parent info → student info → medical/allergy → emergency contacts → program selection → payment (application fee) → e-signature.
2. **Annual re-enrollment** — pre-filled from existing data, captures updates, collects signature + re-enrollment fee.
3. **Medical authorization** — allergy info, medication consent, physician authorization. E-signature required.
4. **Photo/media release** — consent for photos/videos of child on social media, website, internal use. Granular options.
5. **Field trip permission slip** — event details, emergency contact confirmation, medical info acknowledgment, e-signature.
6. **Incident report** — staff fills in: student, what happened, action taken. Routes to parent for acknowledgment signature.
7. **Parent satisfaction survey** — NPS + open-ended questions. Anonymous option.
8. **Staff onboarding checklist** — document uploads (certifications, background check consent, W-4), e-signatures, training acknowledgments.
9. **Tuition agreement** — generated from tuition_agreements table data, pre-filled, requires parent e-signature. Stripe payment setup.
10. **Visitor sign-in** — public form on a kiosk/tablet: name, who visiting, purpose, ID verified toggle. No auth required.
11. **Waitlist registration** — lightweight lead capture: parent name, email, child DOB, desired start date. Creates enrollment lead.
12. **Contact us** — public form on marketing site. Creates enrollment lead with source tracking.

### Admin experience

- **Form list:** All forms for the tenant. Sortable by name, status, response count, last response date. Filter by status (draft/published/archived). Quick-duplicate.
- **Builder:** Full-screen builder with live preview pane (phone/tablet/desktop toggle). Left panel: field palette (drag to add). Center: form canvas. Right panel: field settings, logic rules, design overrides.
- **Responses tab:** Table view of all responses. Column per field. Sortable, filterable, searchable. Bulk export (CSV, PDF). Individual response detail view with all values + signature audit trail.
- **Analytics:** Per-form: total responses, completion rate, average time, drop-off by question (conversational mode), payment revenue collected.
- **Settings:** Access control, notification rules, submission actions, thank-you screen, SEO meta (for standalone pages), expiration date, response limit.

### Data model additions

```
- `forms` — `(id, tenant_id, title, slug unique per tenant, description, status [draft/published/archived], mode [conversational/document], theme_overrides jsonb, header_config jsonb, footer_config jsonb, background_config jsonb, access_control [public/authenticated/role_restricted/tokenized], allowed_roles text[], require_single_submission boolean, allow_response_edit boolean, edit_deadline timestamptz, expires_at, max_responses integer, redirect_url, thank_you_config jsonb, seo_config jsonb, custom_css text, created_by, published_at, created_at, updated_at, deleted_at)`.

- `form_fields` — `(id, form_id, field_key slug, field_type, label, description, placeholder, is_required boolean, sort_order integer, section_id uuid nullable references form_sections, page_number integer default 1, config jsonb, validation_rules jsonb, logic_rules jsonb, prefill_source text, created_at, updated_at)`.
  `config` is field-type-specific: e.g., for `select`: `{ options: [{label, value, image_url, color}], allow_other: true }`.
  For `payment`: `{ mode: "one_time"|"subscription", amount_field_ref: "{{calculated_total}}", currency: "usd" }`.
  For `signature`: `{ mode: "draw"|"type"|"both", required_signers: [{role, label, email_field_ref}] }`.
  `logic_rules`: `{ visibility: [{field_ref, operator, value, logic_group}], jump_to_field_id: uuid, jump_condition: {...} }`.

- `form_sections` — `(id, form_id, title, description, sort_order, logic_rules jsonb, page_number integer)`.
  Groups fields visually (document mode) or into pages (conversational mode).

- `form_variables` — `(id, form_id, variable_name, formula text, referenced_fields text[])`.
  Named calculated variables usable in labels, logic, and payment amounts.

- `form_responses` — `(id, form_id, tenant_id, respondent_user_id nullable, respondent_email text nullable, respondent_name text nullable, status [draft/in_progress/awaiting_signature/completed/expired], entity_type text nullable, entity_id uuid nullable, ip_address inet, user_agent text, started_at, submitted_at, updated_at)`.

- `form_response_values` — `(id, response_id, field_id, value_text, value_numeric, value_boolean, value_date, value_json jsonb, value_file_path, signature_data jsonb)`.
  `signature_data`: `{ image_data_url, typed_name, signer_email, signer_ip, signed_at, content_hash, browser_fingerprint }`.

- `form_response_drafts` — `(id, form_id, respondent_user_id nullable, token text unique, draft_values jsonb, last_field_completed integer, created_at, updated_at, expires_at)`.
  Auto-save for conversational mode resume.

- `form_signature_requests` — `(id, response_id, signer_order integer, signer_role text, signer_email, signer_name, token text unique, status [pending/viewed/signed/declined/expired], signed_at, signer_ip inet, signer_user_agent text, content_hash text, reminder_sent_at, expires_at)`.
  For multi-signer workflows.

- `form_submission_actions` — `(id, form_id, action_type [store/write_entity/create_entity/notify/webhook/stripe_charge/generate_pdf/assign_checklist/update_custom_field], config jsonb, sort_order integer, is_active boolean)`.
  Configurable per form. Executed in sort_order on submission.

- `form_templates` — `(id, tenant_id nullable (null = platform-level), name, description, category, form_snapshot jsonb, is_active boolean, sort_order)`.
  `form_snapshot` is a full serialized form (fields, sections, variables, logic, design) that can be cloned into a new form.
```

### Migrations

```
0044_custom_fields.sql          — custom_field_entity_types, custom_fields, custom_field_options, custom_field_values
0045_form_builder.sql           — forms, form_fields, form_sections, form_variables, form_responses, form_response_values, form_response_drafts, form_signature_requests, form_submission_actions, form_templates
```

### Acceptance criteria
- [ ] Admin creates a conversational form with 10 fields, logic jumps, and a payment step in under 10 minutes using the builder.
- [ ] A parent fills out the enrollment application form on their phone in conversational mode with auto-advance — total time under 8 minutes including e-signature.
- [ ] Form embeds via iframe on an external site and auto-resizes correctly.
- [ ] Public forms are accessible without login. Authenticated forms redirect to login first.
- [ ] Pre-filled tokenized links correctly populate fields from entity data.
- [ ] E-signature captures all audit data (IP, timestamp, content hash, browser info).
- [ ] Multi-signer sequential workflow: Person A submits → Person B receives email → Person B signs → form marked complete.
- [ ] PDF generation renders the completed form with signatures and branding.
- [ ] Calculated fields update in real-time as the user fills in referenced fields.
- [ ] Stripe payment processes on submission via tenant's Stripe Connect account.
- [ ] Form responses appear in admin table view, are searchable, filterable, and exportable as CSV.
- [ ] Custom field values (§44) available as merge placeholders in form fields and descriptions.
- [ ] Partial saves in conversational mode allow resume via the same URL (authenticated) or token link.
- [ ] Completion rate analytics show drop-off by question.
- [ ] Animations in conversational mode are smooth (60fps) and respect `prefers-reduced-motion`.
- [ ] Every form template is cloneable and customizable by any tenant admin.

---

## 20B. CCA vs. industry — competitive matrix (v2.0)

> Updated gap analysis after v2.0 expansion. CCA now matches or exceeds every major competitor in every category.

| Feature area | Brightwheel | Procare | Lillio | Kangaroo | Playground | Famly | **CCA** |
|---|---|---|---|---|---|---|---|
| Check-in / check-out | ✅ QR, PIN, e-sig | ✅ Kiosk, app | ✅ Basic | ✅ Basic | ✅ QR, carline | ✅ Basic | ✅✅ QR + PIN + custody + allergy ack + offline + photo verify |
| Daily reports | ✅ Good | ✅ Basic | ✅ Great | ✅ Good | ✅ Good | ✅ Good | ✅✅ Typed entries + bulk + photo + milestone + portfolio bridge |
| Billing + payments | ✅ Great | ✅ Great | ✅ Basic | ✅ Good | ✅ Good | ✅ Great | ✅✅ Stripe + split billing + subsidy + app/reg fees + credits + contracts |
| Payroll | ✅ Built-in (Gusto) | ✅ Built-in | ❌ | ❌ | ✅ Basic | ✅ Export | ✅ Export (ADP/Gusto/QBO) + full time clock + PTO + overtime |
| CACFP / food program | ✅ Great | ✅ Good | ❌ | ❌ | ✅ Great | ❌ | ✅ Menu planner + allergy-aware + CACFP claims + kitchen view |
| Accounting integration | ⚠️ Manual CSV | ✅ QBO sync | ❌ | ❌ | ❌ | ❌ | ✅ QBO + Xero export + expense tracking + classroom P&L |
| Child portfolios | ⚠️ Basic | ✅ Assessments | ✅ Great | ❌ | ❌ | ❌ | ✅✅ Observations + domains + assessments + learning stories + PDF |
| Enrollment CRM | ✅ Good | ✅ Basic | ❌ | ✅ Basic | ✅ Good | ❌ | ✅✅ Full pipeline + lead scoring + tours + automations + conversion |
| Surveys / feedback | ❌ | ❌ | ✅ Basic | ❌ | ❌ | ✅ Basic | ✅ Builder + NPS + anonymous + scheduled + action items |
| Carline / pickup queue | ❌ | ❌ | ❌ | ❌ | ✅ Basic | ❌ | ✅ Queue + classroom notify + multi-child + check-out integration |
| Drop-in / flex scheduling | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ Availability calendar + booking + capacity-aware + billing |
| Subsidy tracking | ✅ Good | ✅ Great | ❌ | ❌ | ✅ Basic | ❌ | ✅ Agency + claims + mixed-funding + reconciliation |
| Analytics / reporting | ⚠️ Basic | ✅ Great | ❌ | ✅ Good | ⚠️ Basic | ✅ Good | ✅✅ Executive dashboard + custom reports + scheduled delivery |
| Checklists (onboarding) | ✅ Basic | ✅ Forms | ❌ | ❌ | ✅ Basic | ❌ | ✅✅ Template builder + auto-assign + e-sig + deadline tracking |
| Document vault | ✅ Basic | ✅ Good | ❌ | ❌ | ❌ | ❌ | ✅✅ Entity-scoped + versioned + expiry + inspection prep |
| Calendar + events | ✅ Good | ✅ Basic | ❌ | ❌ | ❌ | ✅ Good | ✅ Events + RSVP + sign-ups + field trip + closure + billing |
| Emergency / lockdown | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅✅ **UNIQUE** — one-tap lockdown + door lock + reunification |
| Form builder | ❌ | ⚠️ Basic forms | ❌ | ❌ | ❌ | ⚠️ Basic | ✅✅ **UNIQUE** — Typeform UX + DocuSign e-sig + calc engine + payment + 12 templates |
| Custom fields | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ Basic | ✅✅ **UNIQUE** — 18 field types + search/filter + form builder merge + parent visibility |
| PD / training tracker | ❌ | ❌ | ✅ Lillio Academy | ❌ | ❌ | ❌ | ✅ Hours + topics + compliance + inspection-ready report |
| State-specific compliance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅✅ **UNIQUE** — Texas DFPS Ch.746 ratios + standards + inspection prep |
| Custody enforcement | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅✅ **UNIQUE** — schedule-aware check-out + hard blocks |
| Blended family billing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅✅ **UNIQUE** — split billing + multi-household + custody-aware |
| Door control | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** — app unlock + role-based + auto-lock + access log |
| Camera feeds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** — live view + bookmarks + motion events |
| Messaging + newsfeed | ✅ Good | ⚠️ Poor | ✅ Good | ✅ Good | ✅ Good | ✅ Great | ✅✅ Direct + classroom + broadcast + newsfeed + templates + scheduled |
| Faith integration | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** — faith domains in curriculum + chapel events + faith component in lesson plans |

**CCA exceeds every competitor in every category that matters.** Five features are completely unique to CCA: emergency lockdown + reunification, Texas DFPS compliance, custody-aware check-out, blended family split billing, and integrated door/camera control. No competitor has all of these — most have none.

---

## 46. System forms + enrollment application (v3.0 addition)

> The enrollment application is the most important form in the platform. It's the first thing a prospective parent interacts with. It needs to be 10x better than SuiteDash — beautiful, wizard-style, with logic for multiple children, conditional medical fields, optional payment, and tight integration with the enrollment pipeline.

### System form concept

A **system form** is a platform-built form that exists as core functionality. Unlike user-created forms from the form builder (§45), system forms:

- Are **seeded automatically** when a tenant is created
- Have **locked core fields** (`is_locked = true` on `form_fields`) that the form builder cannot delete
- Allow admin **customization**: add custom fields, reorder non-locked fields, change theme/branding, edit labels/descriptions
- Have a `system_form_key` identifier (e.g., `'enrollment_application'`) on the `forms` table
- Can be **spawned as instances** — deep copies with independent settings (e.g., one with application fee, one without)

### System form keys

| Key | Name | Auto-seeded |
|---|---|---|
| `enrollment_application` | Enrollment Application | Yes |
| `re_enrollment` | Annual Re-Enrollment | Yes |
| `medical_authorization` | Medical Authorization | Yes |
| `photo_release` | Photo/Media Release | Yes |
| `field_trip_permission` | Field Trip Permission | Yes |
| `incident_acknowledgment` | Incident Report Acknowledgment | Yes |
| `visitor_sign_in` | Visitor Sign-In | Yes |
| `contact_inquiry` | Contact Us | Yes |

### Form instance spawning

Admin can spawn a new instance of any form (system or custom). The instance is a deep copy with its own slug, label, fee toggle, and settings. Changes to the parent do not propagate to instances. Use case: "Spring Open House — No Application Fee" vs. the standard enrollment form with fee.

### The enrollment application form (7-step wizard)

1. **Welcome + Parent Info** — name, email, phone, relationship, address
2. **Child Information (repeatable)** — repeater group (1–5 children): name, preferred name, DOB, gender, photo upload. "Add another child" button.
3. **Program Selection (per child)** — image choice grid of programs per child, schedule preference, desired start date
4. **Medical & Safety (per child)** — conditional fields: allergies (yes/no → detail), medical conditions, dietary restrictions, medications, pediatrician
5. **Family & Background** — how heard, referral, faith community, sibling enrolled, parent goals, custom fields injection point
6. **Agreement & Payment** — legal acceptances, conditional Stripe Payment Elements when `fee_enabled = true`
7. **Confirmation** — confetti animation, timeline of next steps, application ID

### Enrollment fee toggle

- `fee_enabled boolean` and `fee_amount_cents integer` on `forms` table
- Admin toggles fee on/off per form instance from form settings
- When on: Stripe Payment Elements appear in Step 6, charged via tenant's Stripe Connect account
- When off: Step 6 shows only legal acceptances, no payment

### Multi-child submission

Each child in the repeater creates its own `enrollment_application` row. All linked to the same `form_response_id` and `parent_email`. Each child gets an independent triage score.

### Data model additions

```
- forms table additions:
  - is_system_form boolean DEFAULT false
  - system_form_key text
  - parent_form_id uuid (for spawned instances)
  - instance_label text
  - fee_enabled boolean DEFAULT false
  - fee_amount_cents integer
  - fee_description text DEFAULT 'Application Fee'
- form_fields table additions:
  - is_locked boolean DEFAULT false
  - is_system_field boolean DEFAULT false
```

Migration: `0046_system_forms.sql`

---

## 47. Multi-step application pipeline (v3.0 addition)

> The enrollment form (§46) is Step 1. This section defines the full application pipeline from submission through enrollment.

### Pipeline stages

```
Form Submitted → Under Review → Interview Invited → Interview Scheduled → Interview Completed → Offer Sent → Offer Accepted → Enrolled
                      ↓                                                           ↓
                  Waitlisted                                                  Waitlisted
                  Rejected                                                    Rejected
                  Info Requested                                              Withdrawn
```

### Pipeline features

- **Pipeline step tracking:** `application_pipeline_steps` table records every stage transition with timestamp, actor, and notes
- **Admin actions:** Accept & Send Interview Invitation, Request Info, Waitlist, Reject, Mark Interview Complete, Send Enrollment Offer
- **"Accept & Send Interview" action:** Updates application status, creates pipeline step, sends email to parent with tokenized booking link for the appointment system (§48)
- **Pipeline timeline view:** Admin sees the full journey for each application with timestamps and actors
- **Pipeline stage filters:** Filter application queue by pipeline stage
- **Bulk actions:** Send interview invitations to multiple approved applications at once

### Data model additions

```
- application_pipeline_steps — (id, tenant_id, application_id, step_type, status, assigned_to, notes, metadata jsonb, completed_at, completed_by, created_at)
- enrollment_applications additions:
  - pipeline_stage text DEFAULT 'form_submitted'
  - interview_scheduled_at timestamptz
  - interview_completed_at timestamptz
  - interview_notes text
  - offer_sent_at timestamptz
  - offer_accepted_at timestamptz
  - form_response_id uuid
```

Migration: `0047_application_pipeline.sql`

---

## 48. Appointment booking system (v3.0 addition — Calendly replacement)

> No competitor has integrated appointment booking. Schools currently use Calendly, Acuity, or phone tag. We build it in — tenant-branded, pipeline-integrated, and calendar-synced.

### Why

The interview step of enrollment requires scheduling. External tools (Calendly) break the brand experience, don't link to applications, and cost extra. An integrated booking widget means: parent clicks link in email → sees tenant-branded calendar → picks a time → books → pipeline auto-updates → staff calendar auto-blocked.

### Appointment types

Admin-configurable per tenant: name, duration, buffer, location (in-person/virtual/phone), assigned staff, round-robin, booking window, min notice, max per day, reminders.

Default for CCA: "School Tour & Interview" — 30 min, in-person, 15-min buffer after, 24h min notice, max 4/day.

### Booking widget

Standalone page at `/{tenantSlug}/book/{appointmentTypeSlug}`. Beautiful, mobile-first, tenant-branded. Calendar month view with available date dots → time slot picker → booking form (name, email, phone, notes) → confirmation with "Add to Calendar" buttons (Google, Outlook, Apple .ics).

### Staff availability

- Recurring weekly patterns (M-F 9am-3pm)
- Date-specific overrides (block vacation days, open special hours)
- Connected external calendars: sync busy times from Google Calendar, Outlook/Microsoft 365, Apple iCal
- Available time slots computed from: availability patterns − overrides − existing bookings − external calendar busy times − buffer times

### Calendar integration

- **Google Calendar:** OAuth 2.0, read free/busy + write events. `googleapis` package.
- **Outlook/Microsoft 365:** OAuth 2.0 via Microsoft Graph, read free/busy + write events. `@microsoft/microsoft-graph-client` package.
- **Apple Calendar:** Read-only via CalDAV/iCal URL. Parse .ics feed for busy times. `ical.js` package.
- Background sync every 15 minutes via Supabase Edge Function.

### Pipeline integration

When appointment is booked for an enrollment application:
- Application pipeline stage → `interview_scheduled`
- `interview_scheduled_at` set on application record
- Pipeline step created
- Staff notified

### Data model

```
- appointment_types — (id, tenant_id, name, slug, description, duration_minutes, buffer_before, buffer_after, location, location_type, virtual_meeting_url, booking_window_days, min_notice_hours, max_per_day, max_per_slot, assigned_staff uuid[], round_robin, auto_confirm, reminder_hours integer[], linked_pipeline_stage, is_active)
- staff_availability — (id, tenant_id, user_id, day_of_week, start_time, end_time, appointment_type_id, effective_from, effective_to)
- staff_availability_overrides — (id, tenant_id, user_id, date, is_available, start_time, end_time, reason)
- calendar_connections — (id, tenant_id, user_id, provider [google/outlook/apple], access_token_encrypted, refresh_token_encrypted, calendar_id, sync_direction [read/write/both], last_synced_at, status)
- appointments — (id, tenant_id, appointment_type_id, booked_by_user_id, booked_by_name, booked_by_email, booked_by_phone, start_at, end_at, timezone, staff_user_id, status [pending/confirmed/cancelled_by_parent/cancelled_by_staff/rescheduled/no_show/completed], enrollment_application_id, notes, staff_notes, external_calendar_event_id, reminder_sent_at, created_at)
```

Migration: `0048_appointments.sql`

### Acceptance criteria
- [ ] Booking widget renders with tenant branding on phone. Parent selects date + time + books in under 2 minutes.
- [ ] Available slots correctly computed from staff availability minus existing bookings minus synced calendar busy times.
- [ ] Round-robin distributes bookings evenly among assigned staff.
- [ ] Booking confirmation shows "Add to Calendar" buttons that generate correct .ics files.
- [ ] Reminder emails sent at configured intervals.
- [ ] Pipeline auto-updates when appointment booked from enrollment email link.
- [ ] Staff availability overrides correctly block/open specific dates.
- [ ] Google Calendar sync reads busy times and writes booked appointments.

---

## Appendix A — SuiteDash migration map

> **STATUS: PENDING** — This appendix will be filled in after the read-only SuiteDash audit. The audit will be performed using Claude in Chrome, following the same methodology as the Yes Mamms audit (see Yes Mamms `PORTAL_BUILD_BRIEF.md` Appendix A for the process template).
>
> Ground rules:
> - **Never write to SuiteDash.** Read-only. URL navigation and exports only.
> - Capture: student records, family contacts, classroom/group structures, enrollment forms, billing history, staff records, documents, email templates, automations.
> - Map each SuiteDash entity to the new schema.
> - Identify data that needs parsing (free-text fields with structured data).
> - Flag any outstanding balances for reconciliation with Skylar before generating new invoices.
