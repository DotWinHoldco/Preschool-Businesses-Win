# Claude Code prompt — Form builder + custom fields (Phase 13)

> Paste this into a Claude Code session inside the `preschool-businesses-win` project directory. This builds the custom fields engine (§44) and form builder (§45) from `CCA_BUILD_BRIEF.md`. This corresponds to **Phase 13** of `OVERNIGHT_BUILD_PLAN.md`.

---

## Required reading (in this order, before writing any code)

1. `AGENTS.md` — Next.js 16 rules. `proxy.ts` not `middleware.ts`. Async params/searchParams/headers/cookies.
2. `docs/PLATFORM_ARCHITECTURE.md` — multi-tenant architecture. Every table has `tenant_id`. Every RLS policy starts with tenant isolation. CSS variables for theming.
3. `docs/CCA_BUILD_BRIEF.md` §44 ("Custom fields system") — the full custom fields spec: 18 field types, entity-type-scoped, admin UI, search/filter integration, form builder integration.
4. `docs/CCA_BUILD_BRIEF.md` §45 ("Form builder") — the full form builder spec: two builder modes (conversational + document), 30+ field types, logic engine, e-signatures, payment, embedding, dynamic data placeholders, submission actions, templates.
5. `docs/OVERNIGHT_BUILD_PLAN.md` Phase 13 — the step-by-step execution plan for this phase (13.1–13.7).
6. `docs/BRAND.md` — design system tokens. Forms inherit tenant CSS variables by default.

**Read §44 and §45 of the build brief cover-to-cover. They are the canonical spec. Phase 13 of the overnight plan is the execution order.**

---

## What you're building

Two tightly coupled systems that together create the most powerful form experience in the preschool management space:

### System 1: Custom fields engine (§44)

A tenant-scoped custom fields system that extends any entity type (student, family, staff, classroom, enrollment_application, incident_report, checklist_item) without schema changes.

**Key decisions:**
- 18 field types (text through json) stored in typed value columns — NOT a single jsonb blob
- `custom_field_values` uses dedicated columns: `value_text`, `value_numeric`, `value_boolean`, `value_date`, `value_json`, `value_file_path` — only one is non-null per row
- Fields are searchable (universal search) and filterable (list views) based on per-field flags
- File/image uploads go to `tenant-{id}-custom-fields/` storage bucket
- Parent-visible and parent-editable flags control what parents see and can edit
- Custom field values are available as `{{entity.custom.field_key}}` merge variables in the form builder

**Migration:** `0044_custom_fields.sql` — creates `custom_field_entity_types` (pre-seeded), `custom_fields`, `custom_field_options`, `custom_field_values`. All with `tenant_id` + RLS.

### System 2: Form builder (§45)

A Typeform-quality conversational form builder with DocuSign-quality e-signatures, Stripe payment integration, calculated fields, and dynamic data merge — all rendered with 60fps animations.

**Key decisions:**
- **Two modes, one schema:** Conversational (one-question-at-a-time, auto-advance) and Document (multi-section scrollable). Both use the same `form_fields` table. Switchable without data loss.
- **30+ field types** organized by category: Text, Choice, Date/Time, Media, Layout, Advanced, Data, Signature. See §45 field type table.
- **Logic engine** (`src/lib/forms/logic-engine.ts`): conditional show/hide, jump logic, calculated fields with formula engine, named variables.
- **Animations:** Motion library for slide/fade/zoom/flip transitions between questions. Micro-interactions on selection (ripple, scale-bounce, check-mark draw). Must be 60fps and respect `prefers-reduced-motion`.
- **E-signatures:** Canvas-based signature pad (draw or type). Full audit trail: IP, timestamp, browser fingerprint, SHA-256 content hash. Multi-signer sequential and parallel workflows. Audit certificate PDF.
- **Payment:** Stripe Elements integration via tenant's Stripe Connect account. Amount from fixed value or calculated variable.
- **Embedding:** Standalone page (`/forms/{slug}`), iframe embed (auto-resizing), popup modal, inline React component.
- **Access control:** Public (+ turnstile), authenticated, role-restricted, tokenized (signed JWT with prefill data + expiry).
- **Dynamic data:** `{{student.first_name}}`, `{{family.custom.church_name}}`, `{{current_date}}`, `{{respondent.email}}` — resolved at form-load and submission time.
- **Submission actions pipeline:** 9 configurable actions executed in order (store, write_entity, create_entity, notify, webhook, stripe_charge, generate_pdf, assign_checklist, update_custom_field).
- **Partial saves:** Auto-save drafts in conversational mode. Resume via token or auth.
- **12 pre-built templates** seeded at platform level (enrollment, re-enrollment, medical auth, photo release, field trip, incident report, survey, staff onboarding, tuition agreement, visitor sign-in, waitlist, contact).

**Migration:** `0045_form_builder.sql` — creates `forms`, `form_fields`, `form_sections`, `form_variables`, `form_responses`, `form_response_values`, `form_response_drafts`, `form_signature_requests`, `form_submission_actions`, `form_templates`. All with `tenant_id` + RLS.

---

## Execution order (Phase 13 of OVERNIGHT_BUILD_PLAN.md)

Follow sections 13.1 through 13.7 exactly as written in the build plan:

1. **13.1** — Custom fields engine: migration, admin UI, entity form injection, search/filter integration
2. **13.2** — Form builder data model: migration with all 11 tables
3. **13.3** — Form builder UI: three-panel builder (field palette, canvas, settings), mode toggle, variable editor, theme panel, live preview
4. **13.4** — Form rendering engine: ConversationalForm.tsx (auto-advance, animations, progress bar, keyboard nav), DocumentForm.tsx (sections, inline validation, responsive), all 30+ field components, SignaturePad, PaymentStep, ImageChoice, DynamicPlaceholders
5. **13.5** — Form access + embedding: standalone page route `(forms)/[tenantSlug]/[formSlug]/`, embed route, inline component, access control middleware
6. **13.6** — Submission handling: action pipeline, e-signature workflow (single + multi-signer), audit certificate PDF
7. **13.7** — Form templates + admin experience: seed 12 templates, responses table, analytics dashboard

---

## File tree (new files for this phase)

```
src/
  app/
    (portal)/
      admin/
        settings/
          custom-fields/page.tsx     # Custom fields manager
        forms/
          page.tsx                   # All forms list
          new/page.tsx               # Form builder (create)
          [formId]/
            edit/page.tsx            # Form builder (edit)
            responses/page.tsx       # Response table view
            responses/[responseId]/page.tsx
            analytics/page.tsx       # Drop-off, completion, revenue
            settings/page.tsx        # Access control, actions, thank-you
    (forms)/                          # Outside portal chrome
      [tenantSlug]/
        [formSlug]/
          page.tsx                   # Standalone form page
          embed/page.tsx             # Embeddable iframe version
  components/
    custom-fields/
      CustomFieldsSection.tsx        # Injects custom fields into entity forms
      CustomFieldInput.tsx           # Per-type field renderer
      CustomFieldFilter.tsx          # For list view filters
    forms/
      builder/
        FormBuilder.tsx              # Main builder component (3-panel)
        FieldPalette.tsx             # Left panel: draggable field types
        FormCanvas.tsx               # Center: WYSIWYG canvas
        FieldSettings.tsx            # Right panel: config for selected field
        LogicRuleEditor.tsx          # Visibility + jump rule builder
        VariableEditor.tsx           # Named variable formula editor
        ThemePanel.tsx               # Per-form design overrides
        PreviewPane.tsx              # Phone/tablet/desktop preview toggle
      fields/                        # One component per field type
        ShortText.tsx
        LongText.tsx
        RichText.tsx
        Email.tsx
        Phone.tsx
        Url.tsx
        Number.tsx
        Currency.tsx
        SingleSelectDropdown.tsx
        SingleSelectRadio.tsx
        MultiSelectCheckbox.tsx
        ImageChoice.tsx
        ButtonGroup.tsx
        Rating.tsx
        OpinionScale.tsx
        Nps.tsx
        YesNo.tsx
        LegalAcceptance.tsx
        DatePicker.tsx
        TimePicker.tsx
        DateTime.tsx
        DateRange.tsx
        AppointmentSlot.tsx
        FileUpload.tsx
        ImageUpload.tsx
        VideoEmbed.tsx
        SignaturePad.tsx
        SectionHeader.tsx
        DescriptionBlock.tsx
        Divider.tsx
        ImageBanner.tsx
        VideoBanner.tsx
        Spacer.tsx
        PaymentStripe.tsx
        Calculator.tsx
        HiddenField.tsx
        AddressAutocomplete.tsx
        MatrixGrid.tsx
        Ranking.tsx
        Slider.tsx
        EntityLookup.tsx
        CustomFieldValue.tsx
        DynamicSelect.tsx
      ConversationalForm.tsx         # One-question-at-a-time renderer
      DocumentForm.tsx               # Multi-section scrollable renderer
      FormHeader.tsx                 # Branded header
      FormFooter.tsx                 # Footer
      FormEmbed.tsx                  # Inline embed component
      DynamicPlaceholders.tsx        # Merge field resolver
      PaymentStep.tsx                # Stripe Elements wrapper
  lib/
    forms/
      logic-engine.ts                # Visibility, jumps, calculations, variables
      submission-handler.ts          # Post-submit action pipeline
      pdf-generator.ts               # Render form response as branded PDF
      signature-audit.ts             # Content hash, audit certificate generation
      merge-fields.ts                # Resolve {{entity.field}} placeholders
      form-schemas.ts                # Zod schemas for all form operations
    custom-fields/
      custom-field-schemas.ts        # Zod schemas for custom field CRUD
      custom-field-renderer.ts       # Field type → component mapping
  actions/
    custom-fields.ts                 # Server actions: CRUD custom fields + values
    forms.ts                         # Server actions: CRUD forms + fields
    form-responses.ts                # Server actions: submit, edit, export responses
    form-signatures.ts               # Server actions: signature workflow management
supabase/
  migrations/
    0044_custom_fields.sql
    0045_form_builder.sql
```

---

## Non-negotiables for this phase

- **Multi-tenant:** Every table has `tenant_id`. Every RLS policy starts with `tenant_id = current_setting('app.tenant_id')::uuid`.
- **CSS variables:** Forms inherit tenant theme. Per-form overrides use the same CSS variable system. Never hardcode a color.
- **Server Components by default.** The builder and renderer have interactive elements (`'use client'`), but list pages, response tables, and analytics should be server components where possible.
- **Zod validation on every server action.** The form builder generates dynamic schemas at runtime from `form_fields` configuration.
- **Animations at 60fps.** Use the Motion library (already installed). Test on phone. Respect `prefers-reduced-motion`.
- **E-signature audit trail is legally important.** SHA-256 hash of the form data at signing time. IP, timestamp, browser fingerprint. Generate an audit certificate PDF on completion.
- **Payment through tenant's Stripe Connect account.** Never through the platform account. Use `Stripe-Account` header.
- **Feature flag:** Gate the form builder behind `hasTenantFeature('form_builder')`. Gate custom fields behind `hasTenantFeature('custom_fields')`.

---

## VERIFY (before moving to Phase 14)

Run through this checklist:

- [ ] Custom field: create text, select, and file fields on "student" entity type. Fill values on a student. Values persist and display. CSV export includes them. Searchable field returns in universal search.
- [ ] Form builder: create a new conversational form with 10+ fields including image choice, logic jumps (skip a question based on answer), calculated pricing variable, Stripe payment field, and e-signature.
- [ ] Publish the form. Open standalone page on phone (375px). Verify: auto-advance on selection, slide animations smooth (60fps), progress bar updates, Enter to advance on text, back button works.
- [ ] Fill out the form completely including payment (Stripe test mode) and signature. Verify response stored, payment processed, PDF generated with signature and branding.
- [ ] Embed the form via iframe on a test page. Verify auto-resize and no scrollbar issues.
- [ ] Set form to public. Open in incognito. Verify no login required, turnstile shown. Submit. Response captured with IP.
- [ ] Set form to authenticated. Open in incognito. Verify redirect to login.
- [ ] Create a tokenized pre-fill link for a specific student. Open link. Verify fields pre-populated from entity data.
- [ ] Multi-signer test: create form with 2 sequential signers. Signer 1 submits. Verify email sent to Signer 2 with token link. Signer 2 signs. Verify form status → completed. Verify audit certificate PDF has both signatures.
- [ ] Admin responses view: verify table shows all responses, sortable, filterable, exportable as CSV.
- [ ] Analytics: verify completion rate and drop-off chart render correctly.
- [ ] Custom field merge: create form with `{{student.custom.shirt_size}}` in a description block. Open with student context. Verify merge field resolves.
- [ ] Partial save: start filling conversational form, close browser, reopen URL. Verify progress restored.
- [ ] Clone a platform template (enrollment application). Verify all fields, logic, and design cloned correctly.

When all checks pass, log completion in `BUILD_LOG.md` and proceed to Phase 14.
