// @anchor: cca.training.manage-requirements
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  CreateTrainingRequirementSchema,
  UpdateTrainingRequirementSchema,
  DeleteTrainingRequirementSchema,
  type CreateTrainingRequirementInput,
  type UpdateTrainingRequirementInput,
  type DeleteTrainingRequirementInput,
} from '@/lib/schemas/training'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createTrainingRequirement(
  input: CreateTrainingRequirementInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateTrainingRequirementSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const d = parsed.data
  const { data, error } = await supabase
    .from('training_requirements')
    .insert({
      tenant_id: tenantId,
      title: d.title,
      topic_category: d.topic_category,
      cadence: d.cadence,
      required_hours: d.required_hours,
      required_for_roles: d.required_for_roles,
      description: d.description ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Failed to create requirement' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.requirement.created',
    entityType: 'training_requirement',
    entityId: data.id,
    after: { title: d.title, cadence: d.cadence },
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: data.id }
}

export async function updateTrainingRequirement(
  input: UpdateTrainingRequirementInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateTrainingRequirementSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const d = parsed.data
  const update: Record<string, unknown> = {}
  if (d.title !== undefined) update.title = d.title
  if (d.topic_category !== undefined) update.topic_category = d.topic_category
  if (d.cadence !== undefined) update.cadence = d.cadence
  if (d.required_hours !== undefined) update.required_hours = d.required_hours
  if (d.required_for_roles !== undefined) update.required_for_roles = d.required_for_roles
  if (d.description !== undefined) update.description = d.description

  const { error } = await supabase
    .from('training_requirements')
    .update(update)
    .eq('id', d.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.requirement.updated',
    entityType: 'training_requirement',
    entityId: d.id,
    after: update,
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: d.id }
}

export async function deleteTrainingRequirement(
  input: DeleteTrainingRequirementInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteTrainingRequirementSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('training_requirements')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'training.requirement.deleted',
    entityType: 'training_requirement',
    entityId: parsed.data.id,
  })

  revalidatePath('/portal/admin/training')
  return { ok: true, id: parsed.data.id }
}
