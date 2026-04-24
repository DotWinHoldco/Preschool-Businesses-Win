// @anchor: cca.expenses.manage-vendors
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  DeleteVendorSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type DeleteVendorInput,
} from '@/lib/schemas/expense'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createVendor(input: CreateVendorInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateVendorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      tenant_id: tenantId,
      name: d.name,
      contact_name: d.contact_name ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      address: d.address ?? null,
      tax_id: d.tax_id ?? null,
      default_category_id: d.default_category_id ?? null,
      payment_terms_days: d.payment_terms_days ?? null,
      notes: d.notes ?? null,
      is_active: true,
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Create failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'vendor.created',
    entityType: 'vendor',
    entityId: data.id,
    after: { name: d.name },
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: data.id }
}

export async function updateVendor(input: UpdateVendorInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateVendorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data
  const update: Record<string, unknown> = {}
  if (d.name !== undefined) update.name = d.name
  if (d.contact_name !== undefined) update.contact_name = d.contact_name
  if (d.email !== undefined) update.email = d.email
  if (d.phone !== undefined) update.phone = d.phone
  if (d.address !== undefined) update.address = d.address
  if (d.tax_id !== undefined) update.tax_id = d.tax_id
  if (d.default_category_id !== undefined) update.default_category_id = d.default_category_id
  if (d.payment_terms_days !== undefined) update.payment_terms_days = d.payment_terms_days
  if (d.is_active !== undefined) update.is_active = d.is_active
  if (d.notes !== undefined) update.notes = d.notes
  update.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('vendors')
    .update(update)
    .eq('id', d.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'vendor.updated',
    entityType: 'vendor',
    entityId: d.id,
    after: update,
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: d.id }
}

export async function deleteVendor(input: DeleteVendorInput): Promise<ActionState> {
  // Archive via is_active=false
  await assertRole('admin')
  const parsed = DeleteVendorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('vendors')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'vendor.archived',
    entityType: 'vendor',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: parsed.data.id }
}
