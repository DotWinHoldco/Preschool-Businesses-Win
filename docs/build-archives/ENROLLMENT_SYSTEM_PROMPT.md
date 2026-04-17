# Claude Code prompt — Enrollment System Form + Appointment Booking (Phase 13B)

> Paste this into a Claude Code session inside the `preschool-businesses-win` project directory. This builds the **system enrollment form**, **multi-step application pipeline**, **enrollment fee toggle with Stripe**, **form instance spawning**, and **Calendly-style appointment booking widget** with calendar integration.
>
> **Prerequisite:** Phase 13 (form builder + custom fields) must be complete. This prompt uses the form builder infrastructure from §44–§45 to create the first "system form."

---

## Required reading (in this order, before writing any code)

1. `AGENTS.md` — Next.js 16 rules. `proxy.ts` not `middleware.ts`. Async params/searchParams/headers/cookies.
2. `docs/PLATFORM_ARCHITECTURE.md` — multi-tenant architecture. Every table has `tenant_id`. Every RLS policy starts with tenant isolation. CSS variables for theming.
3. `docs/CCA_BUILD_BRIEF.md` §15 ("Enrollment pipeline"), §28 ("Enrollment CRM + lead management"), §40 ("Enhanced billing"), §44 ("Custom fields"), §45 ("Form builder").
4. `docs/OVERNIGHT_BUILD_PLAN.md` Phase 13 — the form builder phase.
5. `docs/BRAND.md` — design system tokens.
6. Existing enrollment code:
   - `src/lib/schemas/enrollment.ts` — current Zod schemas (4-step wizard)
   - `src/components/enrollment/enrollment-wizard.tsx` — current wizard component
   - `src/components/enrollment/wizard-steps/` — current step components
   - `src/lib/actions/enrollment/submit-enrollment.ts` — current submit action
   - `src/lib/actions/enrollment/process-application.ts` — current approval flow

**Read the existing enrollment code. You are replacing it with something 10x better.**

---

## SuiteDash form audit (reference — what we're replacing)

> Captured via Chrome from `https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt` on 2026-04-16.

The current SuiteDash enrollment form is a 3-step process:

**Step 1: "Choose a Pricing Package"** — Application fee of $100, currently displayed as "SPECIAL ENROLLMENT OFFER - APPLICATION FEE WAIVED." This is their version of the fee toggle (a sale pricing package with $0 effective cost). Our system handles this 10x better with a real admin toggle per form instance.

**Step 2: "Your Details"** — Single long-scroll form with sections:
- **About You:** First name*, last name*, address*, city*, state*, ZIP*, email*, occupation, work phone, driver's license number
- **Student's Information:** Student name*, nickname, current grade (dropdown: Infant 12wk–17mo, Toddlers 18–23mo, Twos, Threes, Pre-K, Kindergarten), age on September 1st*
- **Multi-child logic:** "Do you need to apply for another child?" (Yes/No radio). If Yes → reveals second child fields (name, nickname, grade, age). Second child has "Do you need to apply for a third child?" → reveals third child. Third child has "Do you need to apply for a fourth child?" Cascading reveal, not a repeater — each child is hardcoded with slightly inconsistent field labels and different grade options (bug). Our repeater pattern is vastly superior.
- **Other Parent:** "Is this parent's address the same as above?" (Yes/No) — if No, reveals "Secondary Parent's Address" field. Then: name, occupation, work phone, driver's license number.
- **Family Name** (e.g., "The Smith Family")
- **Signature Block** (Click to Sign)

**Step 3: "Payment Details"** — Credit/debit card form. "Complete & Pay" button.

**Post-submission:** "Submission Received! Thank You!" with "Apply For Another Student" link back to the same form.

**Bugs and issues in their form we fix:**
1. Grade/program options are inconsistent between child 1 (has "Kindergarten") and child 2/3 (has "Pre-Kinder" instead, different age formatting)
2. "Ocupation" typo
3. No medical/allergy fields at all — dangerous gap for child safety
4. No emergency contacts
5. No DOB field (asks "age on Sept 1st" as free text instead of computing from DOB)
6. No photo upload
7. Multi-child is hardcoded cascading conditionals (max ~4) instead of a dynamic repeater
8. No "how heard" or referral tracking
9. Single long scroll instead of wizard steps
10. No custom fields injection point
11. No per-child program selection with classroom photos

---

## What you're building

### Concept: System Forms

A **system form** is a form that is core to the platform — it exists as built-in functionality, not as a user-created form. System forms:

- Are **seeded automatically** when a tenant is created (like the enrollment application form)
- Have a **fixed core structure** (required fields, logic, submission actions) that cannot be deleted by the form builder
- Allow **admin customization** via the form builder: add custom fields, reorder non-locked fields, change theme/branding, edit labels/descriptions, add sections
- Are **versioned** — the platform can push updates to system form templates without destroying tenant customizations
- Have a `is_system_form boolean` flag on the `forms` table and a `system_form_key text` identifier (e.g., `'enrollment_application'`)

### What gets built

1. **System form infrastructure** — `is_system_form` + `system_form_key` + `locked` field flag on form_fields
2. **The enrollment application form** — a beautiful, wizard-style system form that replaces the current 4-step enrollment wizard. 10x better than SuiteDash.
3. **Multi-child support** — "Add another child" repeater logic with per-child program selection, DOB, medical info
4. **Enrollment fee toggle** — admin can toggle application fee on/off per form instance. Stripe Payment Elements when on.
5. **Form instance spawning** — duplicate a system form with different settings (e.g., one with fee, one without for events/sales)
6. **Multi-step application pipeline** — Step 1: enrollment form → Staff review → Accept → Step 2: interview invitation
7. **Appointment booking widget** — Calendly-style scheduling with staff availability, multi-calendar sync (Outlook/GCal/iCal)

---

## 1. System form infrastructure

### Migration: `0046_system_forms.sql`

```sql
-- Add system form fields to existing forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_system_form boolean NOT NULL DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS system_form_key text;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS parent_form_id uuid REFERENCES forms(id);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS instance_label text;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_amount_cents integer;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS fee_description text DEFAULT 'Application Fee';

-- Add locked flag to form_fields (system form core fields can't be deleted)
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS is_system_field boolean NOT NULL DEFAULT false;

-- Unique constraint: one system form key per tenant (for the primary instance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_system_key_tenant 
  ON forms(tenant_id, system_form_key) 
  WHERE system_form_key IS NOT NULL AND parent_form_id IS NULL;

-- Form instances (spawned copies) reference their parent
CREATE INDEX IF NOT EXISTS idx_forms_parent ON forms(parent_form_id) WHERE parent_form_id IS NOT NULL;
```

### System form keys (platform-level registry)

| Key | Name | Description |
|---|---|---|
| `enrollment_application` | Enrollment Application | Primary enrollment form — Step 1 of application pipeline |
| `re_enrollment` | Annual Re-Enrollment | Pre-filled from existing data, collects updates + signature |
| `medical_authorization` | Medical Authorization | Allergy/medication consent with physician signature |
| `photo_release` | Photo/Media Release | Granular consent for photo/video use |
| `field_trip_permission` | Field Trip Permission | Per-event permission slip with e-signature |
| `incident_acknowledgment` | Incident Report Acknowledgment | Parent signature on incident reports |
| `visitor_sign_in` | Visitor Sign-In | Public kiosk form, no auth required |
| `contact_inquiry` | Contact Us | Public form, creates enrollment lead |

### System form seeding

When a tenant is created, seed system forms from platform templates:
```ts
async function seedSystemForms(tenantId: string) {
  const templates = await getSystemFormTemplates()
  for (const template of templates) {
    const form = await createFormFromTemplate(tenantId, template)
    // Mark as system form
    await updateForm(form.id, {
      is_system_form: true,
      system_form_key: template.key,
    })
    // Mark core fields as locked
    await lockSystemFields(form.id, template.lockedFieldKeys)
  }
}
```

### Form instance spawning

Admin can "spawn" a new instance of any form (system or custom):
- Creates a deep copy of the form (fields, sections, variables, logic, actions, theme)
- The copy has `parent_form_id` pointing to the original
- The copy has its own `slug`, `instance_label` (e.g., "Spring Open House — No Fee"), and independent settings
- Fee toggle, access control, and other settings are independent per instance
- Changes to the parent do NOT propagate to spawned instances (they're independent copies)
- Admin UI: "Create instance" button on any form → modal: instance label, toggle fee on/off, set fee amount → creates copy

---

## 2. The enrollment application form (THE SYSTEM FORM)

This replaces the existing 4-step enrollment wizard at `src/components/enrollment/`. The new form is built using the form builder infrastructure (§45) but rendered as a purpose-built wizard with premium animations.

### Form mode: Conversational (wizard-style)

Auto-advance on selections. Smooth slide transitions. Progress bar. Keyboard navigation. Mobile-first. 60fps animations. The most beautiful enrollment form in the childcare industry.

### Form structure (7 steps)

**Step 1: Welcome + Parent Info**
```
[Image banner: school photo or video from tenant branding]
[Section header: "Let's get started"]
[Description: "We're so glad you're interested in {tenant.name}. This application takes about 5 minutes."]

- parent_first_name (short_text, required, locked)
- parent_last_name (short_text, required, locked)
- parent_email (email, required, locked)
- parent_phone (phone, required, locked)
- relationship_to_child (single_select_radio: Parent, Grandparent, Guardian, Other — locked)
- parent_address (address_autocomplete, required — street, city, state, zip — locked)
- parent_occupation (short_text, optional — "Your occupation")
- parent_work_phone (phone, optional — "Work phone number")
- parent_drivers_license (short_text, optional — "Driver's license number" — used for ID verification at pickup)
```

> **Note from SuiteDash audit:** The current SuiteDash form collects address (street/city/state/zip), occupation, work phone, and driver's license number. The DL# is useful for authorized pickup verification. All carried forward.

**Step 2: Child Information (repeatable)**
```
[Section header: "Tell us about your child"]
[Description: "We'd love to get to know them."]

--- REPEATER GROUP: children[] (min: 1, max: 5) ---
For each child:
  - child_first_name (short_text, required, locked)
  - child_last_name (short_text, required, locked)
  - child_preferred_name (short_text, optional — "What does your child like to be called?")
  - child_dob (date, required, locked)
  - child_gender (single_select_radio: Male, Female, Prefer not to say — locked)
  - child_photo (image_upload, optional — "Upload a recent photo")

[+ Add another child] button — adds another child group with slide-in animation
[Remove child] — X button on each child group (except first)
--- END REPEATER ---
```

**Step 3: Program Selection (per child)**
```
[Section header: "Choose a program for each child"]

--- FOR EACH CHILD (from Step 2) ---
[Child name badge: "{child.first_name}"]

  - program_type (image_choice grid, required, locked):
    • Infant (12 weeks – 17 months) — with classroom photo
    • Toddlers (18 – 23 months) — with classroom photo
    • Twos — with classroom photo
    • Threes — with classroom photo
    • Pre-K — with classroom photo
    • Kindergarten — with classroom photo
    • Before & After Care — with icon
    • Summer Camp — with icon
  
  > **Note from SuiteDash audit:** CCA's actual age groups are Infant (12 weeks–17 months), Toddlers (18–23 months), Twos, Threes, Pre-K, and Kindergarten. The SuiteDash form had inconsistent options between child 1 and child 2/3 — we standardize on this canonical list.

  - schedule_preference (button_group: Full Day, Half Day AM, Half Day PM — locked)
  - desired_start_date (date, required, locked)
  - [Computed display: "Your child will be {age} on September 1, {year}" — calculated from child_dob, displayed as a helper, not a field]

--- END FOR EACH ---
```

**Step 4: Medical & Safety (per child)**
```
[Section header: "Health & safety information"]
[Description: "This helps us keep your child safe from day one."]

--- FOR EACH CHILD ---
[Child name badge]

  - has_allergies (yes_no, required, locked)
  - allergies_detail (long_text, conditional: show if has_allergies = yes — "Please list all allergies, severity, and any medications (e.g., EpiPen)")
  - has_medical_conditions (yes_no, required)
  - medical_conditions_detail (long_text, conditional: show if has_medical_conditions = yes)
  - has_dietary_restrictions (yes_no, required)
  - dietary_restrictions_detail (long_text, conditional: show if has_dietary_restrictions = yes)
  - special_needs_or_accommodations (long_text, optional — "Any developmental, behavioral, or learning needs we should know about?")
  - current_medications (long_text, optional — "List any medications your child takes regularly")
  - pediatrician_name (short_text, optional)
  - pediatrician_phone (phone, optional)

--- END FOR EACH ---
```

**Step 5: Family & Background**
```
[Section header: "A little more about your family"]

--- OTHER PARENT SECTION ---
[Subheader: "Other Parent / Guardian"]
[Description: "If there is another parent or guardian for the student(s), please provide their information."]

- has_other_parent (yes_no — "Is there another parent or guardian?")

--- CONDITIONAL: show if has_other_parent = yes ---
  - other_parent_name (short_text, required — "Other parent's full name")
  - other_parent_same_address (yes_no — "Does this parent live at the same address?")
  - other_parent_address (address_autocomplete, conditional: show if other_parent_same_address = no — "Other parent's address")
  - other_parent_occupation (short_text, optional — "Other parent's occupation")
  - other_parent_work_phone (phone, optional — "Other parent's work phone number")
  - other_parent_drivers_license (short_text, optional — "Other parent's driver's license number")
--- END CONDITIONAL ---

> **Note from SuiteDash audit:** The SuiteDash form has a full "Other Parent" section with address same/different toggle, name, occupation, work phone, and DL#. This supports blended family modeling from day one — data feeds directly into the `family_members` table when the application is approved.

--- FAMILY & DISCOVERY ---
[Subheader: "About your family"]

- family_name (short_text, required — "Family name (e.g., The Smith Family)" — locked)
- how_heard (single_select_dropdown: Google, Facebook, Instagram, Friend/Referral, Church, Drive-by, Community Event, Other — locked)
- how_heard_other (short_text, conditional: show if how_heard = Other)
- referral_family_name (short_text, conditional: show if how_heard = Friend/Referral — "Who referred you?")
- faith_community (short_text, optional — "Church or faith community, if any")
- has_sibling_enrolled (yes_no — "Does another child in your family currently attend {tenant.name}?")
- sibling_name (short_text, conditional: show if has_sibling_enrolled = yes)
- parent_goals (long_text, optional — "What are you looking for in a preschool? What are your goals for your child?")
- anything_else (long_text, optional — "Anything else you'd like us to know?")

--- CUSTOM FIELDS INJECTION POINT ---
[Any custom fields added by admin via form builder appear here, grouped by section_label]
--- END CUSTOM FIELDS ---
```

**Step 6: Agreement & Payment (conditional)**
```
[Section header: "Almost done!"]

- agree_to_contact (legal_acceptance, required, locked — "I agree to be contacted by {tenant.name} regarding this application.")
- agree_to_policies (legal_acceptance, required, locked — "I have read and agree to the school's policies and handbook." — with link to handbook PDF)
- acknowledge_accuracy (legal_acceptance, required, locked — "I certify that the information provided in this application is accurate and complete.")

--- CONDITIONAL: if form.fee_enabled = true ---
[Description block: "Application Fee: ${form.fee_amount / 100}"]
[Description: "{form.fee_description}. This fee is non-refundable and secures your spot in our review queue."]
- payment (payment_stripe: one_time, amount from form.fee_amount_cents)
--- END CONDITIONAL ---
```

**Step 7: Confirmation / Thank You**
```
[Confetti animation]
[Check circle icon with scale-bounce animation]
[H2: "Application received!"]
[Body: "Thank you, {parent_first_name}! We've received your application for {child_names_list}. Our team will review it within {tenant.review_days || 2} business days. You'll receive an email at {parent_email} with next steps."]
[Body: "What happens next:"]
[Timeline graphic:
  1. "We review your application" (1-2 business days)
  2. "We invite you for a tour & interview" (email + booking link)
  3. "You visit the school and meet the team"
  4. "We send your enrollment offer"
  5. "Your child starts their adventure!"
]
[CTA: "Return to {tenant.name}" → tenant marketing site]
```

### Repeater field implementation

The multi-child repeater is a new field type category for the form builder:

```ts
// New field type: 'repeater_group'
// Config: { min_items: 1, max_items: 5, item_label: 'Child', add_button_label: 'Add another child' }
// Contains child fields that repeat per item
// Each item gets a unique index for field key namespacing: children[0].first_name, children[1].first_name

interface RepeaterGroupConfig {
  min_items: number        // Minimum required items (1 for enrollment)
  max_items: number        // Maximum allowed items (5 for enrollment)
  item_label: string       // "Child" — displayed as "Child 1", "Child 2"
  add_button_label: string // "+ Add another child"
  remove_button_label: string // "Remove"
  fields: FormField[]      // The fields that repeat per item
  // Downstream steps that need per-item rendering reference this repeater's field_key
  downstream_per_item: boolean // If true, subsequent steps with per_item fields iterate over this repeater
}
```

The repeater stores values as JSON arrays in `form_response_values`:
```json
{
  "children": [
    {
      "first_name": "Sophia",
      "last_name": "Doe",
      "dob": "2022-03-15",
      "gender": "female",
      "program_type": "prek",
      "schedule_preference": "full_day",
      "desired_start_date": "2026-08-15",
      "has_allergies": true,
      "allergies_detail": "Peanut allergy (severe, EpiPen on site)"
    },
    {
      "first_name": "James",
      "last_name": "Doe",
      "dob": "2024-06-01",
      "gender": "male",
      "program_type": "toddler",
      "schedule_preference": "full_day",
      "desired_start_date": "2026-08-15",
      "has_allergies": false
    }
  ]
}
```

### Submission actions for enrollment form

Configure these `form_submission_actions` in order:

1. **store** — write to `form_responses` + `form_response_values`
2. **create_entity** — create `enrollment_applications` record(s):
   - One `enrollment_application` row per child (if 2 children submitted, 2 application rows)
   - All linked to the same `form_response_id` and `parent_email`
   - Each gets its own `triage_score` computed from program availability, sibling bonus, faith community, etc.
   - Store `other_parent_*` and `family_name` fields in the application's metadata jsonb (used when creating family on approval)
   - Store `parent_occupation`, `parent_work_phone`, `parent_drivers_license` in metadata (used for parent profile + authorized pickup setup)
3. **create_entity** — create `enrollment_leads` record (one per submission, not per child):
   - Source: `website`, source_detail: `enrollment_form`
   - Links to the first `enrollment_application` ID
4. **stripe_charge** — if `fee_enabled`: process application fee via tenant Stripe Connect
5. **notify** — email director: "New enrollment application from {parent_name} for {child_count} child(ren)"
6. **notify** — email parent: confirmation with application ID, next steps, timeline
7. **generate_pdf** — render branded PDF of the complete application (all children, all fields)

---

## 3. Multi-step application pipeline

### Pipeline stages

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌─────────────┐     ┌──────────┐
│ Step 1: Apply   │ ──► │ Staff Review  │ ──► │ Step 2: Interview │ ──► │ Staff Final  │ ──► │ Enrolled │
│ (enrollment     │     │ (admin queue) │     │ (appointment      │     │ Decision     │     │          │
│  form)          │     │              │     │  booking)         │     │              │     │          │
└─────────────────┘     └──────────────┘     └───────────────────┘     └─────────────┘     └──────────┘
                              │                                              │
                              ├── Waitlist                                   ├── Waitlist
                              ├── Request Info                               ├── Reject
                              └── Reject                                     └── Offer
```

### Migration: `0047_application_pipeline.sql`

```sql
-- Application pipeline steps
CREATE TABLE application_pipeline_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES enrollment_applications(id),
  step_type text NOT NULL CHECK (step_type IN (
    'form_submitted', 'under_review', 'info_requested', 
    'interview_invited', 'interview_scheduled', 'interview_completed',
    'offer_sent', 'offer_accepted', 'enrolled',
    'waitlisted', 'rejected', 'withdrawn'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_steps_app ON application_pipeline_steps(application_id);
CREATE INDEX idx_pipeline_steps_tenant ON application_pipeline_steps(tenant_id);

-- Add pipeline columns to enrollment_applications
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'form_submitted';
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_scheduled_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_completed_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS interview_notes text;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS offer_sent_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS offer_accepted_at timestamptz;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS form_response_id uuid;

-- RLS
ALTER TABLE application_pipeline_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON application_pipeline_steps
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### Admin pipeline UI enhancements

Update `src/app/portal/admin/enrollment/page.tsx`:

- Add pipeline stage column to the application table
- Add pipeline stage filter (dropdown: All, Form Submitted, Under Review, Interview Invited, Interview Scheduled, Interview Completed, Offer Sent, Enrolled)
- Add bulk actions: "Send Interview Invitation" (for selected approved applications)
- Application detail view shows full pipeline timeline with timestamps

### Pipeline actions (server actions)

Create `src/lib/actions/enrollment/pipeline-actions.ts`:

```ts
// Accept + Send Interview Invitation
async function acceptAndInviteInterview(applicationId: string, staffMemberId?: string): Promise<void> {
  // 1. Update application: triage_status = 'approved', pipeline_stage = 'interview_invited'
  // 2. Create pipeline step: step_type = 'interview_invited'
  // 3. Send email to parent with:
  //    - Congratulations message
  //    - Embedded appointment booking link (tokenized): /book/{tenantSlug}/{appointmentTypeSlug}?token={jwt}
  //    - The JWT contains: application_id, parent_email, parent_name, child_names, expires_at
  // 4. Create notification for admin: "Interview invitation sent to {parent_name}"
  // 5. Audit log
}

// Mark Interview Complete
async function markInterviewComplete(applicationId: string, notes: string): Promise<void> {
  // 1. Update application: pipeline_stage = 'interview_completed', interview_completed_at, interview_notes
  // 2. Create pipeline step
  // 3. Audit log
}

// Send Enrollment Offer
async function sendEnrollmentOffer(applicationId: string): Promise<void> {
  // 1. Update application: pipeline_stage = 'offer_sent', offer_sent_at
  // 2. Create pipeline step
  // 3. Send email to parent with enrollment offer + tuition agreement form link
  // 4. Audit log
}

// Parent Accepts Offer (creates family + student + triggers onboarding)
async function acceptOffer(applicationId: string): Promise<void> {
  // 1. Call existing processApplication('approve') logic
  // 2. Update application: pipeline_stage = 'enrolled', offer_accepted_at
  // 3. Create pipeline step
  // 4. Trigger onboarding checklist assignment
  // 5. Send welcome email
  // 6. Audit log
}
```

---

## 4. Appointment booking system (Calendly-style)

### Philosophy

A fully integrated appointment booking widget that replaces the need for Calendly, Acuity, or any external scheduling tool. It's built into the platform, uses tenant branding, syncs with staff calendars, and ties directly into the enrollment pipeline.

### Migration: `0048_appointments.sql`

```sql
-- @anchor: cca.appointments

-- Appointment types (configurable by admin)
CREATE TABLE appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,                          -- "School Tour & Interview"
  slug text NOT NULL,                          -- "tour-interview"
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  buffer_before_minutes integer NOT NULL DEFAULT 0,
  buffer_after_minutes integer NOT NULL DEFAULT 15,
  color text,                                  -- for calendar display
  location text,                               -- "Main Office" or "Virtual (Zoom link sent after booking)"
  location_type text NOT NULL DEFAULT 'in_person' CHECK (location_type IN ('in_person', 'virtual', 'phone')),
  virtual_meeting_url text,                    -- Zoom/Teams link (if virtual)
  
  -- Availability
  booking_window_days integer NOT NULL DEFAULT 30, -- How far ahead parents can book
  min_notice_hours integer NOT NULL DEFAULT 24,    -- Minimum notice before appointment
  max_per_day integer,                             -- Max appointments of this type per day (null = unlimited)
  max_per_slot integer NOT NULL DEFAULT 1,         -- Max concurrent bookings per time slot
  
  -- Assignment
  assigned_staff uuid[],                       -- Staff members who handle this type
  round_robin boolean NOT NULL DEFAULT false,   -- Distribute evenly among assigned staff
  
  -- Confirmation
  require_confirmation boolean NOT NULL DEFAULT false, -- Staff must confirm booking
  auto_confirm boolean NOT NULL DEFAULT true,
  confirmation_message text,
  
  -- Reminders
  reminder_hours integer[] NOT NULL DEFAULT '{24, 1}', -- Send reminders X hours before
  
  -- Pipeline integration
  linked_pipeline_stage text,                  -- 'interview_invited' — auto-create pipeline step on booking
  
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE (tenant_id, slug)
);

-- Staff availability patterns (recurring weekly schedule)
CREATE TABLE staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  appointment_type_id uuid REFERENCES appointment_types(id), -- null = applies to all types
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date, -- null = no end date
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CHECK (start_time < end_time)
);

-- Staff availability overrides (specific dates — block or open)
CREATE TABLE staff_availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  is_available boolean NOT NULL, -- false = blocked, true = override with custom hours
  start_time time, -- required if is_available = true
  end_time time,   -- required if is_available = true
  reason text,     -- "Vacation", "Conference", etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Calendar sync connections
CREATE TABLE calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  provider_account_id text,              -- external account identifier
  access_token_encrypted text,           -- encrypted OAuth token
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  calendar_id text,                      -- specific calendar to sync
  sync_direction text NOT NULL DEFAULT 'both' CHECK (sync_direction IN ('read', 'write', 'both')),
  -- read: block times from external calendar
  -- write: push bookings to external calendar
  -- both: read availability + write bookings
  last_synced_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Booked appointments
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  appointment_type_id uuid NOT NULL REFERENCES appointment_types(id),
  
  -- Who booked
  booked_by_user_id uuid REFERENCES auth.users(id),  -- null for public bookings
  booked_by_name text NOT NULL,
  booked_by_email text NOT NULL,
  booked_by_phone text,
  
  -- When
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Chicago',
  
  -- Who hosts
  staff_user_id uuid REFERENCES auth.users(id),      -- assigned staff member
  
  -- Status
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'cancelled_by_parent', 'cancelled_by_staff',
    'rescheduled', 'no_show', 'completed'
  )),
  
  -- Context
  enrollment_application_id uuid REFERENCES enrollment_applications(id),
  notes text,                              -- parent's notes at booking
  staff_notes text,                        -- internal notes
  cancellation_reason text,
  rescheduled_from_id uuid REFERENCES appointments(id),
  
  -- External calendar
  external_calendar_event_id text,         -- ID of event in connected calendar
  virtual_meeting_url text,                -- Generated meeting link
  
  -- Reminders
  reminder_sent_at timestamptz[],
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, start_at);
CREATE INDEX idx_appointments_staff ON appointments(staff_user_id, start_at);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_application ON appointments(enrollment_application_id);

-- RLS on all tables
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON appointment_types
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON staff_availability
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON staff_availability_overrides
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON calendar_connections
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON appointments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### Appointment booking widget

**Route:** `src/app/(forms)/[tenantSlug]/book/[appointmentTypeSlug]/page.tsx`

This is a standalone page (outside portal chrome, like form pages) that renders the booking widget.

**The widget:**

```
┌─────────────────────────────────────────────────────┐
│  [Tenant Logo]                                       │
│  School Tour & Interview                             │
│  30 minutes · In-person · Main Office                │
│                                                      │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │  CALENDAR            │  │  AVAILABLE TIMES     │  │
│  │                      │  │                      │  │
│  │  ◀ April 2026 ▶      │  │  [Selected: Apr 18] │  │
│  │  Su Mo Tu We Th Fr Sa│  │                      │  │
│  │        1  2  3  4  5 │  │  ○ 9:00 AM          │  │
│  │   6  7  8  9 10 11 12│  │  ○ 9:30 AM          │  │
│  │  13 14 15 16 17 ●18 19│  │  ● 10:00 AM         │  │
│  │  20 21 22 23 24 25 26│  │  ○ 10:30 AM         │  │
│  │  27 28 29 30         │  │  ○ 11:00 AM         │  │
│  │                      │  │  ○ 2:00 PM          │  │
│  │  ● = available       │  │  ○ 2:30 PM          │  │
│  │  ○ = unavailable     │  │  ○ 3:00 PM          │  │
│  └─────────────────────┘  └──────────────────────┘  │
│                                                      │
│  ── Selected: Friday, April 18 at 10:00 AM ──       │
│                                                      │
│  Your name:    [________________]                    │
│  Your email:   [________________]                    │
│  Your phone:   [________________]                    │
│  Notes:        [________________]                    │
│                                                      │
│  [    Confirm Booking    ]                           │
│                                                      │
│  Powered by .win                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**

- **Calendar view:** Month calendar showing available dates (green dots). Days with no availability are grayed out. Past dates disabled.
- **Time slot picker:** When a date is selected, show available time slots. Computed from:
  1. Staff availability patterns (recurring weekly)
  2. Minus staff availability overrides (blocked days)
  3. Minus existing bookings (appointment + buffer)
  4. Minus busy times from synced external calendars
  5. Filtered by `booking_window_days` and `min_notice_hours`
  6. Filtered by `max_per_day` and `max_per_slot`
- **Staff assignment:** If `round_robin = true`, assign to the staff member with fewest bookings this week. If specific staff assigned, show only their availability.
- **Timezone handling:** Detect visitor timezone, show times in their timezone, store in UTC. Display timezone selector.
- **Booking form:** Name, email, phone, optional notes. If accessed via tokenized link (from pipeline), pre-fill from application data.
- **Confirmation:** After booking, show confirmation screen with:
  - Date/time
  - Location/address or virtual meeting link
  - "Add to calendar" buttons (Google Calendar, Outlook, Apple Calendar — generates .ics file)
  - "Reschedule" and "Cancel" links
- **Confirmation email:** Sent to parent AND assigned staff. Includes .ics attachment.
- **Reminder emails:** Sent at configured intervals before appointment (default: 24h and 1h).
- **Pipeline integration:** When an appointment is booked for an enrollment application:
  - Update `enrollment_applications.pipeline_stage = 'interview_scheduled'`
  - Update `enrollment_applications.interview_scheduled_at`
  - Create `application_pipeline_steps` record
  - Notify assigned staff

### Calendar sync implementation

**Google Calendar:**
- OAuth 2.0 flow: admin connects their Google account
- Read: fetch free/busy data to block times
- Write: create events for booked appointments with attendees
- Use `googleapis` npm package (add to deps with justification: "Google Calendar API for appointment booking sync")

**Outlook / Microsoft 365:**
- OAuth 2.0 flow via Microsoft Graph API
- Read: fetch free/busy and events
- Write: create events
- Use `@microsoft/microsoft-graph-client` (add to deps with justification: "Microsoft Graph API for Outlook calendar sync")

**Apple Calendar (iCal):**
- Read-only via CalDAV URL (user provides their iCal URL)
- Parse .ics feed to extract busy times
- No write-back (Apple doesn't support write via CalDAV for consumer accounts)
- Use `ical.js` (add to deps with justification: "iCal parser for Apple Calendar sync")

**Sync strategy:**
- Background sync every 15 minutes via Supabase Edge Function cron
- On-demand sync when booking widget loads (fetch latest availability)
- Cache synced busy times in `calendar_connections.last_synced_at` + a `synced_events` jsonb column (or separate table if needed)

### Admin UI for appointments

**Settings page:** `src/app/portal/admin/settings/appointments/page.tsx`
- Create/edit appointment types
- Configure duration, buffer, location, max per day
- Assign staff members
- Toggle round-robin
- Set booking window and minimum notice

**Staff availability page:** `src/app/portal/admin/staff/[staffId]/availability/page.tsx`
- Weekly recurring schedule grid (drag to set hours)
- Date-specific overrides (block days for vacation, open special hours)
- Connected calendars list with sync status

**Appointments dashboard:** `src/app/portal/admin/appointments/page.tsx`
- Calendar view of all booked appointments
- List view with filters (date range, type, staff, status)
- Quick actions: confirm, reschedule, cancel, mark no-show, mark complete
- Appointment detail: full info + pipeline context + notes

---

## 5. File tree (new + modified files)

```
src/
  app/
    (forms)/
      [tenantSlug]/
        book/
          [appointmentTypeSlug]/
            page.tsx                 # Standalone appointment booking widget
    (portal)/
      admin/
        enrollment/
          page.tsx                   # MODIFY: add pipeline stage column + filters
          [applicationId]/
            page.tsx                 # MODIFY: add pipeline timeline view
            pipeline/page.tsx        # Pipeline detail + actions
        settings/
          appointments/
            page.tsx                 # Appointment type management
        staff/
          [staffId]/
            availability/page.tsx    # Staff availability editor
        appointments/
          page.tsx                   # Appointments dashboard + calendar
          [appointmentId]/page.tsx   # Appointment detail
  components/
    enrollment/
      system-enrollment-form.tsx     # NEW: the system enrollment form (replaces enrollment-wizard.tsx)
      repeater-group.tsx             # NEW: multi-child repeater component
      child-card.tsx                 # NEW: per-child info card within repeater
      program-selector.tsx           # NEW: image choice program selector per child
      enrollment-fee-toggle.tsx      # NEW: admin toggle for fee on/off
      form-instance-spawner.tsx      # NEW: admin modal to spawn form instances
      pipeline-timeline.tsx          # NEW: visual pipeline step tracker
      pipeline-actions.tsx           # NEW: admin action buttons (accept, invite, waitlist, reject)
    appointments/
      booking-widget.tsx             # NEW: the Calendly-style booking widget
      calendar-month.tsx             # NEW: month calendar with availability dots
      time-slot-picker.tsx           # NEW: time slot selection panel
      booking-confirmation.tsx       # NEW: confirmation screen with add-to-calendar
      staff-availability-editor.tsx  # NEW: weekly schedule grid for staff
      availability-override.tsx      # NEW: date-specific override editor
      calendar-connection.tsx        # NEW: OAuth connect flow for Google/Outlook
      appointment-card.tsx           # NEW: appointment info card
      appointment-calendar-view.tsx  # NEW: admin calendar view of all appointments
    forms/
      fields/
        RepeaterGroup.tsx            # NEW: repeater group field type for form builder
  lib/
    actions/
      enrollment/
        submit-enrollment.ts         # MODIFY: handle multi-child, fee, pipeline
        process-application.ts       # MODIFY: add pipeline stage transitions
        pipeline-actions.ts          # NEW: accept-and-invite, mark-complete, send-offer, etc.
      appointments/
        create-appointment-type.ts
        manage-availability.ts
        book-appointment.ts
        cancel-appointment.ts
        reschedule-appointment.ts
        sync-calendar.ts             # Calendar sync logic
    schemas/
      enrollment.ts                  # MODIFY: multi-child schema, pipeline schema
      appointment.ts                 # NEW: appointment Zod schemas
    calendar/
      google.ts                      # Google Calendar API client
      outlook.ts                     # Microsoft Graph API client
      ical-parser.ts                 # iCal/CalDAV parser
      availability-calculator.ts     # Compute available slots from all sources
      ics-generator.ts               # Generate .ics files for add-to-calendar
    forms/
      system-forms.ts                # NEW: system form registry + seeding logic
      repeater-engine.ts             # NEW: repeater field value handling
  types/
    appointment.ts                   # NEW: appointment type definitions
supabase/
  migrations/
    0046_system_forms.sql
    0047_application_pipeline.sql
    0048_appointments.sql
```

---

## 6. New dependencies (with justifications)

```bash
npm i googleapis         # Google Calendar API for appointment booking sync
npm i @microsoft/microsoft-graph-client  # Microsoft Graph API for Outlook calendar sync  
npm i ical.js            # iCal parser for Apple Calendar read-only sync
```

---

## 7. Non-negotiables

- **Multi-tenant:** Every new table has `tenant_id`. Every RLS policy starts with tenant isolation.
- **CSS variables:** The booking widget and enrollment form inherit tenant theme. Never hardcode colors.
- **System form integrity:** Core enrollment fields are `is_locked = true`. Admin can add fields but not delete locked ones.
- **Multi-child data integrity:** Each child in a multi-child submission creates its own `enrollment_application` row. All linked to the same `form_response_id`.
- **Stripe through tenant Connect:** Application fees charged through tenant's Stripe Connect account, not the platform account. Use `Stripe-Account` header.
- **Calendar sync security:** OAuth tokens encrypted at rest. Refresh tokens rotated. Sync runs server-side only.
- **Appointment booking respects all constraints:** Staff availability, overrides, external calendar busy times, buffer times, max per day, min notice, booking window. Never double-book.
- **Animations at 60fps:** The enrollment form wizard transitions, the booking widget date/time selection — all smooth. Motion library. Respect `prefers-reduced-motion`.
- **Feature flag:** Gate appointment booking behind `hasTenantFeature('appointment_booking')`. System forms are always available.

---

## 8. Seed data for CCA

```sql
-- Seed "School Tour & Interview" appointment type for CCA
INSERT INTO appointment_types (tenant_id, name, slug, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, location, location_type, booking_window_days, min_notice_hours, max_per_day, round_robin, auto_confirm, reminder_hours, linked_pipeline_stage) VALUES
  ('CCA_TENANT_UUID', 'School Tour & Interview', 'tour-interview', 'Meet our team, tour the classrooms, and ask any questions about enrollment.', 30, 0, 15, 'CCA Main Office', 'in_person', 30, 24, 4, false, true, '{24, 1}', 'interview_scheduled');

-- Seed enrollment form with fee_enabled = false (default — CCA can toggle on)
-- This is done via the system form seeding logic in system-forms.ts
```

---

## 9. VERIFY (before moving on)

Run through this checklist:

- [ ] **System form infrastructure:** Create a form via form builder. Verify `is_system_form` and `system_form_key` flags work. Verify locked fields cannot be deleted in the builder.
- [ ] **Enrollment form renders:** Open the enrollment form on phone (375px). Verify wizard-style flow with animations.
- [ ] **Multi-child repeater:** Add a second child. Verify fields repeat correctly (name, DOB, program, medical per child). Remove second child. Verify it removes cleanly.
- [ ] **3-child submission:** Submit form with 3 children. Verify 3 separate `enrollment_application` rows created, all linked to the same `form_response_id`.
- [ ] **Program selection per child:** Verify image choice grid appears per child with classroom photos.
- [ ] **Medical conditional logic:** Toggle "Has allergies?" to Yes. Verify detail field appears. Toggle to No. Verify it hides.
- [ ] **Fee toggle:** Admin toggles fee on. Open form. Verify Stripe Payment Elements appear in Step 6. Submit with Stripe test card. Verify payment processed.
- [ ] **Fee toggle off:** Admin toggles fee off. Open form. Verify no payment step. Submit succeeds without payment.
- [ ] **Form instance spawn:** Spawn a new instance of the enrollment form with "Open House — No Fee" label. Verify the instance has its own slug, no fee, and is independently editable.
- [ ] **Pipeline stage tracking:** Submit an application. Verify it appears as "Form Submitted" in admin queue. Admin clicks "Accept & Send Interview Invitation." Verify status changes to "Interview Invited" and email sent to parent.
- [ ] **Appointment booking widget:** Click the booking link in the email. Verify the Calendly-style widget loads with tenant branding. Select a date. Verify available times shown. Select time. Fill in info. Book. Verify confirmation screen with "Add to Calendar" buttons.
- [ ] **Appointment pipeline integration:** After booking, verify application pipeline stage updates to "Interview Scheduled" with the appointment datetime.
- [ ] **Staff availability:** Set staff availability (M-F 9am-3pm). Block a specific day. Verify the booking widget hides that day.
- [ ] **Calendar sync (Google):** Connect Google Calendar. Add a busy event. Run sync. Verify the booking widget hides that time slot.
- [ ] **.ics download:** Click "Add to Apple Calendar" on booking confirmation. Verify .ics file downloads and opens correctly.
- [ ] **Appointment reminders:** Verify reminder email sent 24h before appointment (use time manipulation or check notification_deliveries table).
- [ ] **Admin appointments dashboard:** Verify all booked appointments appear in calendar view. Mark one as "Completed." Verify status updates.
- [ ] **Custom fields in enrollment form:** Admin adds a custom field (e.g., "T-shirt size") to the enrollment form via form builder. Verify it appears in Step 5 (Family & Background).
- [ ] **PDF generation:** After submission, verify branded PDF of complete application (all children) is generated and viewable in admin.
- [ ] **Mobile excellence:** Complete entire flow on phone: submit enrollment form (2 children, with fee) → receive email → book appointment → confirmation. Under 8 minutes total.

When all checks pass, log completion in `BUILD_LOG.md` and proceed to the next phase.
