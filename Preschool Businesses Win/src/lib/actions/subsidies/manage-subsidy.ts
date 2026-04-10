// @anchor: cca.subsidy.manage
'use server'

import {
  CreateFamilySubsidySchema,
  UpdateFamilySubsidySchema,
  type CreateFamilySubsidyInput,
  type UpdateFamilySubsidyInput,
} from '@/lib/schemas/subsidy'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type ManageSubsidyState = {
  ok: boolean
  error?: string
  id?: string
}

export async function createFamilySubsidy(input: CreateFamilySubsidyInput): Promise<ManageSubsidyState> {
  const parsed = CreateFamilySubsidySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { data: subsidy, error } = await supabase
    .from('family_subsidies')
    .insert({
      tenant_id: tenantId,
      family_id: data.family_id,
      student_id: data.student_id,
      agency_id: data.agency_id,
      case_number: data.case_number,
      authorization_start: data.authorization_start,
      authorization_end: data.authorization_end,
      authorized_days_per_week: data.authorized_days_per_week,
      authorized_hours_per_day: data.authorized_hours_per_day,
      subsidy_rate_cents_per_day: data.subsidy_rate_cents_per_day,
      family_copay_cents_per_week: data.family_copay_cents_per_week,
      status: data.status,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !subsidy) {
    return { ok: false, error: error?.message ?? 'Failed to create subsidy enrollment' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.family.created',
    entity_type: 'family_subsidy',
    entity_id: subsidy.id,
    after: data,
  })

  return { ok: true, id: subsidy.id }
}

export async function updateFamilySubsidy(input: UpdateFamilySubsidyInput): Promise<ManageSubsidyState> {
  const parsed = UpdateFamilySubsidySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { data: before } = await supabase
    .from('family_subsidies')
    .select('*')
    .eq('id', data.id)
    .single()

  const { id, ...updateFields } = data

  const { error } = await supabase
    .from('family_subsidies')
    .update(updateFields)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.family.updated',
    entity_type: 'family_subsidy',
    entity_id: id,
    before,
    after: data,
  })

  return { ok: true, id }
}
