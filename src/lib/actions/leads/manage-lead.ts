// @anchor: cca.leads.manage
'use server'

import {
  UpdateLeadSchema,
  AddLeadActivitySchema,
  type UpdateLeadInput,
  type AddLeadActivityInput,
} from '@/lib/schemas/lead'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type ManageLeadState = {
  ok: boolean
  error?: string
}

export async function updateLead(input: UpdateLeadInput): Promise<ManageLeadState> {
  await assertRole('admin')

  const parsed = UpdateLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch before state for audit
  const { data: before } = await supabase
    .from('enrollment_leads')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  const { id, ...updateFields } = data

  const { error } = await supabase
    .from('enrollment_leads')
    .update({ ...updateFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  // If status changed, add an activity
  if (data.status && before && data.status !== before.status) {
    await supabase.from('lead_activities').insert({
      tenant_id: tenantId,
      lead_id: id,
      activity_type: 'status_changed',
      description: `Status changed from ${before.status} to ${data.status}`,
      performed_by: actorId,
    })
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lead.updated',
    entity_type: 'enrollment_lead',
    entity_id: id,
    before_data: before,
    after_data: data,
  })

  return { ok: true }
}

export async function addLeadActivity(input: AddLeadActivityInput): Promise<ManageLeadState> {
  await assertRole('admin')

  const parsed = AddLeadActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { error } = await supabase.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: data.lead_id,
    activity_type: data.activity_type,
    description: data.description,
    performed_by: actorId,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
