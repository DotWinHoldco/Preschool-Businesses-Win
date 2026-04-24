// @anchor: cca.subsidy.manage-agency
'use server'

import { revalidatePath } from 'next/cache'
import {
  CreateSubsidyAgencySchema,
  UpdateSubsidyAgencySchema,
  DeleteSubsidyAgencySchema,
  type CreateSubsidyAgencyInput,
  type UpdateSubsidyAgencyInput,
  type DeleteSubsidyAgencyInput,
} from '@/lib/schemas/subsidy'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type ManageAgencyState = {
  ok: boolean
  error?: string
  id?: string
}

function nullify(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export async function createSubsidyAgency(
  input: CreateSubsidyAgencyInput,
): Promise<ManageAgencyState> {
  await assertRole('admin')

  const parsed = CreateSubsidyAgencySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: agency, error } = await supabase
    .from('subsidy_agencies')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      agency_type: data.agency_type,
      state: data.state,
      county: nullify(data.county),
      contact_email: nullify(data.contact_email),
      contact_phone: nullify(data.contact_phone),
      billing_format: data.billing_format,
      payment_terms_days: data.payment_terms_days,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !agency) {
    return { ok: false, error: error?.message ?? 'Failed to create agency' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.agency.created',
    entity_type: 'subsidy_agency',
    entity_id: agency.id,
    after_data: data,
  })

  revalidatePath('/portal/admin/subsidies/agencies')

  return { ok: true, id: agency.id }
}

export async function updateSubsidyAgency(
  input: UpdateSubsidyAgencyInput,
): Promise<ManageAgencyState> {
  await assertRole('admin')

  const parsed = UpdateSubsidyAgencySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('subsidy_agencies')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  const { id, ...updateFields } = data

  // Normalize empty strings to null
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updateFields)) {
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') {
      payload[key] = null
    } else {
      payload[key] = value
    }
  }

  const { error } = await supabase
    .from('subsidy_agencies')
    .update(payload)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.agency.updated',
    entity_type: 'subsidy_agency',
    entity_id: id,
    before_data: before,
    after_data: data,
  })

  revalidatePath('/portal/admin/subsidies/agencies')

  return { ok: true, id }
}

export async function deleteSubsidyAgency(
  input: DeleteSubsidyAgencyInput,
): Promise<ManageAgencyState> {
  await assertRole('admin')

  const parsed = DeleteSubsidyAgencySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('subsidy_agencies')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await supabase
    .from('subsidy_agencies')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.agency.deleted',
    entity_type: 'subsidy_agency',
    entity_id: parsed.data.id,
    before_data: before,
  })

  revalidatePath('/portal/admin/subsidies/agencies')

  return { ok: true, id: parsed.data.id }
}
