'use server'

// @anchor: cca.calendar.manage-events
// Create/update/delete calendar events
// See CCA_BUILD_BRIEF.md §36

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import {
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  CreateEventSignUpSchema,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
  type CreateEventSignUpInput,
} from '@/lib/schemas/calendar-event'
import { z } from 'zod'

export async function createCalendarEvent(input: CreateCalendarEventInput) {
  await assertRole('admin')

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

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'calendar.event.created',
    entityType: 'calendar_event',
    entityId: data.id as string,
    after: { title: parsed.data.title, event_type: parsed.data.event_type },
  })

  revalidatePath('/portal/admin/calendar')

  return { ok: true as const, id: data.id as string, eventId: data.id as string }
}

export async function updateCalendarEvent(input: UpdateCalendarEventInput) {
  await assertRole('admin')

  const parsed = UpdateCalendarEventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
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

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'calendar.event.updated',
    entityType: 'calendar_event',
    entityId: d.event_id,
    after: updateData,
  })

  revalidatePath('/portal/admin/calendar')

  return { ok: true as const, id: d.event_id }
}

// ---------------------------------------------------------------------------
// Delete calendar event
// ---------------------------------------------------------------------------

const DeleteCalendarEventSchema = z.object({
  event_id: z.string().uuid(),
})

export async function deleteCalendarEvent(eventId: string) {
  await assertRole('admin')

  const parsed = DeleteCalendarEventSchema.safeParse({ event_id: eventId })
  if (!parsed.success) {
    return { ok: false as const, error: 'Invalid event id' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Fetch before snapshot for audit
  const { data: before } = await supabase
    .from('calendar_events')
    .select('id, title, event_type, start_at')
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false as const, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'calendar.event.deleted',
    entityType: 'calendar_event',
    entityId: parsed.data.event_id,
    before: before ?? undefined,
  })

  revalidatePath('/portal/admin/calendar')

  return { ok: true as const, id: parsed.data.event_id }
}

export async function createEventSignUp(input: CreateEventSignUpInput) {
  await assertRole('admin')

  const parsed = CreateEventSignUpSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
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

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'calendar.create_event',
    entityType: 'calendar_event',
    entityId: data.id as string,
    after: { title: parsed.data.title, event_id: parsed.data.event_id },
  })

  return { ok: true as const, signUpId: data.id as string }
}
