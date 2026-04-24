// @anchor: cca.curriculum.activity-library.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  CreateCurriculumActivitySchema,
  UpdateCurriculumActivitySchema,
  DeleteCurriculumActivitySchema,
  type CreateCurriculumActivityInput,
} from '@/lib/schemas/curriculum'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createCurriculumActivity(
  input: CreateCurriculumActivityInput,
): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = CreateCurriculumActivitySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('curriculum_activities')
    .insert({
      tenant_id: tenantId,
      title: data.title,
      description: data.description ?? null,
      subject_area: data.subject_area ?? null,
      age_range_min_months: data.age_range_min_months ?? null,
      age_range_max_months: data.age_range_max_months ?? null,
      duration_minutes: data.duration_minutes ?? null,
      materials: data.materials ?? null,
      instructions: data.instructions ?? null,
      domain_ids: data.domain_ids,
      tags: data.tags,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create activity' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'curriculum_activity.created',
    entity_type: 'curriculum_activity',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum/activities')
  return { ok: true, id: row.id }
}

export async function updateCurriculumActivity(input: unknown): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = UpdateCurriculumActivitySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const patch: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from('curriculum_activities')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'curriculum_activity.updated',
    entity_type: 'curriculum_activity',
    entity_id: id,
    after_data: rest as unknown as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/curriculum/activities')
  return { ok: true, id }
}

export async function deleteCurriculumActivity(input: { id: string }): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteCurriculumActivitySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('curriculum_activities')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'curriculum_activity.archived',
    entity_type: 'curriculum_activity',
    entity_id: parsed.data.id,
  })

  revalidatePath('/portal/admin/curriculum/activities')
  return { ok: true }
}
