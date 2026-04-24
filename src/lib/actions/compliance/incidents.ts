// @anchor: cca.compliance.incidents.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  CreateIncidentSchema,
  UpdateIncidentSchema,
  CloseIncidentSchema,
  AddIncidentInvolvedSchema,
  AddIncidentAttachmentSchema,
  type CreateIncidentInput,
  type UpdateIncidentInput,
  type CloseIncidentInput,
  type AddIncidentInvolvedInput,
  type AddIncidentAttachmentInput,
} from '@/lib/schemas/incident'

export type ActionResult = { ok: boolean; error?: string; id?: string }

function genIncidentNumber(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `INC-${y}${m}${d}-${rand}`
}

export async function createIncident(input: CreateIncidentInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateIncidentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const data = parsed.data
  const { data: row, error } = await supabase
    .from('incidents')
    .insert({
      tenant_id: tenantId,
      incident_number: genIncidentNumber(),
      incident_date: data.incident_date,
      incident_time: data.incident_time ?? null,
      incident_type: data.incident_type,
      severity: data.severity,
      location: data.location ?? null,
      classroom_id: data.classroom_id ?? null,
      title: data.title,
      description: data.description,
      injury_description: data.injury_description ?? null,
      treatment_provided: data.treatment_provided ?? null,
      parents_notified: data.parents_notified,
      parents_notified_at: data.parents_notified ? new Date().toISOString() : null,
      medical_followup_required: data.medical_followup_required,
      state_report_required: data.state_report_required,
      reported_by: actorId,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create incident' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'incident.created',
    entityType: 'incident',
    entityId: row.id,
    after: data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/compliance/incidents')
  return { ok: true, id: row.id }
}

export async function updateIncident(input: UpdateIncidentInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateIncidentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('incidents')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'incident.updated',
    entityType: 'incident',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/compliance/incidents')
  revalidatePath(`/portal/admin/compliance/incidents/${id}`)
  return { ok: true, id }
}

export async function closeIncident(input: CloseIncidentInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CloseIncidentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('incidents')
    .update({
      status: parsed.data.status,
      closed_at: parsed.data.status === 'closed' ? now : null,
      closed_by: parsed.data.status === 'closed' ? actorId : null,
      updated_at: now,
    })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: `incident.${parsed.data.status}`,
    entityType: 'incident',
    entityId: parsed.data.id,
    after: { status: parsed.data.status, resolution_notes: parsed.data.resolution_notes },
  })
  revalidatePath('/portal/admin/compliance/incidents')
  revalidatePath(`/portal/admin/compliance/incidents/${parsed.data.id}`)
  return { ok: true, id: parsed.data.id }
}

export async function addIncidentInvolved(input: AddIncidentInvolvedInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = AddIncidentInvolvedSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('incident_involved')
    .insert({
      tenant_id: tenantId,
      incident_id: parsed.data.incident_id,
      party_type: parsed.data.party_type,
      student_id: parsed.data.student_id ?? null,
      staff_user_id: parsed.data.staff_user_id ?? null,
      other_name: parsed.data.other_name ?? null,
      statement: parsed.data.statement ?? null,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add involved party' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'incident.involved_added',
    entityType: 'incident',
    entityId: parsed.data.incident_id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath(`/portal/admin/compliance/incidents/${parsed.data.incident_id}`)
  return { ok: true, id: row.id }
}

export async function addIncidentAttachment(
  input: AddIncidentAttachmentInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = AddIncidentAttachmentSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('incident_attachments')
    .insert({
      tenant_id: tenantId,
      incident_id: parsed.data.incident_id,
      file_path: parsed.data.file_path,
      file_name: parsed.data.file_name ?? null,
      attachment_type: parsed.data.attachment_type ?? null,
      uploaded_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add attachment' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'incident.attachment_added',
    entityType: 'incident',
    entityId: parsed.data.incident_id,
    after: { file_path: parsed.data.file_path, file_name: parsed.data.file_name },
  })
  revalidatePath(`/portal/admin/compliance/incidents/${parsed.data.incident_id}`)
  return { ok: true, id: row.id }
}
