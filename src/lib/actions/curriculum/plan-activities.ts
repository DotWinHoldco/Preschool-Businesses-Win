// @anchor: cca.curriculum.plan-activities.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  AttachPlanActivitySchema,
  UpdatePlanActivitySchema,
  DeletePlanActivitySchema,
  CompletePlanActivitySchema,
  type AttachPlanActivityInput,
} from '@/lib/schemas/curriculum'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function attachPlanActivity(input: AttachPlanActivityInput): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = AttachPlanActivitySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('lesson_plan_activities')
    .insert({
      tenant_id: tenantId,
      lesson_plan_id: data.lesson_plan_id,
      day_of_week: data.day_of_week,
      time_slot: data.time_slot ?? null,
      activity_name: data.activity_name,
      description: data.description ?? null,
      materials_needed: data.materials_needed ?? null,
      duration_minutes: data.duration_minutes ?? null,
      standards_addressed: data.standards_addressed,
      completed: false,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add activity' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan_activity.attached',
    entity_type: 'lesson_plan_activity',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/curriculum/${data.lesson_plan_id}`)
  return { ok: true, id: row.id }
}

export async function updatePlanActivity(input: unknown): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = UpdatePlanActivitySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { data: updated, error } = await supabase
    .from('lesson_plan_activities')
    .update(rest)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('lesson_plan_id')
    .single()
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan_activity.updated',
    entity_type: 'lesson_plan_activity',
    entity_id: id,
    after_data: rest as unknown as Record<string, unknown>,
  })

  if (updated?.lesson_plan_id) {
    revalidatePath(`/portal/admin/curriculum/${updated.lesson_plan_id}`)
  }
  return { ok: true, id }
}

export async function deletePlanActivity(input: { id: string }): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = DeletePlanActivitySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row } = await supabase
    .from('lesson_plan_activities')
    .select('lesson_plan_id')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await supabase
    .from('lesson_plan_activities')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan_activity.deleted',
    entity_type: 'lesson_plan_activity',
    entity_id: parsed.data.id,
  })

  if (row?.lesson_plan_id) revalidatePath(`/portal/admin/curriculum/${row.lesson_plan_id}`)
  return { ok: true }
}

export async function completePlanActivity(input: unknown): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = CompletePlanActivitySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, completed, notes } = parsed.data

  const { data: updated, error } = await supabase
    .from('lesson_plan_activities')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? actorId : null,
      notes: notes ?? null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('lesson_plan_id')
    .single()
  if (error) return { ok: false, error: error.message }

  if (updated?.lesson_plan_id) revalidatePath(`/portal/admin/curriculum/${updated.lesson_plan_id}`)
  return { ok: true, id }
}
