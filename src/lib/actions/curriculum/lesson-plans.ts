// @anchor: cca.curriculum.lesson-plans.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  CreateLessonPlanSchema,
  UpdateLessonPlanSchema,
  DeleteLessonPlanSchema,
  type CreateLessonPlanInput,
  type UpdateLessonPlanInput,
} from '@/lib/schemas/curriculum'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createLessonPlan(input: CreateLessonPlanInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateLessonPlanSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('lesson_plans')
    .insert({
      tenant_id: tenantId,
      classroom_id: data.classroom_id,
      week_start_date: data.week_start_date,
      title: data.title,
      theme: data.theme ?? null,
      objectives: data.objectives ?? null,
      materials: data.materials ?? null,
      faith_component: data.faith_component ?? null,
      status: data.status,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create lesson plan' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan.created',
    entity_type: 'lesson_plan',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum')
  return { ok: true, id: row.id }
}

export async function updateLessonPlan(input: UpdateLessonPlanInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateLessonPlanSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const patch: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
  if (rest.status === 'published') patch.published_at = new Date().toISOString()

  const { error } = await supabase
    .from('lesson_plans')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan.updated',
    entity_type: 'lesson_plan',
    entity_id: id,
    after_data: rest as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum')
  revalidatePath(`/portal/admin/curriculum/${id}`)
  return { ok: true, id }
}

export async function deleteLessonPlan(input: { id: string }): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteLessonPlanSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('lesson_plans')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan.deleted',
    entity_type: 'lesson_plan',
    entity_id: parsed.data.id,
  })

  revalidatePath('/portal/admin/curriculum')
  return { ok: true }
}
