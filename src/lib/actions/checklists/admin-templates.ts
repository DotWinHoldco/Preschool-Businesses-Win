// @anchor: cca.checklist.admin-templates
// Thin wrappers used by the admin UI that match the { ok, error?, id? } shape
// required by the admin actions spec, and call revalidatePath().
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  CreateChecklistTemplateSchema,
  UpdateChecklistTemplateSchema,
  CreateChecklistItemSchema,
  type CreateChecklistTemplateInput,
  type UpdateChecklistTemplateInput,
  type CreateChecklistItemInput,
} from '@/lib/schemas/checklist'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function createChecklistTemplate(
  input: CreateChecklistTemplateInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateChecklistTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data
  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({
      tenant_id: tenantId,
      name: d.name,
      target_type: d.target_type,
      description: d.description ?? null,
      is_active: d.is_active,
      created_by: actorId,
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Create failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.template.created',
    entityType: 'checklist_template',
    entityId: data.id,
    after: { name: d.name, target_type: d.target_type },
  })
  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: data.id }
}

export async function updateChecklistTemplate(
  input: UpdateChecklistTemplateInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateChecklistTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data
  const update: Record<string, unknown> = {}
  if (d.name !== undefined) update.name = d.name
  if (d.target_type !== undefined) update.target_type = d.target_type
  if (d.description !== undefined) update.description = d.description
  if (d.is_active !== undefined) update.is_active = d.is_active

  const { error } = await supabase
    .from('checklist_templates')
    .update(update)
    .eq('id', d.template_id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.template.updated',
    entityType: 'checklist_template',
    entityId: d.template_id,
    after: update,
  })
  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: d.template_id }
}

export async function createChecklistItem(input: CreateChecklistItemInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = CreateChecklistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      tenant_id: tenantId,
      template_id: d.template_id,
      title: d.title,
      description: d.description ?? null,
      item_type: d.item_type,
      required: d.required,
      sort_order: d.sort_order,
      deadline_days_from_assignment: d.deadline_days_from_assignment ?? null,
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Create failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.item.created',
    entityType: 'checklist_item',
    entityId: data.id,
    after: { template_id: d.template_id, title: d.title },
  })
  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: data.id }
}
