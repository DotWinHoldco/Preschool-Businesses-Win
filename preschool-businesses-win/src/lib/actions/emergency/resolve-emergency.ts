'use server'

// @anchor: cca.emergency.resolve
// Resolve an active emergency event and send all-clear
// See CCA_BUILD_BRIEF.md §37

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { sendNotification } from '@/lib/notifications/send'

const ResolveEmergencySchema = z.object({
  event_id: z.string().uuid(),
  all_clear_message: z.string().min(1).max(2000),
  notes: z.string().max(2000).optional(),
})

export async function resolveEmergency(input: z.infer<typeof ResolveEmergencySchema>) {
  const parsed = ResolveEmergencySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Verify the event exists and is active
  const { data: event, error: eventError } = await supabase
    .from('emergency_events')
    .select('id, status, event_type, severity')
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)
    .single()

  if (eventError || !event) {
    return { ok: false as const, error: { _form: ['Emergency event not found'] } }
  }

  if (event.status !== 'active') {
    return { ok: false as const, error: { _form: ['Emergency event is not active'] } }
  }

  // Resolve the event
  const { error: updateError } = await supabase
    .from('emergency_events')
    .update({
      status: 'resolved',
      resolved_by: actorId,
      resolved_at: now,
      all_clear_message: parsed.data.all_clear_message,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { ok: false as const, error: { _form: [updateError.message] } }
  }

  // Send all-clear notification
  await sendNotification({
    to: actorId, // Placeholder — would be all users in tenant
    template: 'emergency_all_clear',
    payload: {
      event_id: parsed.data.event_id,
      event_type: event.event_type,
      all_clear_message: parsed.data.all_clear_message,
    },
    channels: ['push', 'sms', 'in_app'],
    urgency: 'critical',
  })

  return { ok: true as const }
}
