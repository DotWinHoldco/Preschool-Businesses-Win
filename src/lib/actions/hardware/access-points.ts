// @anchor: cca.hardware.access-points.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  CreateAccessPointSchema,
  UpdateAccessPointSchema,
  DeleteAccessPointSchema,
  LogAccessEventSchema,
  type CreateAccessPointInput,
  type UpdateAccessPointInput,
  type DeleteAccessPointInput,
  type LogAccessEventInput,
} from '@/lib/schemas/compliance'

export type ActionResult = { ok: boolean; error?: string; id?: string }

export async function createAccessPoint(input: CreateAccessPointInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateAccessPointSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('access_points')
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      location: parsed.data.location ?? null,
      door_type: parsed.data.door_type ?? null,
      lock_type: parsed.data.lock_type ?? null,
      hardware_id: parsed.data.hardware_id ?? null,
      is_active: parsed.data.is_active,
      current_status: 'unknown',
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add access point' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'access_point.created',
    entityType: 'access_point',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/doors')
  return { ok: true, id: row.id }
}

export async function updateAccessPoint(input: UpdateAccessPointInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateAccessPointSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('access_points')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'access_point.updated',
    entityType: 'access_point',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/doors')
  return { ok: true, id }
}

export async function deleteAccessPoint(input: DeleteAccessPointInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = DeleteAccessPointSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('access_points')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'access_point.deleted',
    entityType: 'access_point',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/doors')
  return { ok: true, id: parsed.data.id }
}

export async function logAccessEvent(input: LogAccessEventInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = LogAccessEventSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const { data: row, error } = await supabase
    .from('access_point_events')
    .insert({
      tenant_id: tenantId,
      access_point_id: parsed.data.access_point_id,
      event_type: parsed.data.event_type,
      actor_user_id: actorId,
      actor_label: parsed.data.actor_label ?? null,
      success: parsed.data.success,
      denied_reason: parsed.data.denied_reason ?? null,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to log event' }

  // Also update parent current_status when a lock/unlock succeeds
  if (parsed.data.success) {
    const nextStatus =
      parsed.data.event_type === 'lock'
        ? 'locked'
        : parsed.data.event_type === 'unlock' || parsed.data.event_type === 'manual_override'
          ? 'unlocked'
          : null
    if (nextStatus) {
      await supabase
        .from('access_points')
        .update({ current_status: nextStatus, last_event_at: now, updated_at: now })
        .eq('id', parsed.data.access_point_id)
        .eq('tenant_id', tenantId)
    }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: `access_point.${parsed.data.event_type}`,
    entityType: 'access_point',
    entityId: parsed.data.access_point_id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/doors')
  return { ok: true, id: row.id }
}
