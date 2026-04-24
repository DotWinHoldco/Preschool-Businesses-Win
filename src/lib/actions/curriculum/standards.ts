// @anchor: cca.curriculum.standards.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  CreateLearningStandardSchema,
  UpdateLearningStandardSchema,
  DeleteLearningStandardSchema,
  MapPlanStandardSchema,
  UnmapPlanStandardSchema,
  type CreateLearningStandardInput,
} from '@/lib/schemas/curriculum'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createLearningStandard(
  input: CreateLearningStandardInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateLearningStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('learning_standards')
    .insert({
      tenant_id: tenantId,
      framework: data.framework,
      code: data.code,
      title: data.title,
      description: data.description ?? null,
      domain_id: data.domain_id ?? null,
      age_range_min_months: data.age_range_min_months ?? null,
      age_range_max_months: data.age_range_max_months ?? null,
      sort_order: data.sort_order,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create standard' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'learning_standard.created',
    entity_type: 'learning_standard',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum/standards')
  return { ok: true, id: row.id }
}

export async function updateLearningStandard(input: unknown): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateLearningStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('learning_standards')
    .update(rest)
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'learning_standard.updated',
    entity_type: 'learning_standard',
    entity_id: id,
    after_data: rest as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum/standards')
  return { ok: true, id }
}

export async function deleteLearningStandard(input: { id: string }): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteLearningStandardSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('learning_standards')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'learning_standard.deleted',
    entity_type: 'learning_standard',
    entity_id: parsed.data.id,
  })

  revalidatePath('/portal/admin/curriculum/standards')
  return { ok: true }
}

export async function mapPlanStandard(input: unknown): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = MapPlanStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('lesson_plan_standards')
    .upsert(
      {
        tenant_id: tenantId,
        lesson_plan_id: data.lesson_plan_id,
        standard_id: data.standard_id,
        coverage_level: data.coverage_level,
        notes: data.notes ?? null,
      },
      { onConflict: 'lesson_plan_id,standard_id' },
    )
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to map standard' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan_standard.mapped',
    entity_type: 'lesson_plan_standard',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/curriculum/${data.lesson_plan_id}`)
  return { ok: true, id: row.id }
}

export async function unmapPlanStandard(input: unknown): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = UnmapPlanStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)
  const { lesson_plan_id, standard_id } = parsed.data

  const { error } = await supabase
    .from('lesson_plan_standards')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('lesson_plan_id', lesson_plan_id)
    .eq('standard_id', standard_id)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/portal/admin/curriculum/${lesson_plan_id}`)
  return { ok: true }
}
