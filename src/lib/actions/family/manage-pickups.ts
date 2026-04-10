'use server'

// @anchor: cca.family.pickup-actions
// Server actions: manage authorized pickup list.
// Child safety critical — every change is audited.

import {
  CreateAuthorizedPickupSchema,
  UpdateAuthorizedPickupSchema,
  RemoveAuthorizedPickupSchema,
  type CreateAuthorizedPickupInput,
} from '@/lib/schemas/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type PickupResult = {
  ok: boolean
  pickupId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Add authorized pickup
// ---------------------------------------------------------------------------

export async function addAuthorizedPickup(
  input: CreateAuthorizedPickupInput,
): Promise<PickupResult> {
  await assertRole('admin')

  const parsed = CreateAuthorizedPickupSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: pickup, error } = await supabase
    .from('authorized_pickups')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      family_id: data.family_id,
      person_name: data.person_name,
      relationship: data.relationship,
      phone: data.phone || null,
      photo_path: data.photo_path || null,
      government_id_type: data.government_id_type || null,
      valid_from: data.valid_from || null,
      valid_to: data.valid_to || null,
      notes: data.notes || null,
      added_by: actorId,
    })
    .select('id')
    .single()

  if (error || !pickup) {
    return { ok: false, error: error?.message || 'Failed to add authorized pickup' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'authorized_pickup',
    entity_id: pickup.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, pickupId: pickup.id }
}

// ---------------------------------------------------------------------------
// Update authorized pickup
// ---------------------------------------------------------------------------

export async function updateAuthorizedPickup(
  input: { id: string } & Partial<CreateAuthorizedPickupInput>,
): Promise<PickupResult> {
  await assertRole('admin')

  const parsed = UpdateAuthorizedPickupSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('authorized_pickups')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Authorized pickup not found' }
  }

  const { id: _id, ...updateData } = data
  const { error } = await supabase
    .from('authorized_pickups')
    .update(updateData)
    .eq('id', data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'authorized_pickup',
    entity_id: data.id,
    before: before as unknown as Record<string, unknown>,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, pickupId: data.id }
}

// ---------------------------------------------------------------------------
// Remove authorized pickup
// ---------------------------------------------------------------------------

export async function removeAuthorizedPickup(
  input: { id: string; student_id: string },
): Promise<PickupResult> {
  await assertRole('admin')

  const parsed = RemoveAuthorizedPickupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('authorized_pickups')
    .select('*')
    .eq('id', input.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Authorized pickup not found' }
  }

  const { error } = await supabase
    .from('authorized_pickups')
    .delete()
    .eq('id', input.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'delete',
    entity_type: 'authorized_pickup',
    entity_id: input.id,
    before: before as unknown as Record<string, unknown>,
  })

  return { ok: true }
}
