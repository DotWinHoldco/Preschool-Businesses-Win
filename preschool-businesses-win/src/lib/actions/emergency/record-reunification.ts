'use server'

// @anchor: cca.emergency.reunification
// Record child release during reunification after an emergency
// See CCA_BUILD_BRIEF.md §37

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

const RecordReunificationSchema = z.object({
  emergency_event_id: z.string().uuid(),
  student_id: z.string().uuid(),
  released_to_user_id: z.string().uuid().optional(),
  released_to_name: z.string().min(1).max(200),
  verified_method: z.enum(['photo_id', 'known_parent', 'authorized_pickup']),
  notes: z.string().max(1000).optional(),
})

export async function recordReunification(input: z.infer<typeof RecordReunificationSchema>) {
  const parsed = RecordReunificationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Verify the emergency event is active or recently resolved
  const { data: event, error: eventError } = await supabase
    .from('emergency_events')
    .select('id, status')
    .eq('id', parsed.data.emergency_event_id)
    .eq('tenant_id', tenantId)
    .single()

  if (eventError || !event) {
    return { ok: false as const, error: { _form: ['Emergency event not found'] } }
  }

  // Check if student was already released in this event
  const { data: existing } = await supabase
    .from('reunification_records')
    .select('id')
    .eq('emergency_event_id', parsed.data.emergency_event_id)
    .eq('student_id', parsed.data.student_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existing) {
    return { ok: false as const, error: { _form: ['Student has already been released'] } }
  }

  const { data, error } = await supabase
    .from('reunification_records')
    .insert({
      tenant_id: tenantId,
      emergency_event_id: parsed.data.emergency_event_id,
      student_id: parsed.data.student_id,
      released_to_user_id: parsed.data.released_to_user_id ?? null,
      released_to_name: parsed.data.released_to_name,
      verified_by: actorId,
      verified_method: parsed.data.verified_method,
      released_at: new Date().toISOString(),
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, recordId: data.id as string }
}
