'use server'

// @anchor: cca.calendar.rsvp
// Process RSVP response for a calendar event
// See CCA_BUILD_BRIEF.md §36

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import {
  ProcessRSVPSchema,
  JoinEventSignUpSchema,
  type ProcessRSVPInput,
  type JoinEventSignUpInput,
} from '@/lib/schemas/calendar-event'

export async function processRSVP(input: ProcessRSVPInput) {
  await assertRole('parent')
  const parsed = ProcessRSVPSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Check if event exists and accepts RSVPs
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('id, requires_rsvp, max_participants')
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)
    .single()

  if (eventError || !event) {
    return { ok: false as const, error: { _form: ['Event not found'] } }
  }

  // If max_participants is set and response is 'yes', check capacity
  if (parsed.data.response === 'yes' && event.max_participants) {
    const { count } = await supabase
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', parsed.data.event_id)
      .eq('response', 'yes')
      .eq('tenant_id', tenantId)

    if (count !== null && count >= (event.max_participants as number)) {
      return { ok: false as const, error: { _form: ['Event is at full capacity'] } }
    }
  }

  // Upsert RSVP (one per family per event)
  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      {
        tenant_id: tenantId,
        event_id: parsed.data.event_id,
        family_id: parsed.data.family_id,
        student_id: parsed.data.student_id ?? null,
        response: parsed.data.response,
        responded_by: actorId,
        responded_at: new Date().toISOString(),
        notes: parsed.data.notes ?? null,
      },
      { onConflict: 'event_id,family_id' },
    )

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'calendar.rsvp',
    entityType: 'event_rsvp',
    entityId: parsed.data.event_id,
    after: { response: parsed.data.response, family_id: parsed.data.family_id },
  })

  return { ok: true as const }
}

export async function joinEventSignUp(input: JoinEventSignUpInput) {
  await assertRole('parent')
  const parsed = JoinEventSignUpSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Check capacity
  const { data: signUp, error: signUpError } = await supabase
    .from('event_sign_ups')
    .select('id, slots_total')
    .eq('id', parsed.data.sign_up_id)
    .eq('tenant_id', tenantId)
    .single()

  if (signUpError || !signUp) {
    return { ok: false as const, error: { _form: ['Sign-up slot not found'] } }
  }

  const { count } = await supabase
    .from('event_sign_up_entries')
    .select('id', { count: 'exact', head: true })
    .eq('sign_up_id', parsed.data.sign_up_id)
    .eq('tenant_id', tenantId)

  if (count !== null && count >= (signUp.slots_total as number)) {
    return { ok: false as const, error: { _form: ['No slots remaining'] } }
  }

  const { error } = await supabase.from('event_sign_up_entries').insert({
    tenant_id: tenantId,
    sign_up_id: parsed.data.sign_up_id,
    family_id: parsed.data.family_id,
    user_id: actorId,
    signed_up_at: new Date().toISOString(),
    notes: parsed.data.notes ?? null,
  })

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'calendar.rsvp',
    entityType: 'event_rsvp',
    entityId: parsed.data.sign_up_id,
    after: { family_id: parsed.data.family_id },
  })

  return { ok: true as const }
}
