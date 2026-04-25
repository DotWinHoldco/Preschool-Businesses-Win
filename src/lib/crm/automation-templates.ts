// @anchor: cca.crm.automation-templates
// Pre-built automation recipes admins can drop in with one click.
// Each template's send_email_by_key actions resolve at apply-time
// against email_templates.slug for the active tenant.

import type { CrmEventKind } from './events'

export type AutomationTemplateAction =
  | { type: 'send_email_by_key'; template_key: string }
  | { type: 'add_tag'; tag_key: string } // tag_key is a placeholder we don't auto-resolve yet
  | { type: 'set_lifecycle'; stage: string }

export interface AutomationTemplate {
  key: string
  name: string
  description: string
  category: 'enrollment' | 'lifecycle' | 'engagement' | 'reactivation' | 'retention'
  trigger_kind: CrmEventKind
  conditions?: { match: 'all' | 'any'; rules: unknown[] }
  cooldown_minutes?: number
  max_runs_per_contact?: number
  actions: AutomationTemplateAction[]
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: 'welcome_new_lead',
    name: 'Welcome new lead',
    description:
      'When a new lead is captured, send a warm welcome with the school overview and a tour CTA.',
    category: 'enrollment',
    trigger_kind: 'lead.created',
    cooldown_minutes: 60 * 24,
    max_runs_per_contact: 1,
    actions: [{ type: 'send_email_by_key', template_key: 'welcome_lead' }],
  },
  {
    key: 'tour_booked_confirmation',
    name: 'Tour booked confirmation',
    description: 'Send a confirmation email immediately after a tour is booked.',
    category: 'enrollment',
    trigger_kind: 'tour.booked',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'tour_booked' }],
  },
  {
    key: 'application_abandoned_nudge',
    name: 'Nudge abandoned application',
    description:
      'Within an hour of a draft going quiet, send a gentle reminder with a one-click resume link.',
    category: 'engagement',
    trigger_kind: 'application.abandoned',
    cooldown_minutes: 60 * 24,
    max_runs_per_contact: 2,
    actions: [{ type: 'send_email_by_key', template_key: 'app_abandoned' }],
  },
  {
    key: 'application_submitted_thanks',
    name: 'Thanks for applying',
    description: "Confirm receipt of a submitted application and tell families what's next.",
    category: 'enrollment',
    trigger_kind: 'application.submitted',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'app_submitted' }],
  },
  {
    key: 'acceptance_offer',
    name: 'Acceptance offer',
    description: 'When an application is approved, send a celebratory acceptance with next steps.',
    category: 'enrollment',
    trigger_kind: 'application.approved',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'app_approved' }],
  },
  {
    key: 'enrollment_complete_welcome',
    name: 'Welcome to the family',
    description:
      'After enrollment is complete, welcome the family with first-day prep, packing list, drop-off info.',
    category: 'enrollment',
    trigger_kind: 'enrollment.completed',
    cooldown_minutes: 0,
    max_runs_per_contact: 1,
    actions: [
      { type: 'send_email_by_key', template_key: 'enrollment_welcome' },
      { type: 'set_lifecycle', stage: 'enrolled_parent' },
    ],
  },
  {
    key: 'classroom_assigned_intro',
    name: 'Classroom assignment intro',
    description: "Introduce the family to their child's teacher and classroom on assignment.",
    category: 'enrollment',
    trigger_kind: 'classroom.assigned',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'classroom_intro' }],
  },
  {
    key: 'birthday_today',
    name: 'Birthday wishes',
    description: 'Wish the child a happy birthday on the morning of their birthday.',
    category: 'lifecycle',
    trigger_kind: 'birthday.today',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'birthday_today' }],
  },
  {
    key: 'transition_upcoming',
    name: 'Classroom transition heads-up',
    description: 'Give parents a 30-day heads-up before their child transitions to the next room.',
    category: 'lifecycle',
    trigger_kind: 'transition.upcoming',
    cooldown_minutes: 60 * 24 * 14,
    actions: [{ type: 'send_email_by_key', template_key: 'transition_upcoming' }],
  },
  {
    key: 'waitlist_added_ack',
    name: 'Waitlist confirmation',
    description: 'Confirm waitlist placement and explain how the queue moves.',
    category: 'enrollment',
    trigger_kind: 'waitlist.added',
    cooldown_minutes: 0,
    actions: [{ type: 'send_email_by_key', template_key: 'waitlist_added' }],
  },
  {
    key: 'reenrollment_window_open',
    name: 'Re-enrollment window open',
    description: 'Tell current families the re-enrollment window is open and link to the form.',
    category: 'retention',
    trigger_kind: 'reenrollment.window_open',
    cooldown_minutes: 60 * 24 * 30,
    actions: [{ type: 'send_email_by_key', template_key: 'reenrollment_open' }],
  },
  {
    key: 'reengage_dormant',
    name: 'Re-engage dormant lead',
    description:
      "Reach back out to leads who haven't engaged in 90 days with a fresh value-led email.",
    category: 'reactivation',
    trigger_kind: 'engagement.dormant',
    cooldown_minutes: 60 * 24 * 60,
    max_runs_per_contact: 2,
    actions: [{ type: 'send_email_by_key', template_key: 'reengage_dormant' }],
  },
]
