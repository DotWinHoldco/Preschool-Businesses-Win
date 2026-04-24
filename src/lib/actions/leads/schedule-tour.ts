// @anchor: cca.leads.schedule-tour
'use server'

import {
  ScheduleTourSchema,
  CompleteTourSchema,
  type ScheduleTourInput,
  type CompleteTourInput,
} from '@/lib/schemas/lead'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type ScheduleTourState = {
  ok: boolean
  error?: string
  id?: string
}

export async function scheduleTour(input: ScheduleTourInput): Promise<ScheduleTourState> {
  await assertRole('admin')

  const parsed = ScheduleTourSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Create tour record
  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .insert({
      tenant_id: tenantId,
      lead_id: data.lead_id,
      scheduled_at: data.scheduled_at,
      conducted_by: actorId,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (tourError || !tour) {
    return { ok: false, error: tourError?.message ?? 'Failed to schedule tour' }
  }

  // Update lead status to tour_scheduled
  await supabase
    .from('enrollment_leads')
    .update({ status: 'tour_scheduled', updated_at: new Date().toISOString() })
    .eq('id', data.lead_id)

  // Add activity
  await supabase.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: data.lead_id,
    activity_type: 'tour_scheduled',
    description: `Tour scheduled for ${data.scheduled_at}`,
    performed_by: actorId,
  })

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lead.tour.scheduled',
    entity_type: 'tour',
    entity_id: tour.id,
    after_data: data,
  })

  return { ok: true, id: tour.id }
}

export async function completeTour(input: CompleteTourInput): Promise<ScheduleTourState> {
  await assertRole('admin')

  const parsed = CompleteTourSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Update tour
  const { data: tour, error } = await supabase
    .from('tours')
    .update({
      completed_at: new Date().toISOString(),
      parent_attended: data.parent_attended,
      notes: data.notes ?? null,
    })
    .eq('id', data.tour_id)
    .eq('tenant_id', tenantId)
    .select('lead_id')
    .single()

  if (error || !tour) {
    return { ok: false, error: error?.message ?? 'Tour not found' }
  }

  // Update lead status
  await supabase
    .from('enrollment_leads')
    .update({ status: 'tour_completed', updated_at: new Date().toISOString() })
    .eq('id', tour.lead_id)

  // Add activity
  await supabase.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: tour.lead_id,
    activity_type: 'tour_completed',
    description: data.parent_attended
      ? 'Tour completed. Parent attended.'
      : 'Tour completed. Parent did not attend.',
    performed_by: actorId,
  })

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lead.tour.completed',
    entity_type: 'tour',
    entity_id: data.tour_id,
    after_data: data,
  })

  return { ok: true, id: data.tour_id }
}
