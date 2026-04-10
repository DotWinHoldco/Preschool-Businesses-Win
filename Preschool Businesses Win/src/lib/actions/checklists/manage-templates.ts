'use server'

// @anchor: cca.checklist.manage-templates
// Create/update checklist templates
// See CCA_BUILD_BRIEF.md §34

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import {
  CreateChecklistTemplateSchema,
  UpdateChecklistTemplateSchema,
  CreateChecklistItemSchema,
  type CreateChecklistTemplateInput,
  type UpdateChecklistTemplateInput,
  type CreateChecklistItemInput,
} from '@/lib/schemas/checklist'

export async function createChecklistTemplate(input: CreateChecklistTemplateInput) {
  const parsed = CreateChecklistTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      target_type: parsed.data.target_type,
      description: parsed.data.description ?? null,
      is_active: parsed.data.is_active,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, templateId: data.id as string }
}

export async function updateChecklistTemplate(input: UpdateChecklistTemplateInput) {
  const parsed = UpdateChecklistTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.target_type !== undefined) updateData.target_type = parsed.data.target_type
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('checklist_templates')
    .update(updateData)
    .eq('id', parsed.data.template_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const }
}

export async function addChecklistItem(input: CreateChecklistItemInput) {
  const parsed = CreateChecklistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      tenant_id: tenantId,
      template_id: parsed.data.template_id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      item_type: parsed.data.item_type,
      required: parsed.data.required,
      sort_order: parsed.data.sort_order,
      deadline_days_from_assignment: parsed.data.deadline_days_from_assignment ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, itemId: data.id as string }
}
