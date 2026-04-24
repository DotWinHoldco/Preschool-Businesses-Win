// @anchor: cca.training.manage-records
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  CreateTrainingRecordSchema,
  UpdateTrainingRecordSchema,
  DeleteTrainingRecordSchema,
  VerifyTrainingRecordSchema,
  type CreateTrainingRecordInput,
  type UpdateTrainingRecordInput,
  type DeleteTrainingRecordInput,
  type VerifyTrainingRecordInput,
} from '@/lib/schemas/training'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createTrainingRecord(input: CreateTrainingRecordInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateTrainingRecordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const d = parsed.data
  const year = d.completed_date
    ? new Date(d.completed_date).getFullYear()
    : new Date().getFullYear()

  const { data, error } = await supabase
    .from('training_records')
    .insert({
      tenant_id: tenantId,
      user_id: d.user_id,
      training_name: d.training_name,
      provider: d.provider ?? null,
      training_type: d.training_type,
      topic_category: d.topic_category,
      hours: d.hours,
      completed_date: d.completed_date,
      certificate_path: d.certificate_path ?? null,
      notes: d.notes ?? null,
      year,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Failed to create training record' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.record.created',
    entityType: 'training_record',
    entityId: data.id,
    after: { user_id: d.user_id, training_name: d.training_name, hours: d.hours },
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: data.id }
}

export async function updateTrainingRecord(input: UpdateTrainingRecordInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateTrainingRecordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const d = parsed.data
  const update: Record<string, unknown> = {}
  if (d.training_name !== undefined) update.training_name = d.training_name
  if (d.provider !== undefined) update.provider = d.provider
  if (d.training_type !== undefined) update.training_type = d.training_type
  if (d.topic_category !== undefined) update.topic_category = d.topic_category
  if (d.hours !== undefined) update.hours = d.hours
  if (d.completed_date !== undefined) {
    update.completed_date = d.completed_date
    update.year = new Date(d.completed_date).getFullYear()
  }
  if (d.certificate_path !== undefined) update.certificate_path = d.certificate_path
  if (d.notes !== undefined) update.notes = d.notes

  const { error } = await supabase
    .from('training_records')
    .update(update)
    .eq('id', d.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.record.updated',
    entityType: 'training_record',
    entityId: d.id,
    after: update,
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: d.id }
}

export async function deleteTrainingRecord(input: DeleteTrainingRecordInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteTrainingRecordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('training_records')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.record.deleted',
    entityType: 'training_record',
    entityId: parsed.data.id,
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: parsed.data.id }
}

export async function verifyTrainingRecord(input: VerifyTrainingRecordInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = VerifyTrainingRecordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('training_records')
    .update({
      verified_by: actorId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.record.verified',
    entityType: 'training_record',
    entityId: parsed.data.id,
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: parsed.data.id }
}
