// @anchor: platform.system-forms
// Registry of platform-provided system forms. Each template defines the form's
// structure (sections, fields, submission actions). Seeded into new tenants and
// can be updated via upgrade migrations without breaking tenant customization.

import { US_STATES } from '@/lib/constants/us-states'

export type SystemFormKey =
  | 'enrollment_application'
  | 're_enrollment'
  | 'medical_authorization'
  | 'photo_release'
  | 'field_trip_permission'
  | 'incident_acknowledgment'
  | 'visitor_sign_in'
  | 'contact_inquiry'

export interface SystemFormSectionSpec {
  title: string
  description?: string
  page_number: number
  iterate_over_field_key?: string
}

export interface SystemFormFieldSpec {
  field_key: string
  field_type: string
  label?: string
  description?: string
  placeholder?: string
  page_number: number
  section_index: number
  sort_order: number
  is_required?: boolean
  is_locked?: boolean
  is_system_field?: boolean
  config?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
  logic_rules?: Array<Record<string, unknown>>
}

export interface SystemFormActionSpec {
  action_type:
    | 'store'
    | 'write_entity'
    | 'create_entity'
    | 'notify'
    | 'webhook'
    | 'stripe_charge'
    | 'generate_pdf'
    | 'assign_checklist'
    | 'update_custom_field'
  config: Record<string, unknown>
  sort_order: number
}

export interface SystemFormTemplate {
  key: SystemFormKey
  title: string
  slug: string
  description: string
  mode: 'conversational' | 'document'
  access_control: 'public' | 'authenticated' | 'role_restricted' | 'tokenized'
  fee_enabled?: boolean
  fee_amount_cents?: number
  fee_description?: string
  thank_you_title: string
  thank_you_message: string
  header_config?: Record<string, unknown>
  sections: SystemFormSectionSpec[]
  fields: SystemFormFieldSpec[]
  actions: SystemFormActionSpec[]
}

// ---------------------------------------------------------------------------
// Enrollment application template — the canonical 7-step wizard
// ---------------------------------------------------------------------------

const ENROLLMENT_APPLICATION: SystemFormTemplate = {
  key: 'enrollment_application',
  title: 'Enrollment Application',
  slug: 'enrollment-application',
  description:
    'Apply to enroll your child. Multi-child families can submit a single application.',
  mode: 'conversational',
  access_control: 'public',
  fee_enabled: false,
  fee_amount_cents: 10000,
  fee_description: 'Application Fee',
  thank_you_title: 'Application received!',
  thank_you_message:
    "We've received your application and our team will review it within 1-2 business days. You'll receive an email with next steps.",
  sections: [
    { title: "Let's get started", description: 'Tell us a bit about you.', page_number: 1 },
    { title: 'Tell us about your child', description: "We'd love to get to know them.", page_number: 2 },
    { title: 'Choose a program for each child', description: 'Each child can be enrolled in a different program.', page_number: 3, iterate_over_field_key: 'children' },
    { title: 'Health & safety information', description: 'This helps us keep your child safe from day one.', page_number: 4, iterate_over_field_key: 'children' },
    { title: 'A little more about your family', page_number: 5 },
    { title: 'Almost done!', page_number: 6 },
    { title: 'Confirmation', page_number: 7 },
  ],
  fields: [
    // Step 1: Parent Info
    { field_key: 'parent_first_name', field_type: 'short_text', label: 'First name', page_number: 1, section_index: 0, sort_order: 10, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'parent_last_name', field_type: 'short_text', label: 'Last name', page_number: 1, section_index: 0, sort_order: 20, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'parent_email', field_type: 'email', label: 'Email', page_number: 1, section_index: 0, sort_order: 30, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'parent_phone', field_type: 'phone', label: 'Phone', page_number: 1, section_index: 0, sort_order: 40, is_required: true, is_locked: true, is_system_field: true },
    {
      field_key: 'relationship_to_child',
      field_type: 'single_select_radio',
      label: 'Relationship to child',
      page_number: 1,
      section_index: 0,
      sort_order: 50,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: {
        options: [
          { label: 'Parent', value: 'parent' },
          { label: 'Grandparent', value: 'grandparent' },
          { label: 'Guardian', value: 'guardian' },
          { label: 'Other', value: 'other' },
        ],
      },
    },
    { field_key: 'parent_address_street', field_type: 'short_text', label: 'Street address', placeholder: '123 Main St', page_number: 1, section_index: 0, sort_order: 60, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'parent_address_city', field_type: 'short_text', label: 'City', page_number: 1, section_index: 0, sort_order: 61, is_required: true, is_locked: true, is_system_field: true },
    {
      field_key: 'parent_address_state',
      field_type: 'single_select_dropdown',
      label: 'State',
      page_number: 1,
      section_index: 0,
      sort_order: 62,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: { options: US_STATES.map((s) => ({ label: s.label, value: s.value })) },
    },
    { field_key: 'parent_address_zip', field_type: 'short_text', label: 'ZIP code', placeholder: '75114', page_number: 1, section_index: 0, sort_order: 63, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'parent_occupation', field_type: 'short_text', label: 'Your occupation', page_number: 1, section_index: 0, sort_order: 70 },
    { field_key: 'parent_work_phone', field_type: 'phone', label: 'Work phone', page_number: 1, section_index: 0, sort_order: 80 },
    { field_key: 'parent_drivers_license', field_type: 'short_text', label: "Driver's license number", description: 'Used for authorized pickup verification.', page_number: 1, section_index: 0, sort_order: 90 },

    // Step 2: Children repeater
    {
      field_key: 'children',
      field_type: 'repeater_group',
      label: 'Children',
      page_number: 2,
      section_index: 1,
      sort_order: 10,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: {
        min_items: 1,
        max_items: 5,
        item_label: 'Child',
        add_button_label: 'Add another child',
        remove_button_label: 'Remove',
        downstream_per_item: true,
        fields: [
          { field_key: 'first_name', field_type: 'short_text', label: 'First name', is_required: true },
          { field_key: 'last_name', field_type: 'short_text', label: 'Last name', is_required: true },
          { field_key: 'preferred_name', field_type: 'short_text', label: 'Preferred name' },
          { field_key: 'dob', field_type: 'date', label: 'Date of birth', is_required: true },
          {
            field_key: 'gender',
            field_type: 'single_select_radio',
            label: 'Gender',
            is_required: true,
            config: {
              options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Prefer not to say', value: 'prefer_not_to_say' },
              ],
            },
          },
          { field_key: 'photo', field_type: 'image_upload', label: 'Photo (optional)' },
        ],
      },
    },

    // Step 3: Program Selection (iterates per child)
    {
      field_key: 'program_type',
      field_type: 'single_select_dropdown',
      label: 'Program',
      page_number: 3,
      section_index: 2,
      sort_order: 10,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: {
        options: [
          { label: 'Infant (12 weeks – 17 mo)', value: 'infant' },
          { label: 'Toddlers (18 – 23 mo)', value: 'toddler' },
          { label: 'Twos', value: 'twos' },
          { label: 'Threes', value: 'threes' },
          { label: 'Pre-K', value: 'prek' },
          { label: 'Kindergarten', value: 'kindergarten' },
          { label: 'Before & After Care', value: 'before_after' },
          { label: 'Summer Camp', value: 'summer' },
        ],
      },
    },
    {
      field_key: 'schedule_preference',
      field_type: 'button_group',
      label: 'Schedule',
      page_number: 3,
      section_index: 2,
      sort_order: 20,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: {
        options: [
          { label: 'Full Day', value: 'full_day' },
          { label: 'Half Day AM', value: 'half_day_am' },
          { label: 'Half Day PM', value: 'half_day_pm' },
        ],
      },
    },
    {
      field_key: 'desired_start_date',
      field_type: 'date',
      label: 'Desired start date',
      page_number: 3,
      section_index: 2,
      sort_order: 30,
      is_required: true,
      is_locked: true,
      is_system_field: true,
    },

    // Step 4: Medical & Safety (iterates per child)
    {
      field_key: 'has_allergies',
      field_type: 'yes_no',
      label: 'Does your child have any allergies?',
      page_number: 4,
      section_index: 3,
      sort_order: 10,
      is_required: true,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'allergies_detail',
      field_type: 'long_text',
      label: 'Allergy details',
      description: 'List allergens, severity, and any medications (e.g., EpiPen).',
      page_number: 4,
      section_index: 3,
      sort_order: 20,
      is_locked: true,
      is_system_field: true,
      logic_rules: [{ show_if: { field: 'has_allergies', equals: true } }],
    },
    {
      field_key: 'has_medical_conditions',
      field_type: 'yes_no',
      label: 'Any medical conditions?',
      page_number: 4,
      section_index: 3,
      sort_order: 30,
      is_required: true,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'medical_conditions_detail',
      field_type: 'long_text',
      label: 'Medical conditions',
      page_number: 4,
      section_index: 3,
      sort_order: 40,
      is_locked: true,
      is_system_field: true,
      logic_rules: [{ show_if: { field: 'has_medical_conditions', equals: true } }],
    },
    {
      field_key: 'has_dietary_restrictions',
      field_type: 'yes_no',
      label: 'Any dietary restrictions?',
      page_number: 4,
      section_index: 3,
      sort_order: 50,
      is_required: true,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'dietary_restrictions_detail',
      field_type: 'long_text',
      label: 'Dietary restrictions',
      page_number: 4,
      section_index: 3,
      sort_order: 60,
      is_locked: true,
      is_system_field: true,
      logic_rules: [{ show_if: { field: 'has_dietary_restrictions', equals: true } }],
    },
    {
      field_key: 'special_needs_or_accommodations',
      field_type: 'long_text',
      label: 'Special needs or accommodations (optional)',
      page_number: 4,
      section_index: 3,
      sort_order: 70,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'current_medications',
      field_type: 'long_text',
      label: 'Current medications (optional)',
      page_number: 4,
      section_index: 3,
      sort_order: 80,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'pediatrician_name',
      field_type: 'short_text',
      label: 'Pediatrician name',
      page_number: 4,
      section_index: 3,
      sort_order: 90,
      is_locked: true,
      is_system_field: true,
    },
    {
      field_key: 'pediatrician_phone',
      field_type: 'phone',
      label: 'Pediatrician phone',
      page_number: 4,
      section_index: 3,
      sort_order: 100,
      is_locked: true,
      is_system_field: true,
    },

    // Step 5: Family & Background
    { field_key: 'has_other_parent', field_type: 'yes_no', label: 'Is there another parent or guardian?', page_number: 5, section_index: 4, sort_order: 10 },
    { field_key: 'other_parent_name', field_type: 'short_text', label: "Other parent's full name", page_number: 5, section_index: 4, sort_order: 20, logic_rules: [{ show_if: { field: 'has_other_parent', equals: true } }] },
    { field_key: 'other_parent_same_address', field_type: 'yes_no', label: 'Does this parent live at the same address?', page_number: 5, section_index: 4, sort_order: 30, logic_rules: [{ show_if: { field: 'has_other_parent', equals: true } }] },
    { field_key: 'other_parent_address_street', field_type: 'short_text', label: "Other parent's street address", page_number: 5, section_index: 4, sort_order: 40, logic_rules: [{ show_if: { field: 'other_parent_same_address', equals: false } }] },
    { field_key: 'other_parent_address_city', field_type: 'short_text', label: 'City', page_number: 5, section_index: 4, sort_order: 41, logic_rules: [{ show_if: { field: 'other_parent_same_address', equals: false } }] },
    {
      field_key: 'other_parent_address_state',
      field_type: 'single_select_dropdown',
      label: 'State',
      page_number: 5,
      section_index: 4,
      sort_order: 42,
      config: { options: US_STATES.map((s) => ({ label: s.label, value: s.value })) },
      logic_rules: [{ show_if: { field: 'other_parent_same_address', equals: false } }],
    },
    { field_key: 'other_parent_address_zip', field_type: 'short_text', label: 'ZIP code', page_number: 5, section_index: 4, sort_order: 43, logic_rules: [{ show_if: { field: 'other_parent_same_address', equals: false } }] },
    { field_key: 'other_parent_occupation', field_type: 'short_text', label: "Other parent's occupation", page_number: 5, section_index: 4, sort_order: 50, logic_rules: [{ show_if: { field: 'has_other_parent', equals: true } }] },
    { field_key: 'other_parent_work_phone', field_type: 'phone', label: "Other parent's work phone", page_number: 5, section_index: 4, sort_order: 60, logic_rules: [{ show_if: { field: 'has_other_parent', equals: true } }] },
    { field_key: 'other_parent_drivers_license', field_type: 'short_text', label: "Other parent's driver's license", page_number: 5, section_index: 4, sort_order: 70, logic_rules: [{ show_if: { field: 'has_other_parent', equals: true } }] },
    { field_key: 'family_name', field_type: 'short_text', label: 'Family name (e.g., The Smith Family)', page_number: 5, section_index: 4, sort_order: 80, is_required: true, is_locked: true, is_system_field: true },
    {
      field_key: 'how_heard',
      field_type: 'single_select_dropdown',
      label: 'How did you hear about us?',
      page_number: 5,
      section_index: 4,
      sort_order: 90,
      is_required: true,
      is_locked: true,
      is_system_field: true,
      config: {
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Friend/Referral', value: 'referral' },
          { label: 'Church', value: 'church' },
          { label: 'Drive-by', value: 'drive_by' },
          { label: 'Community Event', value: 'event' },
          { label: 'Other', value: 'other' },
        ],
      },
    },
    { field_key: 'how_heard_other', field_type: 'short_text', label: 'Please specify', page_number: 5, section_index: 4, sort_order: 100, logic_rules: [{ show_if: { field: 'how_heard', equals: 'other' } }] },
    { field_key: 'referral_family_name', field_type: 'short_text', label: 'Who referred you?', page_number: 5, section_index: 4, sort_order: 110, logic_rules: [{ show_if: { field: 'how_heard', equals: 'referral' } }] },
    { field_key: 'faith_community', field_type: 'short_text', label: 'Church or faith community', description: 'Optional — we welcome families of all backgrounds.', page_number: 5, section_index: 4, sort_order: 120 },
    { field_key: 'has_sibling_enrolled', field_type: 'yes_no', label: 'Does another child in your family currently attend?', page_number: 5, section_index: 4, sort_order: 130 },
    { field_key: 'sibling_name', field_type: 'short_text', label: 'Sibling name', page_number: 5, section_index: 4, sort_order: 140, logic_rules: [{ show_if: { field: 'has_sibling_enrolled', equals: true } }] },
    { field_key: 'parent_goals', field_type: 'long_text', label: 'What are your goals for your child?', page_number: 5, section_index: 4, sort_order: 150 },
    { field_key: 'anything_else', field_type: 'long_text', label: "Anything else you'd like us to know?", page_number: 5, section_index: 4, sort_order: 160 },

    // Step 6: Signature, Agreement & Payment
    { field_key: 'parent_signature', field_type: 'typed_signature', label: 'Your signature', description: 'Type your full legal name below. This serves as your electronic signature.', page_number: 6, section_index: 5, sort_order: 5, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'agree_to_contact', field_type: 'legal_acceptance', label: 'I agree to be contacted regarding this application.', page_number: 6, section_index: 5, sort_order: 10, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'agree_to_policies', field_type: 'legal_acceptance', label: 'I have read and agree to the school policies and handbook.', page_number: 6, section_index: 5, sort_order: 20, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'acknowledge_accuracy', field_type: 'legal_acceptance', label: 'I certify that the information provided is accurate and complete.', page_number: 6, section_index: 5, sort_order: 30, is_required: true, is_locked: true, is_system_field: true },
    { field_key: 'payment', field_type: 'payment_stripe', label: 'Application Fee', page_number: 6, section_index: 5, sort_order: 40, is_locked: true, is_system_field: true, config: { mode: 'one_time', amount_source: 'form.fee_amount_cents' } },
  ],
  actions: [
    { action_type: 'store', config: {}, sort_order: 10 },
    { action_type: 'create_entity', config: { entity_type: 'enrollment_application', per_child: true }, sort_order: 20 },
    { action_type: 'create_entity', config: { entity_type: 'enrollment_lead', source: 'website', source_detail: 'enrollment_form' }, sort_order: 30 },
    { action_type: 'stripe_charge', config: { when: 'fee_enabled' }, sort_order: 40 },
    { action_type: 'notify', config: { recipient: 'director', template: 'new_enrollment' }, sort_order: 50 },
    { action_type: 'notify', config: { recipient: 'parent', template: 'enrollment_received' }, sort_order: 60 },
    { action_type: 'generate_pdf', config: { template: 'enrollment_application' }, sort_order: 70 },
  ],
}

export const SYSTEM_FORM_TEMPLATES: SystemFormTemplate[] = [ENROLLMENT_APPLICATION]

export function getSystemFormTemplate(key: SystemFormKey): SystemFormTemplate | undefined {
  return SYSTEM_FORM_TEMPLATES.find((t) => t.key === key)
}
