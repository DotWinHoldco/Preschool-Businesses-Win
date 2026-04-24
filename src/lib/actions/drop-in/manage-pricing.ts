// @anchor: cca.dropin.admin.manage-pricing
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  CreateDropInPricingSchema,
  UpdateDropInPricingSchema,
  DeleteDropInPricingSchema,
  type CreateDropInPricingInput,
  type UpdateDropInPricingInput,
  type DeleteDropInPricingInput,
} from '@/lib/schemas/drop-in'

export type DropInPricingState = {
  ok: boolean
  error?: string
  id?: string
}

const PATH = '/portal/admin/drop-in'

export async function createDropInPricing(
  input: CreateDropInPricingInput,
): Promise<DropInPricingState> {
  await assertRole('admin')

  const parsed = CreateDropInPricingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('drop_in_pricing')
    .insert({
      tenant_id: tenantId,
      classroom_id: data.classroom_id ?? null,
      age_range_label: data.age_range_label,
      age_range_min_months: data.age_range_min_months,
      age_range_max_months: data.age_range_max_months,
      full_day_cents: data.full_day_cents,
      half_day_cents: data.half_day_cents,
      hourly_cents: data.hourly_cents,
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to create drop-in pricing' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.pricing.created',
    entity_type: 'drop_in_pricing',
    entity_id: row.id,
    after_data: data,
  })

  revalidatePath(PATH)
  return { ok: true, id: row.id }
}

export async function updateDropInPricing(
  input: UpdateDropInPricingInput,
): Promise<DropInPricingState> {
  await assertRole('admin')

  const parsed = UpdateDropInPricingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('drop_in_pricing')
    .update({
      classroom_id: data.classroom_id ?? null,
      age_range_label: data.age_range_label,
      age_range_min_months: data.age_range_min_months,
      age_range_max_months: data.age_range_max_months,
      full_day_cents: data.full_day_cents,
      half_day_cents: data.half_day_cents,
      hourly_cents: data.hourly_cents,
      is_active: data.is_active,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.pricing.updated',
    entity_type: 'drop_in_pricing',
    entity_id: data.id,
    after_data: data,
  })

  revalidatePath(PATH)
  return { ok: true, id: data.id }
}

export async function deleteDropInPricing(
  input: DeleteDropInPricingInput,
): Promise<DropInPricingState> {
  await assertRole('admin')

  const parsed = DeleteDropInPricingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { id } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('drop_in_pricing')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.pricing.deleted',
    entity_type: 'drop_in_pricing',
    entity_id: id,
  })

  revalidatePath(PATH)
  return { ok: true, id }
}
