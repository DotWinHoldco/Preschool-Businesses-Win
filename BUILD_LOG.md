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

### 2026-04-16 — PHASE 13: Custom fields engine + form builder
- **What:** Built tenant-scoped custom fields engine (18 field types, entity-scoped, admin UI, search/filter integration) and form builder (30+ field types, conversational + document modes, logic engine, e-signatures, Stripe payment, submission action pipeline, standalone pages, admin responses + analytics).
- **Why:** CCA_BUILD_BRIEF.md §44 + §45 / OVERNIGHT_BUILD_PLAN.md Phase 13
- **Where:** `supabase/migrations/0044_custom_fields.sql` · `supabase/migrations/0045_form_builder.sql` · `src/lib/schemas/custom-field.ts` · `src/lib/schemas/form.ts` · `src/lib/forms/logic-engine.ts` · `src/lib/actions/custom-fields.ts` · `src/lib/actions/forms.ts` · `src/lib/actions/form-responses.ts` · `src/components/custom-fields/CustomFieldsSection.tsx` · `src/components/forms/fields/index.tsx` · `src/components/forms/ConversationalForm.tsx` · `src/components/forms/DocumentForm.tsx` · `src/app/portal/admin/settings/custom-fields/page.tsx` · `src/app/portal/admin/forms/page.tsx` · `src/app/portal/admin/forms/new/page.tsx` · `src/app/portal/admin/forms/[formId]/edit/page.tsx` · `src/app/portal/admin/forms/[formId]/responses/page.tsx` · `src/app/portal/admin/forms/[formId]/analytics/page.tsx` · `src/app/(forms)/[tenantSlug]/[formSlug]/page.tsx`
- **How to extend:** Add new field types in `src/components/forms/fields/index.tsx` FIELD_RENDERERS map. Add new submission actions in `form_submission_actions` table. Seed templates via `form_templates` table.
- **Grep anchors:** `@anchor: platform.custom-fields`, `@anchor: platform.custom-fields.schema`, `@anchor: platform.custom-fields.actions`, `@anchor: platform.custom-fields.section-component`, `@anchor: platform.custom-fields.admin-page`, `@anchor: platform.custom-fields.manager-component`, `@anchor: platform.form-builder`, `@anchor: platform.form-builder.schema`, `@anchor: platform.form-builder.actions`, `@anchor: platform.form-builder.response-actions`, `@anchor: platform.form-builder.logic-engine`, `@anchor: platform.form-builder.field-registry`, `@anchor: platform.form-builder.conversational-renderer`, `@anchor: platform.form-builder.document-renderer`, `@anchor: platform.form-builder.list-page`, `@anchor: platform.form-builder.create-page`, `@anchor: platform.form-builder.edit-page`, `@anchor: platform.form-builder.builder-ui`, `@anchor: platform.form-builder.responses-page`, `@anchor: platform.form-builder.analytics-page`, `@anchor: platform.form-builder.standalone-page`
- **Spec ref:** `CCA_BUILD_BRIEF.md §44 §45` / `OVERNIGHT_BUILD_PLAN.md Phase 13`
- **Database tables created:** custom_field_entity_types, custom_fields, custom_field_options, custom_field_values, forms, form_sections, form_fields, form_variables, form_responses, form_response_values, form_response_drafts, form_signature_requests, form_submission_actions, form_templates
- **Feature flags added:** custom_fields, form_builder (enabled for CCA)
- **Build status:** `npm run build` PASSES CLEAN

### 2026-04-08 — PHASES 1-14: Full platform build pushed to main
- **What:** Built Phases 1-14 in parallel: auth, CRUD, check-in, daily reports, staff, billing, messaging, curriculum, CRM, CACFP, expenses, checklists, documents, calendar, surveys, analytics, emergency, compliance, hardware, marketing site. 342 files, 47,897 lines.
- **Why:** Complete overnight build per OVERNIGHT_BUILD_PLAN.md
- **Where:** Entire `src/` directory. 38 page routes, 141 components, 61 server actions, 21 schemas, 10 API routes.
- **Build status:** `npm run build` PASSES (TypeScript + compilation clean). Pushed to main. Vercel auto-deploying.
- **Spec ref:** `OVERNIGHT_BUILD_PLAN.md Phases 0-14`

### 2026-04-08 — PHASE 0: Project init + multi-tenant infrastructure
- **What:** Initialized Next.js 16.2.3 project with full multi-tenant Supabase schema (43 feature areas), CCA seed data, core lib files, 28 UI primitives, proxy.ts, tenant theming, and app shell.
- **Why:** Foundation for all subsequent phases — OVERNIGHT_BUILD_PLAN.md Phase 0
- **Where:** `src/proxy.ts` · `src/lib/tenant/*.ts` · `src/lib/theme/inject-tenant-theme.tsx` · `src/lib/supabase/*.ts` · `src/lib/constants.ts` · `src/components/ui/*` · `src/app/layout.tsx` · `src/app/(marketing)/layout.tsx` · `src/app/portal/layout.tsx` · Supabase: 12 migrations (tenants → emergency_training_compliance_remaining)
- **How to extend:** Add new feature tables via Supabase MCP `apply_migration`. Add new UI primitives in `src/components/ui/`. Add new route groups under `src/app/`.
- **Grep anchors:** `@anchor: platform.tenants`, `@anchor: platform.tenant-domains`, `@anchor: platform.tenant-branding`, `@anchor: platform.tenant-features`, `@anchor: platform.user-tenants`, `@anchor: platform.saas-billing`, `@anchor: platform.tenant-context`, `@anchor: platform.seed-cca`, `@anchor: platform.root-layout`, `@anchor: platform.constants`, `@anchor: cca.audit`, `@anchor: cca.student`, `@anchor: cca.medical`, `@anchor: cca.family`, `@anchor: cca.classroom`, `@anchor: cca.dfps`, `@anchor: cca.checkin`, `@anchor: cca.attendance`, `@anchor: cca.carline`, `@anchor: cca.daily-report`, `@anchor: cca.staff`, `@anchor: cca.payroll`, `@anchor: cca.billing`, `@anchor: cca.messaging`, `@anchor: cca.newsfeed`, `@anchor: cca.notify`, `@anchor: cca.curriculum`, `@anchor: cca.portfolio`, `@anchor: cca.assessment`, `@anchor: cca.enrollment`, `@anchor: cca.leads`, `@anchor: cca.food-program`, `@anchor: cca.expenses`, `@anchor: cca.subsidy`, `@anchor: cca.checklist`, `@anchor: cca.documents`, `@anchor: cca.calendar`, `@anchor: cca.emergency`, `@anchor: cca.training`, `@anchor: cca.compliance`, `@anchor: cca.survey`, `@anchor: cca.dropin`, `@anchor: cca.analytics`, `@anchor: cca.door`, `@anchor: cca.camera`, `@anchor: cca.migration`
- **Spec ref:** `OVERNIGHT_BUILD_PLAN.md Phase 0`, `PLATFORM_ARCHITECTURE.md §1-§12`
- **Database tables created:** tenants, tenant_domains, tenant_branding, tenant_features, user_profiles, user_tenant_memberships, user_roles, platform_admins, platform_subscriptions, audit_log, students, student_medical_profiles, student_allergies, student_medications, student_immunizations, student_emergency_contacts, student_developmental_milestones, families, family_members, student_family_links, authorized_pickups, classrooms, classroom_staff_assignments, student_classroom_assignments, dfps_ratio_requirements, check_ins, check_outs, attendance_records, attendance_amendments, student_qr_codes, carline_sessions, carline_queue_entries, daily_reports, daily_report_entries, daily_schedule_entries, parent_prep_checklists, staff_profiles, staff_certifications, staff_background_checks, staff_schedules, time_entries, pto_balances, pto_requests, payroll_runs, payroll_line_items, billing_plans, family_billing_enrollments, invoices, invoice_lines, payments, payment_receipts, annual_tax_statements, account_credits, application_fees, tuition_agreements, payment_reminders, conversations, conversation_members, messages, message_read_receipts, message_templates, message_schedules, newsfeed_posts, newsfeed_reactions, notification_preferences, notifications, notification_deliveries, learning_domains, curriculum_standards, lesson_plans, lesson_plan_activities, activity_library, portfolio_entries, portfolio_media, developmental_assessments, assessment_ratings, enrollment_applications, enrollment_leads, lead_activities, tours, lead_automations, meal_menus, meal_service_records, cacfp_claims, cacfp_claim_lines, expense_categories, expenses, accounting_exports, subsidy_agencies, family_subsidies, subsidy_claims, checklist_templates, checklist_items, checklist_assignments, checklist_responses, documents, calendar_events, event_rsvps, event_sign_ups, event_sign_up_entries, emergency_events, emergency_actions, reunification_records, training_requirements, training_records, training_goals, compliance_standards, compliance_checks, inspection_records, ratio_compliance_log, surveys, survey_questions, survey_responses, survey_answers, drop_in_availability, drop_in_bookings, saved_reports, report_exports, entity_notes, door_locks, door_access_rules, door_access_log, cameras, camera_bookmarks, legacy_suitedash_ids, incident_reports, licensing_documents
- **Build status:** `npm run build` PASSES CLEAN
