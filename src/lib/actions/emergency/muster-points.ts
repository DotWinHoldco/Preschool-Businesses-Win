// @anchor: cca.emergency.muster-points.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  MusterPointSchema,
  UpdateMusterPointSchema,
  type MusterPointInput,
  type UpdateMusterPointInput,
} from '@/lib/schemas/emergency'
import { z } from 'zod'

export type ActionResult = { ok: boolean; error?: string; id?: string }

function normalize(data: Partial<MusterPointInput>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  if ((data.floorplan_url ?? '') === '') out.floorplan_url = null
  return out
}

export async function createMusterPoint(input: MusterPointInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = MusterPointSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const payload = { tenant_id: tenantId, ...normalize(parsed.data) }
  const { data: row, error } = await supabase
    .from('emergency_muster_points')
    .insert(payload)
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create muster point' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.muster_point_created',
    entityType: 'emergency_muster_point',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: row.id }
}

export async function updateMusterPoint(input: UpdateMusterPointInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateMusterPointSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('emergency_muster_points')
    .update(normalize(rest))
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.muster_point_updated',
    entityType: 'emergency_muster_point',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id }
}

const DeleteSchema = z.object({ id: z.string().uuid() })

export async function deleteMusterPoint(input: { id: string }): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = DeleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('emergency_muster_points')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.muster_point_deleted',
    entityType: 'emergency_muster_point',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: parsed.data.id }
}
