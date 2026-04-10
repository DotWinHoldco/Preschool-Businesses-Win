'use server'

// @anchor: cca.calendar.manage-events
// Create/update calendar events
// See CCA_BUILD_BRIEF.md §36

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  CreateEventSignUpSchema,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
  type CreateEventSignUpInput,
} from '@/lib/schemas/calendar-event'

export async function createCalendarEvent(input: CreateCalendarEventInput) {
  const parsed = CreateCalendarEventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      tenant_id: tenantId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_type: parsed.data.event_type,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      all_day: parsed.data.all_day,
      recurrence_rule: parsed.data.recurrence_rule ?? null,
      location: parsed.data.location ?? null,
      scope: parsed.data.scope,
      classroom_id: parsed.data.classroom_id ?? null,
      created_by: actorId,
      requires_rsvp: parsed.data.requires_rsvp,
      requires_permission_slip: parsed.data.requires_permission_slip,
      max_participants: parsed.data.max_participants ?? null,
      cost_per_child_cents: parsed.data.cost_per_child_cents ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, eventId: data.id as string }
}

export async function updateCalendarEvent(input: UpdateCalendarEventInput) {
  const parsed = UpdateCalendarEventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const d = parsed.data
  if (d.title !== undefined) updateData.title = d.title
  if (d.description !== undefined) updateData.description = d.description
  if (d.event_type !== undefined) updateData.event_type = d.event_type
  if (d.start_at !== undefined) updateData.start_at = d.start_at
  if (d.end_at !== undefined) updateData.end_at = d.end_at
  if (d.all_day !== undefined) updateData.all_day = d.all_day
  if (d.location !== undefined) updateData.location = d.location
  if (d.scope !== undefined) updateData.scope = d.scope
  if (d.classroom_id !== undefined) updateData.classroom_id = d.classroom_id
  if (d.requires_rsvp !== undefined) updateData.requires_rsvp = d.requires_rsvp
  if (d.max_participants !== undefined) updateData.max_participants = d.max_participants
  if (d.cost_per_child_cents !== undefined) updateData.cost_per_child_cents = d.cost_per_child_cents
  if (d.notes !== undefined) updateData.notes = d.notes

  const { error } = await supabase
    .from('calendar_events')
    .update(updateData)
    .eq('id', d.event_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const }
}

export async function createEventSignUp(input: CreateEventSignUpInput) {
  const parsed = CreateEventSignUpSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('event_sign_ups')
    .insert({
      tenant_id: tenantId,
      event_id: parsed.data.event_id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      slots_total: parsed.data.slots_total,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, signUpId: data.id as string }
}
