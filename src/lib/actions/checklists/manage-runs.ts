// @anchor: cca.checklist.manage-runs
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  AssignChecklistRunSchema,
  CompleteChecklistRunItemSchema,
  CompleteChecklistRunSchema,
  ArchiveChecklistTemplateSchema,
  UpdateChecklistItemSchema,
  DeleteChecklistItemSchema,
  type AssignChecklistRunInput,
  type CompleteChecklistRunItemInput,
  type CompleteChecklistRunInput,
  type ArchiveChecklistTemplateInput,
  type UpdateChecklistItemInput,
  type DeleteChecklistItemInput,
} from '@/lib/schemas/checklist'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionState = { ok: boolean; error?: string; id?: string }

// Assign — creates a `checklist_runs` row per assignee + `checklist_run_items`
export async function assignChecklist(input: AssignChecklistRunInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = AssignChecklistRunSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data

  // Fetch items on template
  const { data: items, error: itemsErr } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('template_id', d.template_id)
    .eq('tenant_id', tenantId)

  if (itemsErr) return { ok: false, error: itemsErr.message }

  const runIds: string[] = []
  for (const assignee of d.assignees) {
    const { data: run, error: runErr } = await supabase
      .from('checklist_runs')
      .insert({
        tenant_id: tenantId,
        template_id: d.template_id,
        assigned_to: assignee,
        target_entity_type: d.target_entity_type ?? null,
        target_entity_id: d.target_entity_id ?? null,
        due_date: d.due_date ?? null,
        status: 'pending',
        notes: d.notes ?? null,
        created_by: actorId,
      })
      .select('id')
      .single()

    if (runErr || !run) {
      return { ok: false, error: runErr?.message ?? 'Failed to create run' }
    }
    runIds.push(run.id)

    if (items && items.length > 0) {
      const rows = items.map((it) => ({
        tenant_id: tenantId,
        run_id: run.id,
        item_id: it.id,
        is_checked: false,
      }))
      const { error: riErr } = await supabase.from('checklist_run_items').insert(rows)
      if (riErr) return { ok: false, error: riErr.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'checklist.run.assigned',
      entityType: 'checklist_run',
      entityId: run.id,
      after: { template_id: d.template_id, assignee, due_date: d.due_date },
    })
  }

  revalidatePath('/portal/admin/checklists')
  revalidatePath('/portal/admin/checklists/tracking')
  return { ok: true, id: runIds[0] }
}

export async function completeChecklistRunItem(
  input: CompleteChecklistRunItemInput,
): Promise<ActionState> {
  await assertRole('aide')
  const parsed = CompleteChecklistRunItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data

  const update: Record<string, unknown> = {
    is_checked: d.is_checked,
    notes: d.notes ?? null,
    photo_path: d.photo_path ?? null,
  }
  if (d.is_checked) {
    update.checked_at = new Date().toISOString()
    update.checked_by = actorId
  } else {
    update.checked_at = null
    update.checked_by = null
  }

  const { data: updated, error } = await supabase
    .from('checklist_run_items')
    .update(update)
    .eq('id', d.run_item_id)
    .eq('tenant_id', tenantId)
    .select('run_id')
    .single()

  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Update failed' }
  }

  // Bump run status to in_progress if currently pending
  await supabase
    .from('checklist_runs')
    .update({ status: 'in_progress' })
    .eq('id', updated.run_id)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.run_item.toggled',
    entityType: 'checklist_run_item',
    entityId: d.run_item_id,
    after: { is_checked: d.is_checked },
  })

  revalidatePath('/portal/admin/checklists/tracking')
  return { ok: true, id: d.run_item_id }
}

export async function completeChecklistRun(input: CompleteChecklistRunInput): Promise<ActionState> {
  await assertRole('aide')
  const parsed = CompleteChecklistRunSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('checklist_runs')
    .update({
      status: 'completed',
      completed_at: now,
      completed_by: actorId,
      notes: d.notes ?? undefined,
    })
    .eq('id', d.run_id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.run.completed',
    entityType: 'checklist_run',
    entityId: d.run_id,
  })

  revalidatePath('/portal/admin/checklists/tracking')
  return { ok: true, id: d.run_id }
}

export async function archiveChecklistTemplate(
  input: ArchiveChecklistTemplateInput,
): Promise<ActionState> {
  await assertRole('admin')
  const parsed = ArchiveChecklistTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('checklist_templates')
    .update({ is_active: false })
    .eq('id', parsed.data.template_id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.template.archived',
    entityType: 'checklist_template',
    entityId: parsed.data.template_id,
  })

  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: parsed.data.template_id }
}

export async function updateChecklistItem(input: UpdateChecklistItemInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = UpdateChecklistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const d = parsed.data

  const update: Record<string, unknown> = {}
  if (d.title !== undefined) update.title = d.title
  if (d.description !== undefined) update.description = d.description
  if (d.item_type !== undefined) update.item_type = d.item_type
  if (d.required !== undefined) update.required = d.required
  if (d.sort_order !== undefined) update.sort_order = d.sort_order
  if (d.deadline_days_from_assignment !== undefined)
    update.deadline_days_from_assignment = d.deadline_days_from_assignment

  const { error } = await supabase
    .from('checklist_items')
    .update(update)
    .eq('id', d.item_id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.item.updated',
    entityType: 'checklist_item',
    entityId: d.item_id,
    after: update,
  })

  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: d.item_id }
}

export async function deleteChecklistItem(input: DeleteChecklistItemInput): Promise<ActionState> {
  await assertRole('admin')
  const parsed = DeleteChecklistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', parsed.data.item_id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'checklist.item.deleted',
    entityType: 'checklist_item',
    entityId: parsed.data.item_id,
  })

  revalidatePath('/portal/admin/checklists')
  return { ok: true, id: parsed.data.item_id }
}
