# Preschool Businesses Win — Build log

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

### 2026-04-08 — PHASE 0: Project init + multi-tenant infrastructure
- **What:** Initialized Next.js 16.2.3 project with full multi-tenant Supabase schema (43 feature areas), CCA seed data, core lib files, 28 UI primitives, proxy.ts, tenant theming, and app shell.
- **Why:** Foundation for all subsequent phases — OVERNIGHT_BUILD_PLAN.md Phase 0
- **Where:** `src/proxy.ts` · `src/lib/tenant/*.ts` · `src/lib/theme/inject-tenant-theme.tsx` · `src/lib/supabase/*.ts` · `src/lib/constants.ts` · `src/components/ui/*` · `src/app/layout.tsx` · `src/app/(marketing)/layout.tsx` · `src/app/portal/layout.tsx` · Supabase: 12 migrations (tenants → emergency_training_compliance_remaining)
- **How to extend:** Add new feature tables via Supabase MCP `apply_migration`. Add new UI primitives in `src/components/ui/`. Add new route groups under `src/app/`.
- **Grep anchors:** `@anchor: platform.tenants`, `@anchor: platform.tenant-domains`, `@anchor: platform.tenant-branding`, `@anchor: platform.tenant-features`, `@anchor: platform.user-tenants`, `@anchor: platform.saas-billing`, `@anchor: platform.tenant-context`, `@anchor: platform.seed-cca`, `@anchor: platform.root-layout`, `@anchor: platform.constants`, `@anchor: cca.audit`, `@anchor: cca.student`, `@anchor: cca.medical`, `@anchor: cca.family`, `@anchor: cca.classroom`, `@anchor: cca.dfps`, `@anchor: cca.checkin`, `@anchor: cca.attendance`, `@anchor: cca.carline`, `@anchor: cca.daily-report`, `@anchor: cca.staff`, `@anchor: cca.payroll`, `@anchor: cca.billing`, `@anchor: cca.messaging`, `@anchor: cca.newsfeed`, `@anchor: cca.notify`, `@anchor: cca.curriculum`, `@anchor: cca.portfolio`, `@anchor: cca.assessment`, `@anchor: cca.enrollment`, `@anchor: cca.leads`, `@anchor: cca.food-program`, `@anchor: cca.expenses`, `@anchor: cca.subsidy`, `@anchor: cca.checklist`, `@anchor: cca.documents`, `@anchor: cca.calendar`, `@anchor: cca.emergency`, `@anchor: cca.training`, `@anchor: cca.compliance`, `@anchor: cca.survey`, `@anchor: cca.dropin`, `@anchor: cca.analytics`, `@anchor: cca.door`, `@anchor: cca.camera`, `@anchor: cca.migration`
- **Spec ref:** `OVERNIGHT_BUILD_PLAN.md Phase 0`, `PLATFORM_ARCHITECTURE.md §1-§12`
- **Database tables created:** tenants, tenant_domains, tenant_branding, tenant_features, user_profiles, user_tenant_memberships, user_roles, platform_admins, platform_subscriptions, audit_log, students, student_medical_profiles, student_allergies, student_medications, student_immunizations, student_emergency_contacts, student_developmental_milestones, families, family_members, student_family_links, authorized_pickups, classrooms, classroom_staff_assignments, student_classroom_assignments, dfps_ratio_requirements, check_ins, check_outs, attendance_records, attendance_amendments, student_qr_codes, carline_sessions, carline_queue_entries, daily_reports, daily_report_entries, daily_schedule_entries, parent_prep_checklists, staff_profiles, staff_certifications, staff_background_checks, staff_schedules, time_entries, pto_balances, pto_requests, payroll_runs, payroll_line_items, billing_plans, family_billing_enrollments, invoices, invoice_lines, payments, payment_receipts, annual_tax_statements, account_credits, application_fees, tuition_agreements, payment_reminders, conversations, conversation_members, messages, message_read_receipts, message_templates, message_schedules, newsfeed_posts, newsfeed_reactions, notification_preferences, notifications, notification_deliveries, learning_domains, curriculum_standards, lesson_plans, lesson_plan_activities, activity_library, portfolio_entries, portfolio_media, developmental_assessments, assessment_ratings, enrollment_applications, enrollment_leads, lead_activities, tours, lead_automations, meal_menus, meal_service_records, cacfp_claims, cacfp_claim_lines, expense_categories, expenses, accounting_exports, subsidy_agencies, family_subsidies, subsidy_claims, checklist_templates, checklist_items, checklist_assignments, checklist_responses, documents, calendar_events, event_rsvps, event_sign_ups, event_sign_up_entries, emergency_events, emergency_actions, reunification_records, training_requirements, training_records, training_goals, compliance_standards, compliance_checks, inspection_records, ratio_compliance_log, surveys, survey_questions, survey_responses, survey_answers, drop_in_availability, drop_in_bookings, saved_reports, report_exports, entity_notes, door_locks, door_access_rules, door_access_log, cameras, camera_bookmarks, legacy_suitedash_ids, incident_reports, licensing_documents
- **Build status:** `npm run build` PASSES CLEAN
