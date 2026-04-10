'use server'

// @anchor: cca.checklist.assign
// Assign checklist template to a user/entity
// See CCA_BUILD_BRIEF.md §34

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { AssignChecklistSchema, type AssignChecklistInput } from '@/lib/schemas/checklist'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export async function assignChecklist(input: AssignChecklistInput) {
  await assertRole('admin')

  const parsed = AssignChecklistSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Verify the template exists and is active
  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id, is_active')
    .eq('id', parsed.data.template_id)
    .eq('tenant_id', tenantId)
    .single()

  if (templateError || !template) {
    return { ok: false as const, error: { _form: ['Checklist template not found'] } }
  }

  if (!template.is_active) {
    return { ok: false as const, error: { _form: ['Checklist template is inactive'] } }
  }

  // Create the assignment
  const { data: assignment, error: assignError } = await supabase
    .from('checklist_assignments')
    .insert({
      tenant_id: tenantId,
      template_id: parsed.data.template_id,
      assigned_to_user_id: parsed.data.assigned_to_user_id,
      assigned_to_entity_type: parsed.data.assigned_to_entity_type,
      assigned_to_entity_id: parsed.data.assigned_to_entity_id,
      assigned_by: actorId,
      assigned_at: new Date().toISOString(),
      due_date: parsed.data.due_date ?? null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (assignError) {
    return { ok: false as const, error: { _form: [assignError.message] } }
  }

  // Create placeholder responses for each item in the template
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('template_id', parsed.data.template_id)
    .eq('tenant_id', tenantId)

  if (items && items.length > 0) {
    const responses = items.map((item) => ({
      tenant_id: tenantId,
      assignment_id: assignment.id as string,
      item_id: item.id as string,
      status: 'pending' as const,
    }))

    await supabase.from('checklist_responses').insert(responses)
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'checklist.assign',
    entityType: 'checklist_assignment',
    entityId: assignment.id as string,
    after: { template_id: parsed.data.template_id, assigned_to_user_id: parsed.data.assigned_to_user_id },
  })

  return { ok: true as const, assignmentId: assignment.id as string }
}
