// @anchor: cca.dropin.admin.manage-sessions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  CreateDropInSessionSchema,
  UpdateDropInSessionSchema,
  DeleteDropInSessionSchema,
  type CreateDropInSessionInput,
  type UpdateDropInSessionInput,
  type DeleteDropInSessionInput,
} from '@/lib/schemas/drop-in'

export type DropInSessionState = {
  ok: boolean
  error?: string
  id?: string
}

const PATH = '/portal/admin/drop-in'

export async function createDropInSession(
  input: CreateDropInSessionInput,
): Promise<DropInSessionState> {
  await assertRole('admin')

  const parsed = CreateDropInSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('drop_in_sessions')
    .insert({
      tenant_id: tenantId,
      classroom_id: data.classroom_id,
      day_of_week: data.day_of_week ?? null,
      date: data.date ?? null,
      start_time: data.start_time,
      end_time: data.end_time,
      capacity: data.capacity,
      notes: data.notes ?? null,
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to create drop-in session' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.session.created',
    entity_type: 'drop_in_session',
    entity_id: row.id,
    after_data: data,
  })

  revalidatePath(PATH)
  return { ok: true, id: row.id }
}

export async function updateDropInSession(
  input: UpdateDropInSessionInput,
): Promise<DropInSessionState> {
  await assertRole('admin')

  const parsed = UpdateDropInSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('drop_in_sessions')
    .update({
      classroom_id: data.classroom_id,
      day_of_week: data.day_of_week ?? null,
      date: data.date ?? null,
      start_time: data.start_time,
      end_time: data.end_time,
      capacity: data.capacity,
      notes: data.notes ?? null,
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
    action: 'drop_in.session.updated',
    entity_type: 'drop_in_session',
    entity_id: data.id,
    after_data: data,
  })

  revalidatePath(PATH)
  return { ok: true, id: data.id }
}

export async function deleteDropInSession(
  input: DeleteDropInSessionInput,
): Promise<DropInSessionState> {
  await assertRole('admin')

  const parsed = DeleteDropInSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { id } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('drop_in_sessions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.session.deleted',
    entity_type: 'drop_in_session',
    entity_id: id,
  })

  revalidatePath(PATH)
  return { ok: true, id }
}
