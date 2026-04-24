// @anchor: cca.leads.convert-edit-notes
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  EditLeadSchema,
  DeleteLeadSchema,
  ConvertLeadToApplicationSchema,
  AddLeadNoteSchema,
  type EditLeadInput,
  type DeleteLeadInput,
  type ConvertLeadToApplicationInput,
  type AddLeadNoteInput,
} from '@/lib/schemas/lead'

export type LeadActionState = {
  ok: boolean
  error?: string
  id?: string
}

// ---------------------------------------------------------------------------
// Edit lead (dialog-driven update)
// ---------------------------------------------------------------------------

export async function updateLead(input: EditLeadInput): Promise<LeadActionState> {
  await assertRole('front_desk')

  const parsed = EditLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const { id, ...fields } = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_leads')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Lead not found' }
  }

  const { error } = await supabase
    .from('enrollment_leads')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  if (fields.status && fields.status !== before.status) {
    await supabase.from('lead_activities').insert({
      tenant_id: tenantId,
      lead_id: id,
      activity_type: 'status_changed',
      description: `Status changed from ${before.status} to ${fields.status}`,
      performed_by: actorId,
    })
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'lead.updated',
    entityType: 'enrollment_lead',
    entityId: id,
    before: before as Record<string, unknown>,
    after: fields as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/leads/${id}`)
  revalidatePath('/portal/admin/leads')
  return { ok: true, id }
}

// ---------------------------------------------------------------------------
// Delete lead
// ---------------------------------------------------------------------------

export async function deleteLead(input: DeleteLeadInput): Promise<LeadActionState> {
  await assertRole('admin')

  const parsed = DeleteLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_leads')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Lead not found' }
  }

  const { error } = await supabase
    .from('enrollment_leads')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'lead.deleted',
    entityType: 'enrollment_lead',
    entityId: parsed.data.id,
    before: before as Record<string, unknown>,
  })

  revalidatePath('/portal/admin/leads')
  return { ok: true, id: parsed.data.id }
}

// ---------------------------------------------------------------------------
// Convert lead to application
// ---------------------------------------------------------------------------

export async function convertLeadToApplication(
  input: ConvertLeadToApplicationInput,
): Promise<LeadActionState> {
  await assertRole('front_desk')

  const parsed = ConvertLeadToApplicationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('*')
    .eq('id', parsed.data.lead_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) {
    return { ok: false, error: 'Lead not found' }
  }

  // Pre-fill application fields from the lead.
  const childFullName = (lead.child_name ?? '').trim()
  const [childFirst, ...childRest] = childFullName.split(/\s+/)
  const childLast = childRest.join(' ')

  const { data: app, error } = await supabase
    .from('enrollment_applications')
    .insert({
      tenant_id: tenantId,
      parent_first_name: lead.parent_first_name ?? '',
      parent_last_name: lead.parent_last_name ?? '',
      parent_email: lead.parent_email ?? '',
      parent_phone: lead.parent_phone ?? '',
      student_first_name: childFirst || 'Unknown',
      student_last_name: childLast || '',
      program_type: lead.program_interest ?? null,
      triage_status: 'reviewing',
      pipeline_stage: 'form_submitted',
      how_heard: lead.source ?? null,
      application_metadata: { converted_from_lead_id: lead.id },
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !app) {
    return { ok: false, error: error?.message ?? 'Failed to create application' }
  }

  // Mark lead converted.
  await supabase
    .from('enrollment_leads')
    .update({
      status: 'converted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
    .eq('tenant_id', tenantId)

  // Record linkage via activity.
  await supabase.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    activity_type: 'application_sent',
    description: `Converted to application ${app.id}`,
    performed_by: actorId,
  })

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'lead.converted',
    entityType: 'enrollment_lead',
    entityId: lead.id,
    after: { application_id: app.id },
  })

  revalidatePath(`/portal/admin/leads/${lead.id}`)
  revalidatePath('/portal/admin/leads')
  revalidatePath(`/portal/admin/enrollment/${app.id}`)
  return { ok: true, id: app.id }
}

// ---------------------------------------------------------------------------
// Add lead note
// ---------------------------------------------------------------------------

export async function addLeadNote(input: AddLeadNoteInput): Promise<LeadActionState> {
  await assertRole('front_desk')

  const parsed = AddLeadNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('lead_activities')
    .insert({
      tenant_id: tenantId,
      lead_id: data.lead_id,
      activity_type: 'note',
      description: data.note_body,
      performed_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to add note' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'lead.note_added',
    entityType: 'lead_activity',
    entityId: row.id,
    after: { lead_id: data.lead_id, note_body: data.note_body },
  })

  revalidatePath(`/portal/admin/leads/${data.lead_id}`)
  return { ok: true, id: row.id }
}
