// @anchor: cca.compliance.dfps.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  CreateDfpsStandardSchema,
  UpdateDfpsStandardStatusSchema,
  DeleteDfpsStandardSchema,
  type CreateDfpsStandardInput,
  type UpdateDfpsStandardStatusInput,
  type DeleteDfpsStandardInput,
} from '@/lib/schemas/compliance'

export type ActionResult = { ok: boolean; error?: string; id?: string }

export async function createDfpsStandard(input: CreateDfpsStandardInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateDfpsStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('dfps_standards')
    .insert({
      tenant_id: tenantId,
      rule_code: parsed.data.rule_code,
      subchapter: parsed.data.subchapter ?? null,
      category: parsed.data.category ?? null,
      rule_text: parsed.data.rule_text,
      applies_to: parsed.data.applies_to,
      compliance_status: parsed.data.compliance_status,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to create standard' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'dfps_standard.created',
    entityType: 'dfps_standard',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/dfps-compliance/standards')
  revalidatePath('/portal/admin/dfps-compliance')
  return { ok: true, id: row.id }
}

export async function updateDfpsStandardStatus(
  input: UpdateDfpsStandardStatusInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateDfpsStandardStatusSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const update: Record<string, unknown> = {
    compliance_status: parsed.data.compliance_status,
    last_checked_at: now,
    last_checked_by: actorId,
    updated_at: now,
  }
  if (parsed.data.evidence_note != null) update.notes = parsed.data.evidence_note
  if (parsed.data.evidence_path != null) update.evidence_path = parsed.data.evidence_path

  const { error } = await supabase
    .from('dfps_standards')
    .update(update)
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'dfps_standard.updated',
    entityType: 'dfps_standard',
    entityId: parsed.data.id,
    after: update,
  })
  revalidatePath('/portal/admin/dfps-compliance/standards')
  revalidatePath('/portal/admin/dfps-compliance')
  return { ok: true, id: parsed.data.id }
}

export async function deleteDfpsStandard(input: DeleteDfpsStandardInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = DeleteDfpsStandardSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('dfps_standards')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'dfps_standard.deleted',
    entityType: 'dfps_standard',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/dfps-compliance/standards')
  revalidatePath('/portal/admin/dfps-compliance')
  return { ok: true, id: parsed.data.id }
}
