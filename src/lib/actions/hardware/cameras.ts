// @anchor: cca.hardware.cameras.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  CreateCameraSchema,
  UpdateCameraSchema,
  DeleteCameraSchema,
  type CreateCameraInput,
  type UpdateCameraInput,
  type DeleteCameraInput,
} from '@/lib/schemas/compliance'

export type ActionResult = { ok: boolean; error?: string; id?: string }

export async function createCamera(input: CreateCameraInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateCameraSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('cameras')
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      location: parsed.data.location ?? null,
      hardware_type: parsed.data.hardware_type ?? null,
      stream_url: parsed.data.stream_url ?? null,
      recording_enabled: parsed.data.recording_enabled,
      thumbnail_url: parsed.data.thumbnail_url ?? null,
      status: 'unknown',
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add camera' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'camera.created',
    entityType: 'camera',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/cameras')
  return { ok: true, id: row.id }
}

export async function updateCamera(input: UpdateCameraInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateCameraSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('cameras')
    .update(rest)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'camera.updated',
    entityType: 'camera',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/cameras')
  return { ok: true, id }
}

export async function deleteCamera(input: DeleteCameraInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = DeleteCameraSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('cameras')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'camera.deleted',
    entityType: 'camera',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/cameras')
  return { ok: true, id: parsed.data.id }
}
