// @anchor: cca.crm.events
// Append-only event log + emit() helper. Every business action that
// matters for automations writes an event row through here. The
// processor (see automations.ts) reads unprocessed events, matches
// them against enabled automations, and runs the action steps.

import { createAdminClient } from '@/lib/supabase/admin'

export type CrmEventKind =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.lifecycle_changed'
  | 'contact.tag_added'
  | 'contact.tag_removed'
  | 'contact.added_to_audience'
  | 'lead.created'
  | 'tour.booked'
  | 'tour.completed'
  | 'tour.no_show'
  | 'appointment.booked'
  | 'appointment.completed'
  | 'application.started'
  | 'application.abandoned'
  | 'application.submitted'
  | 'application.approved'
  | 'application.declined'
  | 'enrollment.completed'
  | 'classroom.assigned'
  | 'family.welcomed'
  | 'birthday.upcoming'
  | 'birthday.today'
  | 'transition.upcoming'
  | 'waitlist.added'
  | 'waitlist.spot_open'
  | 'reenrollment.window_open'
  | 'email.sent'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.unsubscribed'
  | 'form.submitted'
  | 'note.added'
  | 'engagement.dormant'

export const CRM_EVENT_KINDS: { value: CrmEventKind; label: string; group: string }[] = [
  { value: 'contact.created', label: 'Contact created', group: 'Contact' },
  { value: 'contact.updated', label: 'Contact updated', group: 'Contact' },
  { value: 'contact.lifecycle_changed', label: 'Lifecycle stage changed', group: 'Contact' },
  { value: 'contact.tag_added', label: 'Tag added to contact', group: 'Contact' },
  { value: 'contact.tag_removed', label: 'Tag removed from contact', group: 'Contact' },
  { value: 'contact.added_to_audience', label: 'Added to audience', group: 'Contact' },
  { value: 'lead.created', label: 'New lead captured', group: 'Lead' },
  { value: 'tour.booked', label: 'Tour booked', group: 'Tour' },
  { value: 'tour.completed', label: 'Tour completed', group: 'Tour' },
  { value: 'tour.no_show', label: 'Tour no-show', group: 'Tour' },
  { value: 'appointment.booked', label: 'Appointment booked', group: 'Appointments' },
  { value: 'appointment.completed', label: 'Appointment completed', group: 'Appointments' },
  { value: 'application.started', label: 'Application started', group: 'Application' },
  { value: 'application.abandoned', label: 'Application abandoned', group: 'Application' },
  { value: 'application.submitted', label: 'Application submitted', group: 'Application' },
  { value: 'application.approved', label: 'Application approved', group: 'Application' },
  { value: 'application.declined', label: 'Application declined', group: 'Application' },
  { value: 'enrollment.completed', label: 'Enrollment complete', group: 'Enrollment' },
  { value: 'classroom.assigned', label: 'Classroom assigned', group: 'Enrollment' },
  { value: 'family.welcomed', label: 'Family welcomed', group: 'Enrollment' },
  { value: 'birthday.upcoming', label: 'Birthday in 7 days', group: 'Lifecycle' },
  { value: 'birthday.today', label: 'Birthday today', group: 'Lifecycle' },
  { value: 'transition.upcoming', label: 'Classroom transition upcoming', group: 'Lifecycle' },
  { value: 'waitlist.added', label: 'Added to waitlist', group: 'Waitlist' },
  { value: 'waitlist.spot_open', label: 'Waitlist spot opened', group: 'Waitlist' },
  { value: 'reenrollment.window_open', label: 'Re-enrollment window open', group: 'Lifecycle' },
  { value: 'email.sent', label: 'Email sent', group: 'Email' },
  { value: 'email.opened', label: 'Email opened', group: 'Email' },
  { value: 'email.clicked', label: 'Email link clicked', group: 'Email' },
  { value: 'email.bounced', label: 'Email bounced', group: 'Email' },
  { value: 'email.unsubscribed', label: 'Contact unsubscribed', group: 'Email' },
  { value: 'form.submitted', label: 'Form submitted', group: 'Forms' },
  { value: 'note.added', label: 'Note added to contact', group: 'Activity' },
  { value: 'engagement.dormant', label: 'Engagement went dormant (90+ days)', group: 'Activity' },
]

export interface EmitArgs {
  tenantId: string
  kind: CrmEventKind
  contactId?: string | null
  payload?: Record<string, unknown>
  source?: string
  occurredAt?: string
}

/**
 * Best-effort event emitter. Failures are swallowed and logged so that
 * primary business actions never break because of an analytics event.
 * The processor handles automations on its own cadence.
 */
export async function emitEvent(args: EmitArgs): Promise<{ id?: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('crm_events')
      .insert({
        tenant_id: args.tenantId,
        contact_id: args.contactId ?? null,
        kind: args.kind,
        payload: args.payload ?? {},
        source: args.source ?? null,
        occurred_at: args.occurredAt ?? new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error) {
      console.error('[crm.emitEvent]', args.kind, error.message)
      return {}
    }
    return { id: data?.id as string | undefined }
  } catch (e) {
    console.error('[crm.emitEvent] threw', args.kind, e)
    return {}
  }
}
